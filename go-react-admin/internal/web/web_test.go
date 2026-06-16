package web

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() { gin.SetMode(gin.TestMode) }

func staticStub() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SPA"))
	})
}

func TestRoutes_Health(t *testing.T) {
	h := New().Routes(staticStub())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/health", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("GET /health status = %d, want %d", rec.Code, http.StatusOK)
	}
	if !strings.Contains(rec.Body.String(), "ok") {
		t.Errorf("GET /health body = %q, want to contain 'ok'", rec.Body.String())
	}
}

func TestRoutes_SPAFallback(t *testing.T) {
	h := New().Routes(staticStub())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/some/spa/route", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("fallback status = %d, want %d", rec.Code, http.StatusOK)
	}
	if rec.Body.String() != "SPA" {
		t.Errorf("fallback body = %q, want 'SPA'", rec.Body.String())
	}
}
