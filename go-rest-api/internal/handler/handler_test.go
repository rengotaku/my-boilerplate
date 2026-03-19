package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-rest-api/internal/repository"
	"go-rest-api/internal/service"
)

func setupTestHandler() *Handler {
	repo := repository.NewUserRepository()
	svc := service.NewUserService(repo)
	return NewHandler(svc)
}

func TestHandler_Health(t *testing.T) {
	h := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Health() status = %d, want %d", rec.Code, http.StatusOK)
	}

	var resp map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp["status"] != "ok" {
		t.Errorf("Health() status = %s, want ok", resp["status"])
	}
}

func TestHandler_CreateUser(t *testing.T) {
	h := setupTestHandler()

	body := `{"name": "John Doe", "email": "john@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("CreateUser() status = %d, want %d", rec.Code, http.StatusCreated)
	}

	var user repository.User
	if err := json.NewDecoder(rec.Body).Decode(&user); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if user.Name != "John Doe" {
		t.Errorf("CreateUser() name = %s, want John Doe", user.Name)
	}
}

func TestHandler_CreateUser_InvalidBody(t *testing.T) {
	h := setupTestHandler()

	body := `{"name": "", "email": "invalid"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("CreateUser() status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestHandler_GetUser(t *testing.T) {
	h := setupTestHandler()

	// Create a user first
	body := `{"name": "John Doe", "email": "john@example.com"}`
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
	createReq.Header.Set("Content-Type", "application/json")
	createRec := httptest.NewRecorder()
	h.Routes().ServeHTTP(createRec, createReq)

	var created repository.User
	json.NewDecoder(createRec.Body).Decode(&created)

	// Get the user
	req := httptest.NewRequest(http.MethodGet, "/api/v1/users/"+created.ID, nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("GetUser() status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestHandler_GetUser_NotFound(t *testing.T) {
	h := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/users/non-existing-id", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("GetUser() status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

func TestHandler_ListUsers(t *testing.T) {
	h := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/users", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("ListUsers() status = %d, want %d", rec.Code, http.StatusOK)
	}

	var users []repository.User
	if err := json.NewDecoder(rec.Body).Decode(&users); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(users) != 0 {
		t.Errorf("ListUsers() = %d users, want 0", len(users))
	}
}

func TestHandler_UpdateUser(t *testing.T) {
	h := setupTestHandler()

	// Create a user first
	body := `{"name": "John Doe", "email": "john@example.com"}`
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
	createReq.Header.Set("Content-Type", "application/json")
	createRec := httptest.NewRecorder()
	h.Routes().ServeHTTP(createRec, createReq)

	var created repository.User
	json.NewDecoder(createRec.Body).Decode(&created)

	// Update the user
	updateBody := `{"name": "Jane Doe", "email": "jane@example.com"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/users/"+created.ID, bytes.NewBufferString(updateBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("UpdateUser() status = %d, want %d", rec.Code, http.StatusOK)
	}

	var updated repository.User
	json.NewDecoder(rec.Body).Decode(&updated)

	if updated.Name != "Jane Doe" {
		t.Errorf("UpdateUser() name = %s, want Jane Doe", updated.Name)
	}
}

func TestHandler_UpdateUser_NotFound(t *testing.T) {
	h := setupTestHandler()

	body := `{"name": "Jane Doe", "email": "jane@example.com"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/users/non-existing-id", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("UpdateUser() status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

func TestHandler_UpdateUser_InvalidBody(t *testing.T) {
	h := setupTestHandler()

	// Create a user first
	body := `{"name": "John Doe", "email": "john@example.com"}`
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
	createReq.Header.Set("Content-Type", "application/json")
	createRec := httptest.NewRecorder()
	h.Routes().ServeHTTP(createRec, createReq)

	var created repository.User
	json.NewDecoder(createRec.Body).Decode(&created)

	// Update with invalid body
	updateBody := `{"name": "", "email": "invalid"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/users/"+created.ID, bytes.NewBufferString(updateBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("UpdateUser() status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestHandler_DeleteUser(t *testing.T) {
	h := setupTestHandler()

	// Create a user first
	body := `{"name": "John Doe", "email": "john@example.com"}`
	createReq := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
	createReq.Header.Set("Content-Type", "application/json")
	createRec := httptest.NewRecorder()
	h.Routes().ServeHTTP(createRec, createReq)

	var created repository.User
	json.NewDecoder(createRec.Body).Decode(&created)

	// Delete the user
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/users/"+created.ID, nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("DeleteUser() status = %d, want %d", rec.Code, http.StatusNoContent)
	}
}

func TestHandler_DeleteUser_NotFound(t *testing.T) {
	h := setupTestHandler()

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/users/non-existing-id", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("DeleteUser() status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

func TestHandler_CreateUser_InvalidJSON(t *testing.T) {
	h := setupTestHandler()

	body := `{invalid json}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/users", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("CreateUser() status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestHandler_UpdateUser_InvalidJSON(t *testing.T) {
	h := setupTestHandler()

	body := `{invalid json}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/users/some-id", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("UpdateUser() status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}
