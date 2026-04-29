package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/sethvargo/go-envconfig"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"go-rest-api/internal/handler"
	"go-rest-api/internal/model"
	"go-rest-api/internal/repository"
	"go-rest-api/internal/service"
)

type Config struct {
	Port            string        `env:"PORT,default=10080"`
	DatabaseDSN     string        `env:"DATABASE_DSN,default=app.db"`
	JWTSecret       string        `env:"JWT_SECRET,default=change-me-in-production"`
	AllowedOrigins  []string      `env:"ALLOWED_ORIGINS,default=http://localhost:*"`
	ShutdownTimeout time.Duration `env:"SHUTDOWN_TIMEOUT,default=10s"`
	JWTExpiry       time.Duration `env:"JWT_EXPIRY,default=24h"`
}

func validateProductionConfig(cfg Config) error {
	for _, origin := range cfg.AllowedOrigins {
		if strings.Contains(origin, "localhost") || strings.Contains(origin, "*") {
			return errors.New("ALLOWED_ORIGINS must not contain localhost or wildcards in production")
		}
	}
	if cfg.JWTSecret == "change-me-in-production" {
		return errors.New("JWT_SECRET must be changed from the default value in production")
	}
	return nil
}

func main() {
	var logLevel slog.LevelVar
	if l := os.Getenv("LOG_LEVEL"); l != "" {
		_ = logLevel.UnmarshalText([]byte(l))
	}

	isProduction := gin.Mode() == gin.ReleaseMode

	var logHandler slog.Handler
	if isProduction {
		logHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: &logLevel})
	} else {
		logHandler = slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: &logLevel})
	}
	slog.SetDefault(slog.New(logHandler))

	ctx := context.Background()

	var cfg Config
	if err := envconfig.Process(ctx, &cfg); err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	if isProduction {
		if err := validateProductionConfig(cfg); err != nil {
			slog.Error("insecure production config", "error", err)
			os.Exit(1)
		}
	}

	db, err := gorm.Open(sqlite.Open(cfg.DatabaseDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	if err := db.AutoMigrate(&model.User{}); err != nil {
		slog.Error("failed to migrate database", "error", err)
		os.Exit(1)
	}

	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	h := handler.NewHandler(svc, cfg.JWTSecret, cfg.JWTExpiry, cfg.AllowedOrigins)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      h.Routes(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("starting server", "url", "http://localhost:"+cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server shutdown error", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped")
}
