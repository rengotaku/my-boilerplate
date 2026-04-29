package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-rest-api/internal/model"
	"go-rest-api/internal/repository"
	"go-rest-api/internal/service"
	"go-rest-api/internal/testutil"
)

const testJWTSecret = "test-secret"

func init() {
	gin.SetMode(gin.TestMode)
}

func setupTestHandler(t *testing.T) *Handler {
	t.Helper()
	db := testutil.NewTestDB(t)
	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	return NewHandler(svc, testJWTSecret, 24*time.Hour)
}

func registerUser(t *testing.T, h *Handler, name, email, password string) *model.User {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"name": name, "email": email, "password": password})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)
	require.Equal(t, http.StatusCreated, rec.Code)
	var user model.User
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&user))
	return &user
}

func loginUser(t *testing.T, h *Handler, email, password string) string {
	t.Helper()
	body, _ := json.Marshal(map[string]string{"email": email, "password": password})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)
	require.Equal(t, http.StatusOK, rec.Code)
	var resp map[string]string
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	return resp["token"]
}

func TestHandler_Health(t *testing.T) {
	h := setupTestHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var resp map[string]string
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&resp))
	assert.Equal(t, "ok", resp["status"])
}

func TestHandler_Login(t *testing.T) {
	h := setupTestHandler(t)
	registerUser(t, h, "John Doe", "john@example.com", "password123")

	t.Run("valid credentials", func(t *testing.T) {
		token := loginUser(t, h, "john@example.com", "password123")
		assert.NotEmpty(t, token)
	})

	t.Run("wrong password", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"email": "john@example.com", "password": "wrongpass"})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("invalid body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(`{bad}`))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestHandler_CreateUser(t *testing.T) {
	h := setupTestHandler(t)

	t.Run("valid", func(t *testing.T) {
		body := `{"name": "John Doe", "email": "john@example.com", "password": "password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusCreated, rec.Code)
	})

	t.Run("duplicate email", func(t *testing.T) {
		registerUser(t, h, "Dup User", "dup@example.com", "password123")
		body := `{"name": "Dup User2", "email": "dup@example.com", "password": "password123"}`
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusConflict, rec.Code)
	})

	t.Run("invalid body", func(t *testing.T) {
		body := `{"name": "", "email": "invalid", "password": "short"}`
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(`{bad json}`))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestHandler_GetUser(t *testing.T) {
	h := setupTestHandler(t)
	created := registerUser(t, h, "John", "john@example.com", "password123")

	t.Run("found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/users/"+created.ID, nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/users/non-existing", nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_ListUsers(t *testing.T) {
	h := setupTestHandler(t)
	registerUser(t, h, "John", "john@example.com", "password123")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/users", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var users []model.User
	require.NoError(t, json.NewDecoder(rec.Body).Decode(&users))
	assert.Len(t, users, 1)
}

func TestHandler_UpdateUser(t *testing.T) {
	h := setupTestHandler(t)
	created := registerUser(t, h, "John", "update@example.com", "password123")
	token := loginUser(t, h, "update@example.com", "password123")

	t.Run("valid", func(t *testing.T) {
		body := `{"name": "Jane Doe", "email": "jane@example.com"}`
		req := httptest.NewRequest(http.MethodPut, "/api/v1/users/"+created.ID, bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
		var updated model.User
		require.NoError(t, json.NewDecoder(rec.Body).Decode(&updated))
		assert.Equal(t, "Jane Doe", updated.Name)
	})

	t.Run("not found", func(t *testing.T) {
		body := `{"name": "Jane", "email": "jane@example.com"}`
		req := httptest.NewRequest(http.MethodPut, "/api/v1/users/non-existing", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})

	t.Run("invalid body", func(t *testing.T) {
		body := `{"name": "", "email": "invalid"}`
		req := httptest.NewRequest(http.MethodPut, "/api/v1/users/"+created.ID, bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestHandler_DeleteUser(t *testing.T) {
	h := setupTestHandler(t)
	created := registerUser(t, h, "delete@example.com", "delete@example.com", "s3cur3pass!")
	token := loginUser(t, h, "delete@example.com", "s3cur3pass!")

	t.Run("found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/users/"+created.ID, nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNoContent, rec.Code)
	})

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/users/non-existing", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}
