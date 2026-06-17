// Package config loads runtime configuration from two layers:
//
//   - env (read-only): infrastructure that can't safely change without an
//     operator — Port, DatabaseDSN, LogDir, ConfigFile path.
//   - toml file (editable): runtime-tunable knobs the admin console can edit
//     and apply via a restart — WorkerInterval, ShutdownTimeout.
//
// The split lets the Config screen show which values come from where, keep env
// values immutable, and let the file-backed values be edited + reloaded on
// restart. The binary still exposes only --version / --config flags.
package config

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/pelletier/go-toml/v2"
	"github.com/sethvargo/go-envconfig"
)

// envConfig holds the environment-sourced, read-only settings.
type envConfig struct {
	Port        string `env:"PORT, default=8084"`
	DatabaseDSN string `env:"DATABASE_DSN, default=admin.db"`
	LogDir      string `env:"LOG_DIR, default=./data/logs"`
	ConfigFile  string `env:"CONFIG_FILE, default=config.toml"`
}

// FileConfig is the toml-file-sourced, editable settings. Durations are stored
// as Go duration strings (e.g. "15s") so the file stays human-editable.
type FileConfig struct {
	WorkerInterval  string `toml:"worker_interval"`
	ShutdownTimeout string `toml:"shutdown_timeout"`
}

// Defaults for the file-backed settings, used when the toml file or a key is
// absent.
const (
	defaultWorkerInterval  = "15s"
	defaultShutdownTimeout = "10s"
)

// Config is the fully resolved runtime configuration.
type Config struct {
	// env-sourced (read-only)
	Port        string `json:"port"`
	DatabaseDSN string `json:"database_dsn"`
	LogDir      string `json:"log_dir"`
	ConfigFile  string `json:"config_file"`

	// file-sourced (editable), resolved to durations
	WorkerInterval  time.Duration `json:"worker_interval"`
	ShutdownTimeout time.Duration `json:"shutdown_timeout"`
}

// Load resolves configuration: env for infrastructure, then the toml file for
// the editable runtime knobs. A missing toml file is not an error — defaults
// apply (and EnsureFile can materialize it for first-time editing).
func Load(ctx context.Context) (Config, error) {
	var ec envConfig
	if err := envconfig.Process(ctx, &ec); err != nil {
		return Config{}, fmt.Errorf("load env config: %w", err)
	}

	fc, err := ReadFile(ec.ConfigFile)
	if err != nil {
		return Config{}, err
	}

	workerInterval, err := time.ParseDuration(fc.WorkerInterval)
	if err != nil {
		return Config{}, fmt.Errorf("config %s: worker_interval %q: %w", ec.ConfigFile, fc.WorkerInterval, err)
	}
	shutdownTimeout, err := time.ParseDuration(fc.ShutdownTimeout)
	if err != nil {
		return Config{}, fmt.Errorf("config %s: shutdown_timeout %q: %w", ec.ConfigFile, fc.ShutdownTimeout, err)
	}

	return Config{
		Port:            ec.Port,
		DatabaseDSN:     ec.DatabaseDSN,
		LogDir:          ec.LogDir,
		ConfigFile:      ec.ConfigFile,
		WorkerInterval:  workerInterval,
		ShutdownTimeout: shutdownTimeout,
	}, nil
}

// ReadFile reads the toml file, falling back to defaults for a missing file or
// any unset key. The returned FileConfig always has both fields populated.
func ReadFile(path string) (FileConfig, error) {
	fc := FileConfig{WorkerInterval: defaultWorkerInterval, ShutdownTimeout: defaultShutdownTimeout}

	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return fc, nil
		}
		return FileConfig{}, fmt.Errorf("read config file %s: %w", path, err)
	}

	var parsed FileConfig
	if err := toml.Unmarshal(data, &parsed); err != nil {
		return FileConfig{}, fmt.Errorf("parse config file %s: %w", path, err)
	}
	if parsed.WorkerInterval != "" {
		fc.WorkerInterval = parsed.WorkerInterval
	}
	if parsed.ShutdownTimeout != "" {
		fc.ShutdownTimeout = parsed.ShutdownTimeout
	}
	return fc, nil
}

// WriteFile validates the durations and writes the toml file atomically. It
// does not affect the running process — changes apply on the next restart.
func WriteFile(path string, fc FileConfig) error {
	if _, err := time.ParseDuration(fc.WorkerInterval); err != nil {
		return fmt.Errorf("worker_interval %q: %w", fc.WorkerInterval, err)
	}
	if _, err := time.ParseDuration(fc.ShutdownTimeout); err != nil {
		return fmt.Errorf("shutdown_timeout %q: %w", fc.ShutdownTimeout, err)
	}

	data, err := toml.Marshal(fc)
	if err != nil {
		return fmt.Errorf("marshal config: %w", err)
	}
	header := "# go-react-admin runtime config (editable from the admin console).\n" +
		"# Ports and paths are configured via environment variables instead.\n\n"
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, append([]byte(header), data...), 0o644); err != nil {
		return fmt.Errorf("write config file %s: %w", path, err)
	}
	if err := os.Rename(tmp, path); err != nil {
		return fmt.Errorf("replace config file %s: %w", path, err)
	}
	return nil
}

// EnsureFile creates the toml file with current values if it does not exist, so
// the admin console always has a concrete file to edit.
func EnsureFile(path string, fc FileConfig) error {
	if _, err := os.Stat(path); err == nil {
		return nil
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("stat config file %s: %w", path, err)
	}
	return WriteFile(path, fc)
}
