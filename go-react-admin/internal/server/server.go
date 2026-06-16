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
	"go-react-admin/internal/static"
	"go-react-admin/internal/web"
	"go-react-admin/internal/worker"
)

// Run boots the worker daemon and the web server in one process and blocks
// until ctx is canceled (graceful shutdown, returns nil) or one of the
// components returns a fatal error (returns that error).
func Run(ctx context.Context) error {
	setupLogger()

	cfg, err := config.Load(ctx)
	if err != nil {
		return err
	}

	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	wrk := worker.New(cfg.WorkerInterval)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      web.New().Routes(static.Handler()),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	g, gctx := errgroup.WithContext(ctx)

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
