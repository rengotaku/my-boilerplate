package server

import (
	"context"
	"errors"
	"net"
	"net/http"
	"path/filepath"
	"strconv"
	"testing"
	"time"
)

func setTempEnv(t *testing.T) {
	t.Helper()
	dir := t.TempDir()
	t.Setenv("DATABASE_DSN", filepath.Join(dir, "server.db"))
	t.Setenv("LOG_DIR", filepath.Join(dir, "logs"))
	t.Setenv("CONFIG_FILE", filepath.Join(dir, "config.toml"))
}

// TestRun_GracefulShutdown verifies that Run starts the worker + web server and
// returns nil once the context is canceled (SIGINT/SIGTERM equivalent).
func TestRun_GracefulShutdown(t *testing.T) {
	t.Setenv("PORT", "0") // random free port, avoids collisions in CI
	setTempEnv(t)

	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() { done <- Run(ctx) }()

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

// TestRun_RestartViaAPI verifies the full restart pathway: POST /api/restart
// makes Run tear down and return ErrRestart (which main() loops on to reload).
func TestRun_RestartViaAPI(t *testing.T) {
	port := freePort(t)
	t.Setenv("PORT", port)
	setTempEnv(t)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	done := make(chan error, 1)
	go func() { done <- Run(ctx) }()

	base := "http://127.0.0.1:" + port
	waitFor(t, base+"/health")

	resp, err := http.Post(base+"/api/restart", "application/json", nil)
	if err != nil {
		t.Fatalf("POST /api/restart: %v", err)
	}
	_ = resp.Body.Close()
	if resp.StatusCode != http.StatusAccepted {
		t.Fatalf("restart status = %d, want 202", resp.StatusCode)
	}

	select {
	case err := <-done:
		if !errors.Is(err, ErrRestart) {
			t.Errorf("Run() = %v, want ErrRestart", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Run() did not return ErrRestart after /api/restart")
	}
}

func freePort(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer func() { _ = ln.Close() }()
	addr, ok := ln.Addr().(*net.TCPAddr)
	if !ok {
		t.Fatalf("listener addr is not *net.TCPAddr: %T", ln.Addr())
	}
	return strconv.Itoa(addr.Port)
}

func waitFor(t *testing.T, url string) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		resp, err := http.Get(url)
		if err == nil {
			_ = resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return
			}
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("server did not become ready at %s", url)
}
