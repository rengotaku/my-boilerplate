package config

import (
	"context"
	"testing"
	"time"
)

func TestLoad_Defaults(t *testing.T) {
	cfg, err := Load(context.Background())
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "8084" {
		t.Errorf("Port = %q, want 8084", cfg.Port)
	}
	if cfg.WorkerInterval != 15*time.Second {
		t.Errorf("WorkerInterval = %v, want 15s", cfg.WorkerInterval)
	}
	if cfg.ShutdownTimeout != 10*time.Second {
		t.Errorf("ShutdownTimeout = %v, want 10s", cfg.ShutdownTimeout)
	}
}

func TestLoad_InvalidDurationReturnsError(t *testing.T) {
	t.Setenv("WORKER_INTERVAL", "not-a-duration")
	if _, err := Load(context.Background()); err == nil {
		t.Error("Load() with invalid duration = nil error, want error")
	}
}

func TestLoad_EnvOverride(t *testing.T) {
	t.Setenv("PORT", "9999")
	t.Setenv("WORKER_INTERVAL", "2s")
	cfg, err := Load(context.Background())
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "9999" {
		t.Errorf("Port = %q, want 9999", cfg.Port)
	}
	if cfg.WorkerInterval != 2*time.Second {
		t.Errorf("WorkerInterval = %v, want 2s", cfg.WorkerInterval)
	}
}
