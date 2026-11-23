package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"go-ssr-web/internal/model"
	"go-ssr-web/internal/service"
)

type indexData struct {
	Title  string
	UserID string
}

type userListData struct {
	Title  string
	UserID string
	Users  []*model.User
}

type userFormData struct {
	Title  string
	UserID string
	User   *model.User
	Error  string
}

func (h *Handler) handleIndex(c *gin.Context) {
	h.render(c, "index.html", http.StatusOK, indexData{
		Title:  "Home",
		UserID: currentUserID(c),
	})
}

func (h *Handler) handleUserList(c *gin.Context) {
	users, err := h.userSvc.ListUsers()
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}
	h.render(c, "users/index.html", http.StatusOK, userListData{
		Title:  "Users",
		UserID: currentUserID(c),
		Users:  users,
	})
}

func (h *Handler) handleUserNew(c *gin.Context) {
	h.render(c, "users/new.html", http.StatusOK, userFormData{
		Title:  "New User",
		UserID: currentUserID(c),
	})
}

func (h *Handler) handleUserCreate(c *gin.Context) {
	name := c.PostForm("name")
	email := c.PostForm("email")
	password := c.PostForm("password")

	if name == "" || email == "" || password == "" {
		h.render(c, "users/new.html", http.StatusOK, userFormData{
			Title:  "New User",
			UserID: currentUserID(c),
			User:   &model.User{Name: name, Email: email},
			Error:  "Name, email, and password are required",
		})
		return
	}

	if _, err := h.userSvc.CreateUser(name, email, password); err != nil {
		h.render(c, "users/new.html", http.StatusOK, userFormData{
			Title:  "New User",
			UserID: currentUserID(c),
			User:   &model.User{Name: name, Email: email},
			Error:  "Could not create user (email may already be taken)",
		})
		return
	}
	c.Redirect(http.StatusSeeOther, "/users")
}

func (h *Handler) handleUserShow(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userSvc.GetUser(id)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			c.String(http.StatusNotFound, "Not Found")
			return
		}
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}

	h.render(c, "users/show.html", http.StatusOK, userFormData{
		Title:  user.Name,
		UserID: currentUserID(c),
		User:   user,
	})
}

func (h *Handler) handleUserEdit(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userSvc.GetUser(id)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			c.String(http.StatusNotFound, "Not Found")
			return
		}
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}

	h.render(c, "users/edit.html", http.StatusOK, userFormData{
		Title:  "Edit " + user.Name,
		UserID: currentUserID(c),
		User:   user,
	})
}

func (h *Handler) handleUserUpdate(c *gin.Context) {
	id := c.Param("id")
	name := c.PostForm("name")
	email := c.PostForm("email")

	if name == "" || email == "" {
		user, _ := h.userSvc.GetUser(id)
		h.render(c, "users/edit.html", http.StatusOK, userFormData{
			Title:  "Edit User",
			UserID: currentUserID(c),
			User:   user,
			Error:  "Name and email are required",
		})
		return
	}

	if _, err := h.userSvc.UpdateUser(id, name, email); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			c.String(http.StatusNotFound, "Not Found")
			return
		}
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}

	c.Redirect(http.StatusSeeOther, "/users/"+id)
}

func (h *Handler) handleUserDelete(c *gin.Context) {
	id := c.Param("id")
	if err := h.userSvc.DeleteUser(id); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			c.String(http.StatusNotFound, "Not Found")
			return
		}
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}
	c.Redirect(http.StatusSeeOther, "/users")
}
