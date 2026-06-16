package store

import (
	"path/filepath"
	"testing"
	"time"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	s, err := Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("Open() error = %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return s
}

func TestJobsAndRunsLifecycle(t *testing.T) {
	s := newTestStore(t)

	job, err := s.CreateJob("nightly", "batch", true)
	if err != nil {
		t.Fatalf("CreateJob: %v", err)
	}
	if job.ID == 0 {
		t.Fatal("CreateJob returned zero id")
	}

	jobs, err := s.ListJobs()
	if err != nil || len(jobs) != 1 {
		t.Fatalf("ListJobs = %v, %v; want 1 job", jobs, err)
	}
	if !jobs[0].Enabled {
		t.Error("job should be enabled")
	}

	start := time.Now().UTC()
	run, err := s.CreateRun(job.ID, start)
	if err != nil {
		t.Fatalf("CreateRun: %v", err)
	}
	if run.Status != StatusRunning {
		t.Errorf("new run status = %q, want running", run.Status)
	}

	pid, err := s.AddPhase(run.ID, 0, "prepare", start)
	if err != nil {
		t.Fatalf("AddPhase: %v", err)
	}
	if err = s.FinishPhase(pid, StatusSucceeded, start.Add(time.Second)); err != nil {
		t.Fatalf("FinishPhase: %v", err)
	}
	if err = s.AddMetric(run.ID, "tokens", 123, start); err != nil {
		t.Fatalf("AddMetric: %v", err)
	}
	if err = s.FinishRun(run.ID, StatusSucceeded, start.Add(2*time.Second)); err != nil {
		t.Fatalf("FinishRun: %v", err)
	}

	got, err := s.GetRun(run.ID)
	if err != nil {
		t.Fatalf("GetRun: %v", err)
	}
	if got.Status != StatusSucceeded {
		t.Errorf("run status = %q, want succeeded", got.Status)
	}
	if got.FinishedAt == nil {
		t.Error("FinishedAt should be set")
	}
	if got.JobName != "nightly" {
		t.Errorf("JobName = %q, want nightly", got.JobName)
	}

	phases, err := s.ListPhases(run.ID)
	if err != nil || len(phases) != 1 {
		t.Fatalf("ListPhases = %v, %v; want 1", phases, err)
	}
	if phases[0].FinishedAt == nil {
		t.Error("phase FinishedAt should be set")
	}
}

func TestGetRun_NotFound(t *testing.T) {
	s := newTestStore(t)
	if _, err := s.GetRun(999); err != ErrNotFound {
		t.Errorf("GetRun(missing) err = %v, want ErrNotFound", err)
	}
}

func TestListRuns_FilterAndPaging(t *testing.T) {
	s := newTestStore(t)
	job, _ := s.CreateJob("j", "k", true)
	base := time.Now().UTC()
	for i := 0; i < 5; i++ {
		r, _ := s.CreateRun(job.ID, base.Add(time.Duration(i)*time.Second))
		status := StatusSucceeded
		if i%2 == 0 {
			status = StatusFailed
		}
		_ = s.FinishRun(r.ID, status, base.Add(time.Minute))
	}

	all, total, err := s.ListRuns(RunFilter{}, 1, 2)
	if err != nil {
		t.Fatalf("ListRuns: %v", err)
	}
	if total != 5 {
		t.Errorf("total = %d, want 5", total)
	}
	if len(all) != 2 {
		t.Errorf("page size = %d, want 2", len(all))
	}
	// newest first
	if all[0].ID < all[1].ID {
		t.Error("runs should be newest-first")
	}

	failed, ftotal, err := s.ListRuns(RunFilter{Status: StatusFailed}, 1, 20)
	if err != nil {
		t.Fatalf("ListRuns(failed): %v", err)
	}
	if ftotal != 3 {
		t.Errorf("failed total = %d, want 3", ftotal)
	}
	for _, r := range failed {
		if r.Status != StatusFailed {
			t.Errorf("filtered run status = %q, want failed", r.Status)
		}
	}

	byJob, jtotal, _ := s.ListRuns(RunFilter{JobID: job.ID}, 1, 20)
	if jtotal != 5 || len(byJob) != 5 {
		t.Errorf("by job = %d/%d, want 5/5", len(byJob), jtotal)
	}
}

func TestListRuns_DefaultPaging(t *testing.T) {
	s := newTestStore(t)
	job, _ := s.CreateJob("j", "k", true)
	for i := 0; i < 3; i++ {
		_, _ = s.CreateRun(job.ID, time.Now().UTC())
	}
	// page<1 and pageSize<1 fall back to page 1 / size 20.
	runs, total, err := s.ListRuns(RunFilter{}, 0, 0)
	if err != nil {
		t.Fatalf("ListRuns: %v", err)
	}
	if total != 3 || len(runs) != 3 {
		t.Errorf("default paging = %d/%d, want 3/3", len(runs), total)
	}
}

func TestAggregateMetrics_EmptyAndRawBuckets(t *testing.T) {
	s := newTestStore(t)
	job, _ := s.CreateJob("j", "k", true)
	run, _ := s.CreateRun(job.ID, time.Now().UTC())

	// No metrics in range → empty series.
	empty, err := s.AggregateMetrics(time.Now().Add(-time.Hour), time.Now(), time.Hour)
	if err != nil {
		t.Fatalf("AggregateMetrics(empty): %v", err)
	}
	if len(empty) != 0 {
		t.Errorf("want no series, got %d", len(empty))
	}

	// bucket=0 → each sample is its own point.
	t0 := time.Date(2026, 6, 16, 10, 0, 0, 0, time.UTC)
	_ = s.AddMetric(run.ID, "tokens", 10, t0)
	_ = s.AddMetric(run.ID, "tokens", 20, t0.Add(time.Minute))
	raw, err := s.AggregateMetrics(t0.Add(-time.Hour), t0.Add(time.Hour), 0)
	if err != nil {
		t.Fatalf("AggregateMetrics(raw): %v", err)
	}
	if len(raw) != 1 || len(raw[0].Points) != 2 {
		t.Errorf("raw buckets = %v, want 1 series / 2 points", raw)
	}
}

func TestAggregateMetrics(t *testing.T) {
	s := newTestStore(t)
	job, _ := s.CreateJob("j", "k", true)
	run, _ := s.CreateRun(job.ID, time.Now().UTC())

	t0 := time.Date(2026, 6, 16, 10, 5, 0, 0, time.UTC)
	_ = s.AddMetric(run.ID, "tokens", 100, t0)
	_ = s.AddMetric(run.ID, "tokens", 50, t0.Add(10*time.Minute)) // same hour bucket
	_ = s.AddMetric(run.ID, "tokens", 30, t0.Add(time.Hour))      // next hour bucket
	_ = s.AddMetric(run.ID, "items", 5, t0)

	series, err := s.AggregateMetrics(t0.Add(-time.Hour), t0.Add(2*time.Hour), time.Hour)
	if err != nil {
		t.Fatalf("AggregateMetrics: %v", err)
	}
	if len(series) != 2 {
		t.Fatalf("series count = %d, want 2 (tokens, items)", len(series))
	}

	byName := map[string][]MetricPoint{}
	for _, ms := range series {
		byName[ms.Name] = ms.Points
	}
	tokens := byName["tokens"]
	if len(tokens) != 2 {
		t.Fatalf("tokens buckets = %d, want 2", len(tokens))
	}
	if tokens[0].Value != 150 {
		t.Errorf("first tokens bucket = %v, want 150 (100+50 summed)", tokens[0].Value)
	}
}
