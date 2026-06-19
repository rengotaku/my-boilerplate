package main

import (
	"context"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"buf.build/go/protovalidate"
	"github.com/glebarez/sqlite"
	"github.com/sethvargo/go-envconfig"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	pb "go-grpc-api/pkg/pb/v1"

	"go-grpc-api/internal/model"
	"go-grpc-api/internal/repository"
	"go-grpc-api/internal/server"
	"go-grpc-api/internal/service"
)

type Config struct {
	Port        string `env:"PORT,default=50051"`
	DatabaseDSN string `env:"DATABASE_DSN,default=app.db"`
	JWTSecret   string `env:"JWT_SECRET,default=change-me-in-production"`
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

	validator, err := protovalidate.New()
	if err != nil {
		slog.Error("failed to create validator", "error", err)
		os.Exit(1)
	}

	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	userServer := server.NewUserServer(svc)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(server.ValidationInterceptor(validator)),
	)
	pb.RegisterUserServiceServer(grpcServer, userServer)
	reflection.Register(grpcServer)

	lis, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		slog.Error("failed to listen", "error", err)
		os.Exit(1)
	}

	go func() {
		slog.Info("starting gRPC server", "port", cfg.Port)
		if err := grpcServer.Serve(lis); err != nil {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server")
	grpcServer.GracefulStop()
	slog.Info("server stopped")
}
