// Package config loads runtime configuration from the environment.
//
// Configuration is env-only (envconfig, consistent with the other Go
// templates). The binary exposes just --version / --config flags; there is no
// cobra subcommand tree.
package config

import (
	"context"
	"fmt"
	"time"

	"github.com/sethvargo/go-envconfig"
)

// Config is the resolved runtime configuration. It is safe to print via
// `server --config`; no secrets are stored here.
type Config struct {
	Port            string        `env:"PORT, default=8084" json:"port"`
	DatabaseDSN     string        `env:"DATABASE_DSN, default=admin.db" json:"database_dsn"`
	LogDir          string        `env:"LOG_DIR, default=./data/logs" json:"log_dir"`
	WorkerInterval  time.Duration `env:"WORKER_INTERVAL, default=15s" json:"worker_interval"`
	ShutdownTimeout time.Duration `env:"SHUTDOWN_TIMEOUT, default=10s" json:"shutdown_timeout"`
}

// Load reads configuration from the environment, applying struct-tag defaults.
func Load(ctx context.Context) (Config, error) {
	var c Config
	if err := envconfig.Process(ctx, &c); err != nil {
		return Config{}, fmt.Errorf("load config: %w", err)
	}
	return c, nil
}
