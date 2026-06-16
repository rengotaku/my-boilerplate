// Package worker is the background daemon half of the single binary.
//
// In this skeleton it only ticks on an interval; Phase 1b (#249) replaces the
// tick body with the example jobs/runs domain that generates runs, phases,
// metrics, and log lines into the store.
package worker

import (
	"context"
	"log/slog"
	"time"
)

// Daemon periodically performs background work until its context is canceled.
type Daemon struct {
	interval time.Duration
}

// New returns a Daemon that ticks every interval.
func New(interval time.Duration) *Daemon {
	return &Daemon{interval: interval}
}

// Run blocks, ticking until ctx is canceled, then returns nil for a clean stop.
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
			d.tick(ctx)
		}
	}
}

// tick performs one unit of background work. The skeleton just logs; Phase 1b
// generates an example run here.
func (d *Daemon) tick(_ context.Context) {
	slog.Debug("worker tick")
}
