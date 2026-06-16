package server

import (
	"context"
	"path/filepath"
	"testing"
	"time"
)

// TestRun_GracefulShutdown verifies that Run starts the worker + web server and
// returns nil once the context is canceled (SIGINT/SIGTERM equivalent).
func TestRun_GracefulShutdown(t *testing.T) {
	t.Setenv("PORT", "0") // random free port, avoids collisions in CI
	t.Setenv("WORKER_INTERVAL", "10ms")
	t.Setenv("SHUTDOWN_TIMEOUT", "2s")
	t.Setenv("DATABASE_DSN", filepath.Join(t.TempDir(), "server.db"))
	t.Setenv("LOG_DIR", filepath.Join(t.TempDir(), "logs"))

	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() { done <- Run(ctx) }()

	// Give the components a moment to come up, then signal shutdown.
	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Errorf("Run() = %v, want nil on graceful shutdown", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Run() did not return after context cancel")
	}
}
