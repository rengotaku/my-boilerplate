package handler

import (
	"io/fs"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/assert"

	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/service"
)

// projectRoot returns the absolute path to the go-ssr-web directory.
func projectRoot() string {
	_, filename, _, _ := runtime.Caller(0)
	// filename = .../internal/handler/tailwind_test.go
	return filepath.Join(filepath.Dir(filename), "..", "..")
}

func TestTailwind_IconFilesExist(t *testing.T) {
	iconsDir := filepath.Join(projectRoot(), "web", "static", "icons")

	entries, err := os.ReadDir(iconsDir)
	assert.NoError(t, err, "web/static/icons/ directory should exist")
	assert.NotEmpty(t, entries, "web/static/icons/ should contain at least one SVG file")

	var svgFiles []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".svg") {
			svgFiles = append(svgFiles, e.Name())
		}
	}
	assert.NotEmpty(t, svgFiles, "at least one .svg file should exist in web/static/icons/")
}

func TestTailwind_InputCSSExists(t *testing.T) {
	inputCSS := filepath.Join(projectRoot(), "web", "static", "css", "input.css")

	data, err := os.ReadFile(inputCSS)
	assert.NoError(t, err, "web/static/css/input.css should exist")
	assert.Contains(t, string(data), "@import", "input.css should contain Tailwind @import directive")
}

func TestTailwind_IndexTemplateReferencesTailwind(t *testing.T) {
	// The index template should reference Tailwind classes and an icon
	indexTemplate := filepath.Join(projectRoot(), "web", "templates", "index.html")

	data, err := os.ReadFile(indexTemplate)
	assert.NoError(t, err, "index.html should exist")

	content := string(data)
	// Should contain at least one Tailwind utility class
	hasTailwind := strings.Contains(content, "class=") &&
		(strings.Contains(content, "bg-") ||
			strings.Contains(content, "text-") ||
			strings.Contains(content, "flex") ||
			strings.Contains(content, "p-") ||
			strings.Contains(content, "rounded"))
	assert.True(t, hasTailwind, "index.html should contain Tailwind utility classes")

	// Should reference the static icons directory
	assert.Contains(t, content, "/static/icons/", "index.html should reference an icon from /static/icons/")
}

func TestTailwind_StaticIconServed(t *testing.T) {
	// Build a handler with a fake FS that includes an icon
	repo := repository.NewUserRepository()
	svc := service.NewUserService(repo)

	staticFS := fstest.MapFS{
		"css/style.css":    &fstest.MapFile{Data: []byte("body{}")},
		"icons/rocket.svg": &fstest.MapFile{Data: []byte(`<svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-rocket"></svg>`)},
	}

	h := NewHandler(svc, makeTestTemplates(), fs.FS(staticFS))

	req := httptest.NewRequest(http.MethodGet, "/static/icons/rocket.svg", nil)
	rec := httptest.NewRecorder()

	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "lucide")
}
