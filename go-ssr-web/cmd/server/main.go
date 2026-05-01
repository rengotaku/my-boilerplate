package main

import (
	"context"
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/gorilla/sessions"
	"github.com/lmittmann/tint"
	"github.com/sethvargo/go-envconfig"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"go-ssr-web/internal/handler"
	"go-ssr-web/internal/model"
	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/service"
	"go-ssr-web/web"
)

type Config struct {
	Port            string        `env:"PORT,default=8080"`
	DatabaseDSN     string        `env:"DATABASE_DSN,default=app.db"`
	SessionSecret   string        `env:"SESSION_SECRET,default=change-me-in-production"`
	AppEnv          string        `env:"APP_ENV"`
	ShutdownTimeout time.Duration `env:"SHUTDOWN_TIMEOUT,default=10s"`
	SessionMaxAge   int           `env:"SESSION_MAX_AGE,default=86400"`
}

func main() {
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

	var cfg Config
	if err := envconfig.Process(context.Background(), &cfg); err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := gorm.Open(sqlite.Open(cfg.DatabaseDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	if migErr := db.AutoMigrate(&model.User{}); migErr != nil {
		slog.Error("failed to migrate database", "error", migErr)
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

	store := sessions.NewCookieStore([]byte(cfg.SessionSecret))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   cfg.SessionMaxAge,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   cfg.AppEnv == "production",
	}

	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	h := handler.NewHandler(svc, templates, staticFiles, store)

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

// loadTemplates builds a per-page template set so each page gets its own
// "content" definition. A single shared set causes {{define "content"}} to be
// overwritten by the last-parsed file, breaking all but the final page.
func loadTemplates() (map[string]*template.Template, error) {
	const (
		root   = "templates"
		layout = "templates/base.html"
	)

	m := map[string]*template.Template{}
	err := fs.WalkDir(web.FS, root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || path == layout || !strings.HasSuffix(path, ".html") {
			return nil
		}
		name := strings.TrimPrefix(path, root+"/")
		t, perr := template.ParseFS(web.FS, layout, path)
		if perr != nil {
			return fmt.Errorf("loading template %s: %w", name, perr)
		}
		m[name] = t
		return nil
	})
	if err != nil {
		return nil, err
	}
	return m, nil
}
