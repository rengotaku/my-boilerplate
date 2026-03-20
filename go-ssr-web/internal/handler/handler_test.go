package handler

import (
	"html/template"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/assert"

	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/service"
)

func setupTestHandler() *Handler {
	repo := repository.NewUserRepository()
	svc := service.NewUserService(repo)

	// Simple templates for testing - each template is self-contained
	tmpl := template.Must(template.New("index.html").Parse(`<h1>Home</h1>`))
	template.Must(tmpl.New("users/index.html").Parse(`<h1>Users</h1>{{range .Users}}<p>{{.Name}}</p>{{end}}`))
	template.Must(tmpl.New("users/new.html").Parse(`<h1>New</h1>{{if .Error}}<p class="error">{{.Error}}</p>{{end}}`))
	template.Must(tmpl.New("users/show.html").Parse(`<h1>{{.User.Name}}</h1>`))
	template.Must(tmpl.New("users/edit.html").Parse(`<h1>Edit</h1>{{if .Error}}<p class="error">{{.Error}}</p>{{end}}`))

	staticFS := fstest.MapFS{
		"css/style.css": &fstest.MapFile{Data: []byte("body{}")},
	}

	return NewHandler(svc, tmpl, fs.FS(staticFS))
}

func TestHandler_Index(t *testing.T) {
	h := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Home")
}

func TestHandler_UserList(t *testing.T) {
	h := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/users", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Users")
}

func TestHandler_UserCreate(t *testing.T) {
	h := setupTestHandler()

	t.Run("success", func(t *testing.T) {
		form := url.Values{}
		form.Set("name", "John Doe")
		form.Set("email", "john@example.com")

		req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()

		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusSeeOther, rec.Code)
		assert.Equal(t, "/users", rec.Header().Get("Location"))
	})

	t.Run("validation error", func(t *testing.T) {
		form := url.Values{}
		form.Set("name", "")
		form.Set("email", "")

		req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()

		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "error")
	})
}

func TestHandler_UserShow(t *testing.T) {
	h := setupTestHandler()

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users/non-existing-id", nil)
		rec := httptest.NewRecorder()

		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_UserEdit(t *testing.T) {
	h := setupTestHandler()

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users/non-existing-id/edit", nil)
		rec := httptest.NewRecorder()

		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_UserUpdate(t *testing.T) {
	h := setupTestHandler()

	t.Run("not found", func(t *testing.T) {
		form := url.Values{}
		form.Set("name", "Jane Doe")
		form.Set("email", "jane@example.com")

		req := httptest.NewRequest(http.MethodPost, "/users/non-existing-id", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()

		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_UserDelete(t *testing.T) {
	h := setupTestHandler()

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/users/non-existing-id/delete", nil)
		rec := httptest.NewRecorder()

		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_StaticFiles(t *testing.T) {
	h := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/static/css/style.css", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "body{}")
}
