package middleware_test

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"go-grpc-api/internal/middleware"
)

const testSecret = "test-secret"

func TestGenerateToken(t *testing.T) {
	token, err := middleware.GenerateToken("user-123", testSecret, time.Hour)
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func callWithAuth(authHeader string) error {
	interceptor := middleware.AuthInterceptor(testSecret)
	ctx := context.Background()
	if authHeader != "" {
		md := metadata.Pairs("authorization", authHeader)
		ctx = metadata.NewIncomingContext(ctx, md)
	}
	_, err := interceptor(ctx, nil, &grpc.UnaryServerInfo{}, func(ctx context.Context, req any) (any, error) {
		return nil, nil
	})
	return err
}

func TestAuthInterceptor(t *testing.T) {
	t.Run("valid token", func(t *testing.T) {
		token, _ := middleware.GenerateToken("user-abc", testSecret, time.Hour)
		err := callWithAuth("Bearer " + token)
		assert.NoError(t, err)
	})

	t.Run("missing metadata", func(t *testing.T) {
		interceptor := middleware.AuthInterceptor(testSecret)
		_, err := interceptor(context.Background(), nil, &grpc.UnaryServerInfo{}, func(ctx context.Context, req any) (any, error) {
			return nil, nil
		})
		require.Error(t, err)
		assert.Equal(t, codes.Unauthenticated, status.Code(err))
	})

	t.Run("missing authorization header", func(t *testing.T) {
		err := callWithAuth("")
		require.Error(t, err)
		assert.Equal(t, codes.Unauthenticated, status.Code(err))
	})

	t.Run("invalid format", func(t *testing.T) {
		err := callWithAuth("Token abc123")
		require.Error(t, err)
		assert.Equal(t, codes.Unauthenticated, status.Code(err))
	})

	t.Run("expired token", func(t *testing.T) {
		token, _ := middleware.GenerateToken("user-abc", testSecret, -time.Hour)
		err := callWithAuth("Bearer " + token)
		require.Error(t, err)
		assert.Equal(t, codes.Unauthenticated, status.Code(err))
	})

	t.Run("wrong secret", func(t *testing.T) {
		token, _ := middleware.GenerateToken("user-abc", "other-secret", time.Hour)
		err := callWithAuth("Bearer " + token)
		require.Error(t, err)
		assert.Equal(t, codes.Unauthenticated, status.Code(err))
	})
}
