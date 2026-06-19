package handler

import (
	"html/template"
	"io/fs"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	templates map[string]*template.Template
	staticFS  fs.FS
	greeting  string
}

func NewHandler(templates map[string]*template.Template, staticFS fs.FS, greeting string) *Handler {
	return &Handler{
		templates: templates,
		staticFS:  staticFS,
		greeting:  greeting,
	}
}

func (h *Handler) Routes() http.Handler {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	r.StaticFS("/static", http.FS(h.staticFS))

	r.GET("/", h.handleIndex)
	r.GET("/healthz", h.handleHealthz)

	return r
}

func (h *Handler) handleIndex(c *gin.Context) {
	h.render(c, "index.html", http.StatusOK, gin.H{
		"Title": "Home",
		"Name":  h.greeting,
	})
}

func (h *Handler) handleHealthz(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *Handler) render(c *gin.Context, name string, status int, data any) {
	t, ok := h.templates[name]
	if !ok {
		c.String(http.StatusInternalServerError, "Template error")
		return
	}
	c.Status(status)
	c.Header("Content-Type", "text/html; charset=utf-8")
	if err := t.ExecuteTemplate(c.Writer, "base", data); err != nil {
		c.String(http.StatusInternalServerError, "Template error")
	}
}
