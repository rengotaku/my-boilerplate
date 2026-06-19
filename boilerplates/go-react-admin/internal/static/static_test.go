package static

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

func makeTestFS() fstest.MapFS {
	return fstest.MapFS{
		"index.html":     {Data: []byte(`<!DOCTYPE html><html><body>Admin Root</body></html>`)},
		"assets/test.js": {Data: []byte(`console.log("test");`)},
	}
}

func TestHandler_ServesIndexHtml(t *testing.T) {
	h := handlerForFS(makeTestFS())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("GET / status = %d, want %d", rec.Code, http.StatusOK)
	}
	body, _ := io.ReadAll(rec.Body)
	if !strings.Contains(string(body), "Admin Root") {
		t.Errorf("GET / body = %q, want to contain 'Admin Root'", string(body))
	}
}

func TestHandler_ServesStaticAsset(t *testing.T) {
	h := handlerForFS(makeTestFS())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/assets/test.js", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "javascript") {
		t.Errorf("Content-Type = %q, want javascript", ct)
	}
}

func TestHandler_FallsBackToIndexForUnknownPath(t *testing.T) {
	h := handlerForFS(makeTestFS())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/runs/42", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	body, _ := io.ReadAll(rec.Body)
	if !strings.Contains(string(body), "Admin Root") {
		t.Errorf("fallback body = %q, want to contain 'Admin Root'", string(body))
	}
}
