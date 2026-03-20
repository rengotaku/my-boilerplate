package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/service"
)

type indexData struct {
	Title string
}

type userListData struct {
	Title string
	Users []*repository.User
}

type userFormData struct {
	Title string
	User  *repository.User
	Error string
}

func (h *Handler) handleIndex(w http.ResponseWriter, _ *http.Request) {
	h.render(w, "index.html", indexData{Title: "Home"})
}

func (h *Handler) handleUserList(w http.ResponseWriter, _ *http.Request) {
	users := h.userSvc.ListUsers()
	h.render(w, "users/index.html", userListData{
		Title: "Users",
		Users: users,
	})
}

func (h *Handler) handleUserNew(w http.ResponseWriter, _ *http.Request) {
	h.render(w, "users/new.html", userFormData{Title: "New User"})
}

func (h *Handler) handleUserCreate(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	name := r.FormValue("name")
	email := r.FormValue("email")

	if name == "" || email == "" {
		h.render(w, "users/new.html", userFormData{
			Title: "New User",
			User:  &repository.User{Name: name, Email: email},
			Error: "Name and email are required",
		})
		return
	}

	h.userSvc.CreateUser(name, email)
	http.Redirect(w, r, "/users", http.StatusSeeOther)
}

func (h *Handler) handleUserShow(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, err := h.userSvc.GetUser(id)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.render(w, "users/show.html", userFormData{
		Title: user.Name,
		User:  user,
	})
}

func (h *Handler) handleUserEdit(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, err := h.userSvc.GetUser(id)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	h.render(w, "users/edit.html", userFormData{
		Title: "Edit " + user.Name,
		User:  user,
	})
}

func (h *Handler) handleUserUpdate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	name := r.FormValue("name")
	email := r.FormValue("email")

	if name == "" || email == "" {
		user, _ := h.userSvc.GetUser(id)
		h.render(w, "users/edit.html", userFormData{
			Title: "Edit User",
			User:  user,
			Error: "Name and email are required",
		})
		return
	}

	_, err := h.userSvc.UpdateUser(id, name, email)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "/users/"+id, http.StatusSeeOther)
}

func (h *Handler) handleUserDelete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.userSvc.DeleteUser(id); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "/users", http.StatusSeeOther)
}
