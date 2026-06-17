package worker

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"go-react-admin/internal/observability"
	"go-react-admin/internal/persistlog"
	"go-react-admin/internal/store"
)

func newDaemon(t *testing.T) (*Daemon, *store.Store, *persistlog.Writer) {
	t.Helper()
	st, err := store.Open(filepath.Join(t.TempDir(), "w.db"))
	if err != nil {
		t.Fatalf("store.Open: %v", err)
	}
	t.Cleanup(func() { _ = st.Close() })
	logs, err := persistlog.New(t.TempDir())
	if err != nil {
		t.Fatalf("persistlog.New: %v", err)
	}
	d := New(time.Hour, 0, st, logs, observability.New())
	return d, st, logs
}

func TestNew_SeedsJobsWithSchedules(t *testing.T) {
	_, st, _ := newDaemon(t)
	jobs, err := st.ListJobs()
	if err != nil {
		t.Fatalf("ListJobs: %v", err)
	}
	if len(jobs) == 0 {
		t.Fatal("expected seeded jobs")
	}
	for _, j := range jobs {
		if j.Schedule == "" {
			t.Errorf("seeded job %q has no schedule", j.Name)
		}
	}
}

func TestExecute_ProducesRunWithPhasesMetricsLogs(t *testing.T) {
	d, st, logs := newDaemon(t)
	job, _ := st.CreateJob("once", "task", "@every 1s", true)

	run, err := d.execute(context.Background(), job)
	if err != nil {
		t.Fatalf("execute: %v", err)
	}
	if run.FinishedAt == nil {
		t.Error("run should be finished")
	}
	phases, _ := st.ListPhases(run.ID)
	if len(phases) == 0 {
		t.Error("expected phases")
	}
	lines, _ := logs.Read(run.ID)
	if len(lines) == 0 {
		t.Error("expected log lines")
	}
}

func TestDue(t *testing.T) {
	d, st, _ := newDaemon(t)

	// A job that runs every second, created in the past, is due now.
	jobDue, _ := st.CreateJob("due", "task", "@every 1s", true)
	if !d.due(jobDue, jobDue.CreatedAt.Add(2*time.Second)) {
		t.Error("expected job to be due")
	}

	// A far-future daily job created now is not due immediately.
	jobNotDue, _ := st.CreateJob("nightly", "batch", "0 2 * * *", true)
	if d.due(jobNotDue, jobNotDue.CreatedAt.Add(time.Minute)) {
		t.Error("nightly job should not be due a minute after creation")
	}

	// Invalid schedule is never due.
	bad := store.Job{ID: jobDue.ID, Schedule: "not a cron", CreatedAt: jobDue.CreatedAt}
	if d.due(bad, time.Now()) {
		t.Error("invalid schedule should not be due")
	}
}

func TestEvaluate_RunsOnlyDueEnabledJobs(t *testing.T) {
	d, st, _ := newDaemon(t)
	// Clear seeds for a deterministic set.
	for _, j := range mustList(t, st) {
		_ = st.DeleteJob(j.ID)
	}

	dueJob, _ := st.CreateJob("due", "task", "@every 1s", true)
	_, _ = st.CreateJob("disabled", "task", "@every 1s", false)
	_, _ = st.CreateJob("future", "task", "0 2 * * *", true)

	d.evaluate(context.Background(), time.Now().Add(5*time.Second))

	dueRuns, _ := st.CountRunsByJob(dueJob.ID)
	if dueRuns != 1 {
		t.Errorf("due job runs = %d, want 1", dueRuns)
	}
	all, _, _ := st.ListRuns(store.RunFilter{}, 1, 100)
	if len(all) != 1 {
		t.Errorf("total runs = %d, want 1 (only the due+enabled job)", len(all))
	}
}

func TestRun_StopsOnContextCancel(t *testing.T) {
	st, _ := store.Open(filepath.Join(t.TempDir(), "r.db"))
	t.Cleanup(func() { _ = st.Close() })
	logs, _ := persistlog.New(t.TempDir())
	d := New(10*time.Millisecond, 0, st, logs, observability.New())

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- d.Run(ctx) }()
	time.Sleep(25 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Errorf("Run() = %v, want nil", err)
		}
	case <-time.After(time.Second):
		t.Fatal("Run() did not return after cancel")
	}
}

func mustList(t *testing.T, st *store.Store) []store.Job {
	t.Helper()
	jobs, err := st.ListJobs()
	if err != nil {
		t.Fatalf("ListJobs: %v", err)
	}
	return jobs
}

func TestExecute_ProducesBothSucceededAndFailed(t *testing.T) {
	d, st, _ := newDaemon(t)
	job, _ := st.CreateJob("mix", "task", "@every 1s", true)
	var sawOK, sawFail bool
	for i := 0; i < 30; i++ {
		run, err := d.execute(context.Background(), job)
		if err != nil {
			t.Fatalf("execute: %v", err)
		}
		switch run.Status {
		case store.StatusSucceeded:
			sawOK = true
		case store.StatusFailed:
			sawFail = true
		}
	}
	if !sawOK || !sawFail {
		t.Errorf("over 30 runs: ok=%v fail=%v, want both", sawOK, sawFail)
	}
}

func TestExecute_CanceledContextStopsSleep(t *testing.T) {
	st, _ := store.Open(filepath.Join(t.TempDir(), "c.db"))
	t.Cleanup(func() { _ = st.Close() })
	logs, _ := persistlog.New(t.TempDir())
	d := New(time.Hour, time.Hour, st, logs, observability.New())
	job, _ := st.CreateJob("slow", "task", "@every 1s", true)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	done := make(chan struct{})
	go func() { _, _ = d.execute(ctx, job); close(done) }()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("execute did not honor canceled context during phase sleep")
	}
}
