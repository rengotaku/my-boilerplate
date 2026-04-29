package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-rest-api/internal/middleware"
)

const testSecret = "test-secret"

func init() {
	gin.SetMode(gin.TestMode)
}

func TestGenerateToken(t *testing.T) {
	token, err := middleware.GenerateToken("user-123", testSecret, time.Hour)
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func authRouter(secret string) *gin.Engine {
	r := gin.New()
	r.GET("/protected", middleware.Auth(secret), func(c *gin.Context) {
		userID, _ := c.Get(middleware.UserIDKey)
		c.JSON(http.StatusOK, gin.H{"user_id": userID})
	})
	return r
}

func TestAuth(t *testing.T) {
	t.Run("valid token", func(t *testing.T) {
		token, _ := middleware.GenerateToken("user-abc", testSecret, time.Hour)
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		authRouter(testSecret).ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("missing header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		rec := httptest.NewRecorder()
		authRouter(testSecret).ServeHTTP(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("invalid format", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Token abc123")
		rec := httptest.NewRecorder()
		authRouter(testSecret).ServeHTTP(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("expired token", func(t *testing.T) {
		token, _ := middleware.GenerateToken("user-abc", testSecret, -time.Hour)
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		authRouter(testSecret).ServeHTTP(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("wrong secret", func(t *testing.T) {
		const otherSecret = "other-secret"
		token, _ := middleware.GenerateToken("user-abc", otherSecret, time.Hour)
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		// token signed with otherSecret, router uses testSecret → should reject
		authRouter(testSecret).ServeHTTP(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("custom secret matches", func(t *testing.T) {
		const customSecret = "custom-secret"
		token, _ := middleware.GenerateToken("user-xyz", customSecret, time.Hour)
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		authRouter(customSecret).ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
	})
}
