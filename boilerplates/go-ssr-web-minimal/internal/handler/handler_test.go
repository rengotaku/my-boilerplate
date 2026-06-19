package handler_test

import (
	"html/template"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"go-ssr-web-minimal/internal/handler"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func makeTestTemplates() map[string]*template.Template {
	parse := func(src string) *template.Template {
		return template.Must(template.New("base").Parse(`{{define "base"}}` + src + `{{end}}`))
	}
	return map[string]*template.Template{
		"index.html": parse(`<h1>Hello, {{.Name}}</h1>`),
	}
}

func setupHandler() *handler.Handler {
	staticFS := fstest.MapFS{
		"css/style.css": &fstest.MapFile{Data: []byte("body{color:#000}")},
	}
	return handler.NewHandler(makeTestTemplates(), fs.FS(staticFS), "tester")
}

func TestHandler_Index(t *testing.T) {
	h := setupHandler()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Hello, tester")
	assert.Equal(t, "text/html; charset=utf-8", rec.Header().Get("Content-Type"))
}

func TestHandler_Healthz(t *testing.T) {
	h := setupHandler()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.JSONEq(t, `{"status":"ok"}`, rec.Body.String())
}

func TestHandler_StaticFiles(t *testing.T) {
	h := setupHandler()

	req := httptest.NewRequest(http.MethodGet, "/static/css/style.css", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "body{color:#000}")
}

func TestHandler_MissingTemplate(t *testing.T) {
	staticFS := fstest.MapFS{}
	h := handler.NewHandler(map[string]*template.Template{}, fs.FS(staticFS), "tester")

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}
