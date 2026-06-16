// Package worker is the background daemon half of the single binary. It is the
// example "jobs/runs" domain: on each tick it executes a job, producing a run
// with phases, per-phase metrics, and JSONL log lines so every admin-console
// screen has data to display.
package worker

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
	"time"

	"go-react-admin/internal/observability"
	"go-react-admin/internal/persistlog"
	"go-react-admin/internal/store"
)

// phaseNames are the steps every run walks through, in order.
var phaseNames = []string{"prepare", "execute", "report"}

// Daemon periodically executes jobs and records runs until ctx is canceled.
type Daemon struct {
	store    *store.Store
	logs     *persistlog.Writer
	metrics  *observability.Metrics
	rng      *rand.Rand
	interval time.Duration
	step     time.Duration
	next     int
}

// New returns a Daemon. deps may be nil only in the skeleton; in production the
// server wires a real store, log writer, and metrics. New seeds example jobs if
// the store is empty.
func New(interval, step time.Duration, st *store.Store, logs *persistlog.Writer, m *observability.Metrics) *Daemon {
	d := &Daemon{
		interval: interval,
		step:     step,
		store:    st,
		logs:     logs,
		metrics:  m,
		rng:      rand.New(rand.NewSource(1)),
	}
	d.seed()
	return d
}

// seed inserts a couple of example jobs the first time the store is used.
func (d *Daemon) seed() {
	if d.store == nil {
		return
	}
	jobs, err := d.store.ListJobs()
	if err != nil {
		slog.Error("worker seed: list jobs", "error", err)
		return
	}
	if len(jobs) > 0 {
		return
	}
	for _, j := range []struct{ name, kind string }{
		{"nightly-export", "batch"},
		{"metrics-rollup", "aggregate"},
		{"cleanup-temp", "maintenance"},
	} {
		if _, err := d.store.CreateJob(j.name, j.kind, true); err != nil {
			slog.Error("worker seed: create job", "error", err)
		}
	}
}

// Run blocks, executing a job on every tick, until ctx is canceled.
func (d *Daemon) Run(ctx context.Context) error {
	ticker := time.NewTicker(d.interval)
	defer ticker.Stop()

	slog.Info("worker started", "interval", d.interval)
	for {
		select {
		case <-ctx.Done():
			slog.Info("worker stopped")
			return nil
		case <-ticker.C:
			if _, err := d.RunOnce(ctx); err != nil {
				slog.Error("worker run failed", "error", err)
			}
		}
	}
}

// RunOnce executes a single job end to end and returns the resulting run. It is
// exported so tests can drive one deterministic cycle without a ticker.
func (d *Daemon) RunOnce(ctx context.Context) (store.Run, error) {
	jobs, err := d.store.ListJobs()
	if err != nil {
		return store.Run{}, fmt.Errorf("list jobs: %w", err)
	}
	if len(jobs) == 0 {
		return store.Run{}, fmt.Errorf("no jobs to run")
	}
	job := jobs[d.next%len(jobs)]
	d.next++

	start := time.Now().UTC()
	run, err := d.store.CreateRun(job.ID, start)
	if err != nil {
		return store.Run{}, err
	}
	d.appendLog(run.ID, "", "info", fmt.Sprintf("run started for job %q", job.Name))

	// Decide up front whether this run fails, and at which phase, so the data
	// set contains a realistic mix of succeeded/failed runs.
	failAt := -1
	if d.rng.Intn(6) == 0 {
		failAt = d.rng.Intn(len(phaseNames))
	}

	finalStatus := store.StatusSucceeded
	for seq, name := range phaseNames {
		phaseStart := time.Now().UTC()
		phaseID, err := d.store.AddPhase(run.ID, seq, name, phaseStart)
		if err != nil {
			return run, err
		}
		d.appendLog(run.ID, name, "info", fmt.Sprintf("phase %q started", name))

		d.sleep(ctx)

		// Emit a token-like metric sample for the phase.
		tokens := float64(50 + d.rng.Intn(450))
		if err := d.store.AddMetric(run.ID, "tokens", tokens, time.Now().UTC()); err != nil {
			return run, err
		}

		if seq == failAt {
			finalStatus = store.StatusFailed
			d.appendLog(run.ID, name, "error", fmt.Sprintf("phase %q failed", name))
			if err := d.store.FinishPhase(phaseID, store.StatusFailed, time.Now().UTC()); err != nil {
				return run, err
			}
			break
		}

		d.appendLog(run.ID, name, "info", fmt.Sprintf("phase %q completed (%.0f tokens)", name, tokens))
		if err := d.store.FinishPhase(phaseID, store.StatusSucceeded, time.Now().UTC()); err != nil {
			return run, err
		}
	}

	finish := time.Now().UTC()
	if err := d.store.FinishRun(run.ID, finalStatus, finish); err != nil {
		return run, err
	}
	d.appendLog(run.ID, "", "info", fmt.Sprintf("run finished: %s", finalStatus))

	if d.metrics != nil {
		d.metrics.ObserveRun(string(finalStatus), finish.Sub(start))
	}

	run.Status = finalStatus
	run.FinishedAt = &finish
	return run, nil
}

func (d *Daemon) sleep(ctx context.Context) {
	if d.step <= 0 {
		return
	}
	t := time.NewTimer(d.step)
	defer t.Stop()
	select {
	case <-ctx.Done():
	case <-t.C:
	}
}

func (d *Daemon) appendLog(runID int64, phase, level, msg string) {
	if d.logs == nil {
		return
	}
	if err := d.logs.Append(persistlog.Line{
		TS:      time.Now().UTC(),
		RunID:   runID,
		Phase:   phase,
		Level:   level,
		Message: msg,
	}); err != nil {
		slog.Error("worker append log", "error", err)
	}
}
