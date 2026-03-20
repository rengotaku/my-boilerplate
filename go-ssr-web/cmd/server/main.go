package main

import (
	"context"
	"errors"
	"html/template"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kelseyhightower/envconfig"

	"go-ssr-web/internal/handler"
	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/service"
	"go-ssr-web/web"
)

type Config struct {
	Port            string        `envconfig:"PORT" default:"8080"`
	ShutdownTimeout time.Duration `envconfig:"SHUTDOWN_TIMEOUT" default:"10s"`
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	templates, err := loadTemplates()
	if err != nil {
		slog.Error("failed to load templates", "error", err)
		os.Exit(1)
	}

	staticFiles, err := fs.Sub(web.FS, "static")
	if err != nil {
		slog.Error("failed to load static files", "error", err)
		os.Exit(1)
	}

	repo := repository.NewUserRepository()
	svc := service.NewUserService(repo)
	h := handler.NewHandler(svc, templates, staticFiles)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      h.Routes(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("starting server", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server shutdown error", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped")
}

func loadTemplates() (*template.Template, error) {
	return template.ParseFS(web.FS,
		"templates/base.html",
		"templates/index.html",
		"templates/users/*.html",
	)
}
