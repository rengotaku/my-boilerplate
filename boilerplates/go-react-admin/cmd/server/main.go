// Command server runs the go-react-admin single binary: a worker daemon and
// the web/API server share one process. There is no cobra subcommand tree —
// all operation happens through the web admin console. The only flags are
// stdlib --version / --config; everything else is configured via env.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
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
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := run(ctx, os.Args[1:], os.Stdout); err != nil {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}

// run parses flags and dispatches: --version / --config short-circuit, otherwise
// it boots the server. Split out of main() so the flag paths are testable.
func run(ctx context.Context, args []string, stdout io.Writer) error {
	fs := flag.NewFlagSet("server", flag.ContinueOnError)
	fs.SetOutput(stdout)
	var (
		showVersion bool
		showConfig  bool
	)
	fs.BoolVar(&showVersion, "version", false, "print version and exit")
	fs.BoolVar(&showConfig, "config", false, "print the resolved configuration and exit")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if showVersion {
		_, err := fmt.Fprintln(stdout, version)
		return err
	}

	if showConfig {
		cfg, err := config.Load(ctx)
		if err != nil {
			return err
		}
		enc := json.NewEncoder(stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(cfg)
	}

	// Run until a real stop. A restart request (POST /api/restart) returns
	// ErrRestart; loop so the editable toml config is reloaded in-process,
	// rather than exiting. SIGINT/SIGTERM cancels ctx → Run returns nil → exit.
	for {
		err := server.Run(ctx)
		if errors.Is(err, server.ErrRestart) && ctx.Err() == nil {
			continue
		}
		return err
	}
}
