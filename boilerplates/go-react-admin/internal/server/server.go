// Package server boots the go-react-admin process.
//
// Run() owns the whole lifecycle — config, logger, and the concurrent startup
// of the worker daemon and the gin web server — so cmd/server/main.go only has
// to wire signals. The two long-running components are supervised together
// with an errgroup: cancelling ctx (SIGINT/SIGTERM) drives both to a graceful
// shutdown, and a fatal error in either one tears the other down.
package server

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lmittmann/tint"
	"golang.org/x/sync/errgroup"

	"go-react-admin/internal/config"
	"go-react-admin/internal/observability"
	"go-react-admin/internal/persistlog"
	"go-react-admin/internal/static"
	"go-react-admin/internal/store"
	"go-react-admin/internal/web"
	"go-react-admin/internal/worker"
)

// perPhaseDelay spaces out worker phases so runs look realistic on the
// timeline. Kept small so a fresh install fills the console quickly.
const perPhaseDelay = 300 * time.Millisecond

// ErrRestart is returned by Run when the admin console requested a restart
// (POST /api/restart). main() treats it as "reload": it calls Run again so the
// editable toml config is re-read, instead of exiting the process.
var ErrRestart = errors.New("restart requested")

// Run boots the worker daemon and the web server in one process and blocks
// until ctx is canceled (graceful shutdown, returns nil), a restart is
// requested (returns ErrRestart), or a component fails (returns that error).
func Run(ctx context.Context) error {
	setupLogger()

	cfg, err := config.Load(ctx)
	if err != nil {
		return err
	}

	// Materialize the toml file on first boot so the console always has a
	// concrete file to edit. Failure here is non-fatal (e.g. read-only FS).
	if ferr := config.EnsureFile(cfg.ConfigFile, config.FileConfig{
		WorkerInterval:  cfg.WorkerInterval.String(),
		ShutdownTimeout: cfg.ShutdownTimeout.String(),
		TimeZone:        cfg.TimeZone,
	}); ferr != nil {
		slog.Warn("could not materialize config file", "path", cfg.ConfigFile, "error", ferr)
	}

	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	st, err := store.Open(cfg.DatabaseDSN)
	if err != nil {
		return err
	}
	defer func() { _ = st.Close() }()

	logs, err := persistlog.New(cfg.LogDir)
	if err != nil {
		return err
	}

	metrics := observability.New()

	wrk := worker.New(cfg.WorkerInterval, perPhaseDelay, st, logs, metrics)

	// requestRestart is invoked by the web handler (POST /api/restart). It is
	// non-blocking and idempotent within a single boot.
	restartCh := make(chan struct{}, 1)
	requestRestart := func() {
		select {
		case restartCh <- struct{}{}:
		default:
		}
	}

	handler := web.New(web.Deps{
		Store:          st,
		Logs:           logs,
		Metrics:        metrics,
		Config:         cfg,
		RequestRestart: requestRestart,
	}).Routes(static.Handler())

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	g, gctx := errgroup.WithContext(ctx)

	// Restart watcher: a restart request returns ErrRestart, which cancels gctx
	// (via errgroup) and tears down the worker + web for a clean reload.
	g.Go(func() error {
		select {
		case <-gctx.Done():
			return nil
		case <-restartCh:
			slog.Info("restart requested; reloading config")
			return ErrRestart
		}
	})

	// Worker daemon: runs until gctx is canceled.
	g.Go(func() error {
		return wrk.Run(gctx)
	})

	// Web server: ListenAndServe returns ErrServerClosed after Shutdown, which
	// is the normal stop path and must not be reported as an error.
	g.Go(func() error {
		slog.Info("starting web server", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("web server: %w", err)
		}
		return nil
	})

	// Shutdown supervisor: once gctx is canceled (signal or a sibling error),
	// gracefully drain the HTTP server within ShutdownTimeout.
	g.Go(func() error {
		<-gctx.Done()
		slog.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("web shutdown: %w", err)
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return err
	}
	slog.Info("stopped")
	return nil
}

func setupLogger() {
	var logLevel slog.LevelVar
	if l := os.Getenv("LOG_LEVEL"); l != "" {
		_ = logLevel.UnmarshalText([]byte(l))
	}

	var logHandler slog.Handler
	if os.Getenv("APP_ENV") == "production" {
		logHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: &logLevel})
	} else {
		logHandler = tint.NewHandler(os.Stderr, &tint.Options{
			Level:      &logLevel,
			TimeFormat: time.Kitchen,
		})
	}
	slog.SetDefault(slog.New(logHandler))
}
