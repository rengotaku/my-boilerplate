// Command server runs the go-react-admin single binary: a worker daemon and
// the web/API server share one process. There is no cobra subcommand tree —
// all operation happens through the web admin console. The only flags are
// stdlib --version / --config; everything else is configured via env.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"go-react-admin/internal/config"
	"go-react-admin/internal/server"
)

// version is overridden at build time via -ldflags "-X main.version=...".
var version = "dev"

func main() {
	var (
		showVersion bool
		showConfig  bool
	)
	flag.BoolVar(&showVersion, "version", false, "print version and exit")
	flag.BoolVar(&showConfig, "config", false, "print the resolved configuration and exit")
	flag.Parse()

	if showVersion {
		fmt.Println(version)
		return
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if showConfig {
		cfg, err := config.Load(ctx)
		if err != nil {
			slog.Error("load config", "error", err)
			os.Exit(1)
		}
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		if err := enc.Encode(cfg); err != nil {
			slog.Error("encode config", "error", err)
			os.Exit(1)
		}
		return
	}

	if err := server.Run(ctx); err != nil {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}
