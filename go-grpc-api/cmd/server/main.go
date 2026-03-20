package main

import (
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"buf.build/go/protovalidate"
	"github.com/kelseyhightower/envconfig"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	pb "go-grpc-api/pkg/pb/v1"

	"go-grpc-api/internal/repository"
	"go-grpc-api/internal/server"
	"go-grpc-api/internal/service"
)

type Config struct {
	Port string `envconfig:"PORT" default:"50051"`
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	validator, err := protovalidate.New()
	if err != nil {
		slog.Error("failed to create validator", "error", err)
		os.Exit(1)
	}

	repo := repository.NewUserRepository()
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
