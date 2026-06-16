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
	// step 0 → no per-phase sleeps, deterministic + fast.
	d := New(time.Hour, 0, st, logs, observability.New())
	return d, st, logs
}

func TestNew_SeedsJobs(t *testing.T) {
	_, st, _ := newDaemon(t)
	jobs, err := st.ListJobs()
	if err != nil {
		t.Fatalf("ListJobs: %v", err)
	}
	if len(jobs) == 0 {
		t.Fatal("expected seeded jobs")
	}
}

func TestRunOnce_ProducesRunWithPhasesMetricsLogs(t *testing.T) {
	d, st, logs := newDaemon(t)

	run, err := d.RunOnce(context.Background())
	if err != nil {
		t.Fatalf("RunOnce: %v", err)
	}
	if run.FinishedAt == nil {
		t.Error("run should be finished")
	}
	if run.Status != store.StatusSucceeded && run.Status != store.StatusFailed {
		t.Errorf("terminal status = %q", run.Status)
	}

	phases, err := st.ListPhases(run.ID)
	if err != nil || len(phases) == 0 {
		t.Fatalf("expected phases, got %v (%v)", phases, err)
	}

	lines, err := logs.Read(run.ID)
	if err != nil || len(lines) == 0 {
		t.Fatalf("expected log lines, got %v (%v)", lines, err)
	}

	// Metrics should have been recorded for the run window.
	series, err := st.AggregateMetrics(run.StartedAt.Add(-time.Minute), time.Now().Add(time.Minute), 0)
	if err != nil {
		t.Fatalf("AggregateMetrics: %v", err)
	}
	if len(series) == 0 {
		t.Error("expected at least one metric series")
	}
}

func TestRunOnce_RoundRobinsJobs(t *testing.T) {
	d, st, _ := newDaemon(t)
	jobs, _ := st.ListJobs()

	seen := map[int64]bool{}
	for i := 0; i < len(jobs); i++ {
		run, err := d.RunOnce(context.Background())
		if err != nil {
			t.Fatalf("RunOnce: %v", err)
		}
		seen[run.JobID] = true
	}
	if len(seen) != len(jobs) {
		t.Errorf("round-robin covered %d jobs, want %d", len(seen), len(jobs))
	}
}

func TestRunOnce_ProducesBothSucceededAndFailed(t *testing.T) {
	// The RNG is seeded deterministically (seed 1), so a fixed number of runs
	// reliably exercises both the success and failure branches.
	d, _, _ := newDaemon(t)
	var sawSucceeded, sawFailed bool
	for i := 0; i < 30; i++ {
		run, err := d.RunOnce(context.Background())
		if err != nil {
			t.Fatalf("RunOnce: %v", err)
		}
		switch run.Status {
		case store.StatusSucceeded:
			sawSucceeded = true
		case store.StatusFailed:
			sawFailed = true
		}
	}
	if !sawSucceeded || !sawFailed {
		t.Errorf("over 30 runs: succeeded=%v failed=%v, want both", sawSucceeded, sawFailed)
	}
}

func TestRunOnce_RespectsPerPhaseDelay(t *testing.T) {
	st, _ := store.Open(filepath.Join(t.TempDir(), "d.db"))
	t.Cleanup(func() { _ = st.Close() })
	logs, _ := persistlog.New(t.TempDir())
	d := New(time.Hour, 5*time.Millisecond, st, logs, observability.New())

	start := time.Now()
	if _, err := d.RunOnce(context.Background()); err != nil {
		t.Fatalf("RunOnce: %v", err)
	}
	// Three phases × 5ms of sleep means the cycle can't be instantaneous.
	if elapsed := time.Since(start); elapsed < 5*time.Millisecond {
		t.Errorf("elapsed = %v, expected per-phase delay to apply", elapsed)
	}
}

func TestRunOnce_CanceledContextStopsSleep(t *testing.T) {
	st, _ := store.Open(filepath.Join(t.TempDir(), "c.db"))
	t.Cleanup(func() { _ = st.Close() })
	logs, _ := persistlog.New(t.TempDir())
	d := New(time.Hour, time.Hour, st, logs, observability.New())

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // already canceled: sleep should return immediately

	done := make(chan struct{})
	go func() {
		_, _ = d.RunOnce(ctx)
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("RunOnce did not honor canceled context during phase sleep")
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
