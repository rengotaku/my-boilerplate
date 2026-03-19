package server

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "go-grpc-api/pkg/pb/v1"

	"go-grpc-api/internal/repository"
	"go-grpc-api/internal/service"
)

func setupTestServer() *UserServer {
	repo := repository.NewUserRepository()
	svc := service.NewUserService(repo)
	return NewUserServer(svc)
}

func TestUserServer_CreateUser(t *testing.T) {
	srv := setupTestServer()
	ctx := context.Background()

	resp, err := srv.CreateUser(ctx, &pb.CreateUserRequest{
		Name:  "John Doe",
		Email: "john@example.com",
	})

	require.NoError(t, err)
	assert.NotEmpty(t, resp.GetUser().GetId())
	assert.Equal(t, "John Doe", resp.GetUser().GetName())
	assert.Equal(t, "john@example.com", resp.GetUser().GetEmail())
}

func TestUserServer_GetUser(t *testing.T) {
	srv := setupTestServer()
	ctx := context.Background()

	created, err := srv.CreateUser(ctx, &pb.CreateUserRequest{
		Name:  "John Doe",
		Email: "john@example.com",
	})
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		resp, err := srv.GetUser(ctx, &pb.GetUserRequest{Id: created.GetUser().GetId()})
		require.NoError(t, err)
		assert.Equal(t, created.GetUser().GetId(), resp.GetUser().GetId())
	})

	t.Run("non-existing user", func(t *testing.T) {
		_, err := srv.GetUser(ctx, &pb.GetUserRequest{Id: "non-existing-id"})
		require.Error(t, err)
		st, ok := status.FromError(err)
		require.True(t, ok)
		assert.Equal(t, codes.NotFound, st.Code())
	})
}

func TestUserServer_ListUsers(t *testing.T) {
	srv := setupTestServer()
	ctx := context.Background()

	_, err := srv.CreateUser(ctx, &pb.CreateUserRequest{Name: "User 1", Email: "user1@example.com"})
	require.NoError(t, err)
	_, err = srv.CreateUser(ctx, &pb.CreateUserRequest{Name: "User 2", Email: "user2@example.com"})
	require.NoError(t, err)

	resp, err := srv.ListUsers(ctx, &pb.ListUsersRequest{})
	require.NoError(t, err)
	assert.Len(t, resp.GetUsers(), 2)
}

func TestUserServer_UpdateUser(t *testing.T) {
	srv := setupTestServer()
	ctx := context.Background()

	created, err := srv.CreateUser(ctx, &pb.CreateUserRequest{
		Name:  "John Doe",
		Email: "john@example.com",
	})
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		resp, err := srv.UpdateUser(ctx, &pb.UpdateUserRequest{
			Id:    created.GetUser().GetId(),
			Name:  "Jane Doe",
			Email: "jane@example.com",
		})
		require.NoError(t, err)
		assert.Equal(t, "Jane Doe", resp.GetUser().GetName())
		assert.Equal(t, "jane@example.com", resp.GetUser().GetEmail())
	})

	t.Run("non-existing user", func(t *testing.T) {
		_, err := srv.UpdateUser(ctx, &pb.UpdateUserRequest{
			Id:    "non-existing-id",
			Name:  "Jane Doe",
			Email: "jane@example.com",
		})
		require.Error(t, err)
		st, ok := status.FromError(err)
		require.True(t, ok)
		assert.Equal(t, codes.NotFound, st.Code())
	})
}

func TestUserServer_DeleteUser(t *testing.T) {
	srv := setupTestServer()
	ctx := context.Background()

	created, err := srv.CreateUser(ctx, &pb.CreateUserRequest{
		Name:  "John Doe",
		Email: "john@example.com",
	})
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		_, err := srv.DeleteUser(ctx, &pb.DeleteUserRequest{Id: created.GetUser().GetId()})
		require.NoError(t, err)
	})

	t.Run("non-existing user", func(t *testing.T) {
		_, err := srv.DeleteUser(ctx, &pb.DeleteUserRequest{Id: "non-existing-id"})
		require.Error(t, err)
		st, ok := status.FromError(err)
		require.True(t, ok)
		assert.Equal(t, codes.NotFound, st.Code())
	})
}
