package config

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestLoad_Defaults(t *testing.T) {
	// Point CONFIG_FILE at a non-existent path so file defaults apply.
	t.Setenv("CONFIG_FILE", filepath.Join(t.TempDir(), "absent.toml"))

	cfg, err := Load(context.Background())
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "8084" {
		t.Errorf("Port = %q, want 8084", cfg.Port)
	}
	if cfg.WorkerInterval != 15*time.Second {
		t.Errorf("WorkerInterval = %v, want 15s (file default)", cfg.WorkerInterval)
	}
	if cfg.ShutdownTimeout != 10*time.Second {
		t.Errorf("ShutdownTimeout = %v, want 10s (file default)", cfg.ShutdownTimeout)
	}
}

func TestLoad_EnvOverride(t *testing.T) {
	t.Setenv("PORT", "9999")
	t.Setenv("CONFIG_FILE", filepath.Join(t.TempDir(), "absent.toml"))
	cfg, err := Load(context.Background())
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Port != "9999" {
		t.Errorf("Port = %q, want 9999", cfg.Port)
	}
}

func TestLoad_FromTomlFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.toml")
	if err := WriteFile(path, FileConfig{WorkerInterval: "2s", ShutdownTimeout: "30s"}); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	t.Setenv("CONFIG_FILE", path)

	cfg, err := Load(context.Background())
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.WorkerInterval != 2*time.Second {
		t.Errorf("WorkerInterval = %v, want 2s (from toml)", cfg.WorkerInterval)
	}
	if cfg.ShutdownTimeout != 30*time.Second {
		t.Errorf("ShutdownTimeout = %v, want 30s (from toml)", cfg.ShutdownTimeout)
	}
}

func TestLoad_InvalidDurationInFileReturnsError(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.toml")
	if err := os.WriteFile(path, []byte(`worker_interval = "not-a-duration"`), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Setenv("CONFIG_FILE", path)
	if _, err := Load(context.Background()); err == nil {
		t.Error("Load() with invalid toml duration = nil error, want error")
	}
}

func TestWriteFile_RejectsInvalidDuration(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.toml")
	if err := WriteFile(path, FileConfig{WorkerInterval: "nope", ShutdownTimeout: "10s"}); err == nil {
		t.Error("WriteFile with invalid duration = nil, want error")
	}
}

func TestWriteFile_UnwritablePathReturnsError(t *testing.T) {
	// Parent directory does not exist → the temp write fails.
	path := filepath.Join(t.TempDir(), "missing-dir", "config.toml")
	if err := WriteFile(path, FileConfig{WorkerInterval: "1s", ShutdownTimeout: "1s"}); err == nil {
		t.Error("WriteFile to nonexistent dir = nil, want error")
	}
}

func TestReadFile_InvalidTomlReturnsError(t *testing.T) {
	path := filepath.Join(t.TempDir(), "bad.toml")
	if err := os.WriteFile(path, []byte("= = not valid toml ="), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := ReadFile(path); err == nil {
		t.Error("ReadFile(invalid toml) = nil, want parse error")
	}
}

func TestReadFile_MissingReturnsDefaults(t *testing.T) {
	fc, err := ReadFile(filepath.Join(t.TempDir(), "absent.toml"))
	if err != nil {
		t.Fatalf("ReadFile(missing): %v", err)
	}
	if fc.WorkerInterval != defaultWorkerInterval || fc.ShutdownTimeout != defaultShutdownTimeout {
		t.Errorf("defaults not applied: %+v", fc)
	}
}

func TestWriteReadRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.toml")
	if err := WriteFile(path, FileConfig{WorkerInterval: "7s", ShutdownTimeout: "12s"}); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}
	fc, err := ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	if fc.WorkerInterval != "7s" || fc.ShutdownTimeout != "12s" {
		t.Errorf("round trip mismatch: %+v", fc)
	}
}

func TestEnsureFile_CreatesWhenAbsent(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.toml")
	if err := EnsureFile(path, FileConfig{WorkerInterval: "15s", ShutdownTimeout: "10s"}); err != nil {
		t.Fatalf("EnsureFile: %v", err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Errorf("EnsureFile did not create file: %v", err)
	}
	// A second call must not error or overwrite.
	if err := EnsureFile(path, FileConfig{WorkerInterval: "99s", ShutdownTimeout: "99s"}); err != nil {
		t.Fatalf("EnsureFile (existing): %v", err)
	}
	fc, _ := ReadFile(path)
	if fc.WorkerInterval != "15s" {
		t.Errorf("EnsureFile overwrote existing file: %+v", fc)
	}
}

func TestLoad_DefaultTimeZoneIsJST(t *testing.T) {
	t.Setenv("CONFIG_FILE", filepath.Join(t.TempDir(), "absent.toml"))
	cfg, err := Load(context.Background())
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.TimeZone != "Asia/Tokyo" {
		t.Errorf("TimeZone = %q, want Asia/Tokyo (JST default)", cfg.TimeZone)
	}
}

func TestLoad_InvalidTimeZoneReturnsError(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.toml")
	if err := os.WriteFile(path, []byte(`time_zone = "Mars/Phobos"`), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Setenv("CONFIG_FILE", path)
	if _, err := Load(context.Background()); err == nil {
		t.Error("Load with invalid time_zone = nil, want error")
	}
}

func TestWriteFile_RejectsInvalidTimeZone(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.toml")
	err := WriteFile(path, FileConfig{WorkerInterval: "15s", ShutdownTimeout: "10s", TimeZone: "Nope/Nope"})
	if err == nil {
		t.Error("WriteFile with invalid time_zone = nil, want error")
	}
}
