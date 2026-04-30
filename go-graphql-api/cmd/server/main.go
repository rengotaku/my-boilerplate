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

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/glebarez/sqlite"
	"github.com/sethvargo/go-envconfig"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"go-graphql-api/internal/graph/generated"
	"go-graphql-api/internal/graph/model"
	"go-graphql-api/internal/graph/resolver"
	"go-graphql-api/internal/repository"
	"go-graphql-api/internal/service"
)

type Config struct {
	Port            string        `env:"PORT,default=8081"`
	DatabaseDSN     string        `env:"DATABASE_DSN,default=app.db"`
	JWTSecret       string        `env:"JWT_SECRET,default=change-me-in-production"`
	ShutdownTimeout time.Duration `env:"SHUTDOWN_TIMEOUT,default=10s"`
	JWTExpiry       time.Duration `env:"JWT_EXPIRY,default=24h"`
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	var logLevel slog.LevelVar
	if l := os.Getenv("LOG_LEVEL"); l != "" {
		_ = logLevel.UnmarshalText([]byte(l))
	}

	logHandler := slog.Handler(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: &logLevel}))
	if os.Getenv("APP_ENV") == "production" {
		logHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: &logLevel})
	}
	slog.SetDefault(slog.New(logHandler))

	ctx := context.Background()

	var cfg Config
	if err := envconfig.Process(ctx, &cfg); err != nil {
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

	repo := repository.NewUserRepository(db)
	userSvc := service.NewUserService(repo)
	resolvers := resolver.NewResolver(userSvc)

	srv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{
		Resolvers: resolvers,
	}))

	mux := http.NewServeMux()
	mux.Handle("/", playground.Handler("GraphQL Playground", "/query"))
	mux.Handle("/query", corsMiddleware(srv))
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	httpSrv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("starting server", "port", cfg.Port)
		slog.Info("GraphQL Playground available at", "url", "http://localhost:"+cfg.Port+"/")
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
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

	if err := httpSrv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server shutdown error", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped")
}
