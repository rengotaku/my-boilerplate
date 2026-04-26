package handler

import (
	"html/template"
	"io/fs"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"go-ssr-web/internal/service"
)

type Handler struct {
	userSvc   *service.UserService
	templates map[string]*template.Template
	staticFS  fs.FS
}

func NewHandler(userSvc *service.UserService, templates map[string]*template.Template, staticFS fs.FS) *Handler {
	return &Handler{
		userSvc:   userSvc,
		templates: templates,
		staticFS:  staticFS,
	}
}

func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	// Static files
	r.Handle("/static/*", http.StripPrefix("/static/", http.FileServer(http.FS(h.staticFS))))

	// Pages
	r.Get("/", h.handleIndex)
	r.Get("/users", h.handleUserList)
	r.Get("/users/new", h.handleUserNew)
	r.Post("/users", h.handleUserCreate)
	r.Get("/users/{id}", h.handleUserShow)
	r.Get("/users/{id}/edit", h.handleUserEdit)
	r.Post("/users/{id}", h.handleUserUpdate)
	r.Post("/users/{id}/delete", h.handleUserDelete)

	return r
}

func (h *Handler) render(w http.ResponseWriter, name string, data any) {
	t, ok := h.templates[name]
	if !ok {
		http.Error(w, "Template error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := t.ExecuteTemplate(w, "base", data); err != nil {
		http.Error(w, "Template error", http.StatusInternalServerError)
	}
}
