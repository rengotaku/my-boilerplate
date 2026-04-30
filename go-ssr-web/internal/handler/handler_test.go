package handler_test

import (
	"html/template"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-ssr-web/internal/handler"
	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/service"
	"go-ssr-web/internal/testutil"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func makeTestTemplates() map[string]*template.Template {
	parse := func(src string) *template.Template {
		return template.Must(template.New("base").Parse(`{{define "base"}}` + src + `{{end}}`))
	}
	return map[string]*template.Template{
		"index.html":       parse(`<h1>Home</h1>`),
		"login.html":       parse(`<h1>Login</h1>{{if .Error}}<p class="error">{{.Error}}</p>{{end}}`),
		"profile.html":     parse(`<h1>Profile</h1><p>{{.User.Email}}</p>`),
		"users/index.html": parse(`<h1>Users</h1>{{range .Users}}<p>{{.Name}}</p>{{end}}`),
		"users/new.html":   parse(`<h1>New</h1>{{if .Error}}<p class="error">{{.Error}}</p>{{end}}`),
		"users/show.html":  parse(`<h1>{{.User.Name}}</h1>`),
		"users/edit.html":  parse(`<h1>Edit</h1>{{if .Error}}<p class="error">{{.Error}}</p>{{end}}`),
	}
}

func setupHandler(t *testing.T) (*handler.Handler, *service.UserService) {
	t.Helper()
	db := testutil.NewTestDB(t)
	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	staticFS := fstest.MapFS{
		"css/output.css": &fstest.MapFile{Data: []byte("body{}")},
	}
	store := sessions.NewCookieStore([]byte("test-secret"))
	h := handler.NewHandler(svc, makeTestTemplates(), fs.FS(staticFS), store)
	return h, svc
}

func TestHandler_Index(t *testing.T) {
	h, _ := setupHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Home")
}

func TestHandler_StaticFiles(t *testing.T) {
	h, _ := setupHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/static/css/output.css", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "body{}")
}

func TestHandler_UserList(t *testing.T) {
	h, svc := setupHandler(t)
	_, err := svc.CreateUser("Alice", "alice@example.com", "secret123")
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/users", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Alice")
}

func TestHandler_UserNew(t *testing.T) {
	h, _ := setupHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/users/new", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "New")
}

func TestHandler_UserCreate(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		h, _ := setupHandler(t)
		form := url.Values{
			"name":     {"John Doe"},
			"email":    {"john@example.com"},
			"password": {"secret123"},
		}
		req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusSeeOther, rec.Code)
		assert.Equal(t, "/users", rec.Header().Get("Location"))
	})

	t.Run("validation error", func(t *testing.T) {
		h, _ := setupHandler(t)
		form := url.Values{"name": {""}, "email": {""}, "password": {""}}
		req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "error")
	})

	t.Run("duplicate email", func(t *testing.T) {
		h, svc := setupHandler(t)
		_, err := svc.CreateUser("First", "dup@example.com", "secret123")
		require.NoError(t, err)

		form := url.Values{
			"name":     {"Second"},
			"email":    {"dup@example.com"},
			"password": {"secret123"},
		}
		req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "error")
	})
}

func TestHandler_UserShow(t *testing.T) {
	h, svc := setupHandler(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users/"+created.ID, nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "John")
	})

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users/non-existing-id", nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_UserEdit(t *testing.T) {
	h, svc := setupHandler(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users/"+created.ID+"/edit", nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "Edit")
	})

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users/non-existing-id/edit", nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_UserUpdate(t *testing.T) {
	h, svc := setupHandler(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("success", func(t *testing.T) {
		form := url.Values{"name": {"Jane Doe"}, "email": {"jane@example.com"}}
		req := httptest.NewRequest(http.MethodPost, "/users/"+created.ID, strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusSeeOther, rec.Code)
	})

	t.Run("validation error", func(t *testing.T) {
		form := url.Values{"name": {""}, "email": {""}}
		req := httptest.NewRequest(http.MethodPost, "/users/"+created.ID, strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), "error")
	})

	t.Run("not found", func(t *testing.T) {
		form := url.Values{"name": {"x"}, "email": {"x@example.com"}}
		req := httptest.NewRequest(http.MethodPost, "/users/non-existing-id", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}

func TestHandler_UserDelete(t *testing.T) {
	h, svc := setupHandler(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/users/"+created.ID+"/delete", nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusSeeOther, rec.Code)
	})

	t.Run("not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/users/non-existing-id/delete", nil)
		rec := httptest.NewRecorder()
		h.Routes().ServeHTTP(rec, req)
		assert.Equal(t, http.StatusNotFound, rec.Code)
	})
}
