package server

import (
	"context"
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	pb "go-grpc-api/pkg/pb/v1"

	"go-grpc-api/internal/model"
	"go-grpc-api/internal/service"
)

type UserServer struct {
	pb.UnimplementedUserServiceServer
	svc *service.UserService
}

func NewUserServer(svc *service.UserService) *UserServer {
	return &UserServer{svc: svc}
}

func (s *UserServer) ListUsers(_ context.Context, _ *pb.ListUsersRequest) (*pb.ListUsersResponse, error) {
	users, err := s.svc.ListUsers()
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	pbUsers := make([]*pb.User, len(users))
	for i, u := range users {
		pbUsers[i] = toProtoUser(u)
	}
	return &pb.ListUsersResponse{Users: pbUsers}, nil
}

func (s *UserServer) GetUser(_ context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
	user, err := s.svc.GetUser(req.GetId())
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.GetUserResponse{User: toProtoUser(user)}, nil
}

func (s *UserServer) CreateUser(_ context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
	user, err := s.svc.CreateUser(req.GetName(), req.GetEmail())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.CreateUserResponse{User: toProtoUser(user)}, nil
}

func (s *UserServer) UpdateUser(_ context.Context, req *pb.UpdateUserRequest) (*pb.UpdateUserResponse, error) {
	user, err := s.svc.UpdateUser(req.GetId(), req.GetName(), req.GetEmail())
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.UpdateUserResponse{User: toProtoUser(user)}, nil
}

func (s *UserServer) DeleteUser(_ context.Context, req *pb.DeleteUserRequest) (*pb.DeleteUserResponse, error) {
	if err := s.svc.DeleteUser(req.GetId()); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &pb.DeleteUserResponse{}, nil
}

func toProtoUser(u *model.User) *pb.User {
	return &pb.User{
		Id:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		CreatedAt: timestamppb.New(u.CreatedAt),
		UpdatedAt: timestamppb.New(u.UpdatedAt),
	}
}
