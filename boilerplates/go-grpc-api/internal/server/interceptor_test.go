package server_test

import (
	"context"
	"testing"

	"buf.build/go/protovalidate"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "go-grpc-api/pkg/pb/v1"

	"go-grpc-api/internal/server"
)

func TestValidationInterceptor(t *testing.T) {
	validator, err := protovalidate.New()
	require.NoError(t, err)

	interceptor := server.ValidationInterceptor(validator)
	handler := func(ctx context.Context, req any) (any, error) { return nil, nil }

	t.Run("valid request", func(t *testing.T) {
		req := &pb.CreateUserRequest{Name: "John", Email: "john@example.com"}
		_, err := interceptor(context.Background(), req, &grpc.UnaryServerInfo{}, handler)
		assert.NoError(t, err)
	})

	t.Run("invalid request", func(t *testing.T) {
		req := &pb.CreateUserRequest{Name: "", Email: ""}
		_, err := interceptor(context.Background(), req, &grpc.UnaryServerInfo{}, handler)
		require.Error(t, err)
		assert.Equal(t, codes.InvalidArgument, status.Code(err))
	})

	t.Run("non-proto message passes through", func(t *testing.T) {
		_, err := interceptor(context.Background(), "plain-string", &grpc.UnaryServerInfo{}, handler)
		assert.NoError(t, err)
	})
}
