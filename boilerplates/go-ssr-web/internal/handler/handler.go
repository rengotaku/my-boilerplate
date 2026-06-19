package handler

import (
	"html/template"
	"io/fs"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"

	"go-ssr-web/internal/middleware"
	"go-ssr-web/internal/service"
)

type Handler struct {
	userSvc      *service.UserService
	templates    map[string]*template.Template
	staticFS     fs.FS
	sessionStore sessions.Store
}

func NewHandler(userSvc *service.UserService, templates map[string]*template.Template, staticFS fs.FS, sessionStore sessions.Store) *Handler {
	return &Handler{
		userSvc:      userSvc,
		templates:    templates,
		staticFS:     staticFS,
		sessionStore: sessionStore,
	}
}

func (h *Handler) Routes() http.Handler {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(middleware.Session(h.sessionStore))

	r.StaticFS("/static", http.FS(h.staticFS))

	r.GET("/", h.handleIndex)
	r.GET("/login", h.handleLoginForm)
	r.POST("/login", h.handleLogin)

	r.GET("/users", h.handleUserList)
	r.GET("/users/new", h.handleUserNew)
	r.POST("/users", h.handleUserCreate)
	r.GET("/users/:id", h.handleUserShow)
	r.GET("/users/:id/edit", h.handleUserEdit)
	r.POST("/users/:id", h.handleUserUpdate)
	r.POST("/users/:id/delete", h.handleUserDelete)

	auth := r.Group("/")
	auth.Use(middleware.RequireAuth())
	auth.GET("/profile", h.handleProfile)
	auth.POST("/logout", h.handleLogout)

	return r
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
