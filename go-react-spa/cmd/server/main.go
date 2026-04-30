package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/lmittmann/tint"
	"github.com/sethvargo/go-envconfig"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"go-react-spa/internal/handler"
	"go-react-spa/internal/model"
	"go-react-spa/internal/repository"
	"go-react-spa/internal/service"
	"go-react-spa/internal/static"
)

type Config struct {
	Port            string        `env:"PORT,default=8080"`
	ShutdownTimeout time.Duration `env:"SHUTDOWN_TIMEOUT,default=10s"`
	DatabaseDSN     string        `env:"DATABASE_DSN,default=app.db"`
	JWTSecret       string        `env:"JWT_SECRET,default=change-me-in-production"`
	JWTTTL          time.Duration `env:"JWT_TTL,default=24h"`
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

	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	h := handler.NewHandler(svc)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      h.Routes(static.Handler()),
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
