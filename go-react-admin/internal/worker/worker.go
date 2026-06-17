// Package worker is the background daemon half of the single binary. It is a
// cron scheduler over the example "jobs/runs" domain: on every check tick it
// runs each enabled job whose schedule is due, producing a run with phases,
// per-phase metrics, and JSONL log lines so every admin-console screen has data.
package worker

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
	"time"

	"go-react-admin/internal/observability"
	"go-react-admin/internal/persistlog"
	"go-react-admin/internal/schedule"
	"go-react-admin/internal/store"
)

// phaseNames are the steps every run walks through, in order.
var phaseNames = []string{"prepare", "execute", "report"}

// Daemon evaluates job schedules on a fixed check interval and runs due jobs.
type Daemon struct {
	store    *store.Store
	logs     *persistlog.Writer
	metrics  *observability.Metrics
	rng      *rand.Rand
	interval time.Duration // how often schedules are evaluated
	step     time.Duration // per-phase delay (0 in tests)
}

// New returns a Daemon. interval is the schedule-check cadence. New seeds a few
// example jobs (with cron schedules) the first time the store is used.
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

// seed inserts example jobs (with schedules) the first time the store is used.
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
	for _, j := range []struct{ name, kind, schedule string }{
		{"demo-sync", "sync", "@every 20s"}, // frequent, keeps the console lively
		{"nightly-export", "batch", "0 2 * * *"},
		{"hourly-rollup", "aggregate", "@hourly"},
	} {
		if _, err := d.store.CreateJob(j.name, j.kind, j.schedule, true); err != nil {
			slog.Error("worker seed: create job", "error", err)
		}
	}
}

// Run blocks, evaluating schedules every interval, until ctx is canceled.
func (d *Daemon) Run(ctx context.Context) error {
	ticker := time.NewTicker(d.interval)
	defer ticker.Stop()

	slog.Info("worker started", "check_interval", d.interval)
	for {
		select {
		case <-ctx.Done():
			slog.Info("worker stopped")
			return nil
		case <-ticker.C:
			d.evaluate(ctx, time.Now().UTC())
		}
	}
}

// evaluate runs every enabled job whose schedule is due at `now`.
func (d *Daemon) evaluate(ctx context.Context, now time.Time) {
	jobs, err := d.store.ListJobs()
	if err != nil {
		slog.Error("worker evaluate: list jobs", "error", err)
		return
	}
	for _, job := range jobs {
		if !job.Enabled {
			continue
		}
		if d.due(job, now) {
			if _, err := d.execute(ctx, job); err != nil {
				slog.Error("worker execute failed", "job", job.Name, "error", err)
			}
		}
	}
}

// due reports whether job's schedule fires at or before `now`, given its last
// run (or creation time for a job that has never run).
func (d *Daemon) due(job store.Job, now time.Time) bool {
	sched, err := schedule.Parse(job.Schedule)
	if err != nil {
		slog.Warn("worker: invalid schedule", "job", job.Name, "schedule", job.Schedule, "error", err)
		return false
	}
	last, err := d.store.LastRunStart(job.ID)
	if err != nil {
		slog.Error("worker: last run lookup", "job", job.Name, "error", err)
		return false
	}
	base := job.CreatedAt
	if last != nil {
		base = *last
	}
	return !sched.Next(base).After(now)
}

// execute runs a single job end to end and returns the resulting run.
func (d *Daemon) execute(ctx context.Context, job store.Job) (store.Run, error) {
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
