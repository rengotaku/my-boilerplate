package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"go-ssr-web/internal/middleware"
	"go-ssr-web/internal/model"
	"go-ssr-web/internal/service"
)

type loginData struct {
	Title  string
	UserID string
	Email  string
	Error  string
}

type profileData struct {
	User   *model.User
	Title  string
	UserID string
}

func currentUserID(c *gin.Context) string {
	return middleware.UserID(c)
}

func (h *Handler) handleLoginForm(c *gin.Context) {
	if currentUserID(c) != "" {
		c.Redirect(http.StatusSeeOther, "/profile")
		return
	}
	h.render(c, "login.html", http.StatusOK, loginData{Title: "Login"})
}

func (h *Handler) handleLogin(c *gin.Context) {
	email := c.PostForm("email")
	password := c.PostForm("password")

	user, err := h.userSvc.Authenticate(email, password)
	if err != nil {
		status := http.StatusUnauthorized
		if !errors.Is(err, service.ErrInvalidCredentials) {
			status = http.StatusInternalServerError
		}
		h.render(c, "login.html", status, loginData{
			Title: "Login",
			Email: email,
			Error: "Invalid email or password",
		})
		return
	}

	if err := middleware.SetUserID(c, user.ID); err != nil {
		c.String(http.StatusInternalServerError, "Failed to start session")
		return
	}
	c.Redirect(http.StatusSeeOther, "/profile")
}

func (h *Handler) handleLogout(c *gin.Context) {
	if err := middleware.ClearUserID(c); err != nil {
		c.String(http.StatusInternalServerError, "Failed to clear session")
		return
	}
	c.Redirect(http.StatusSeeOther, "/")
}

func (h *Handler) handleProfile(c *gin.Context) {
	id := currentUserID(c)
	user, err := h.userSvc.GetUser(id)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			_ = middleware.ClearUserID(c)
			c.Redirect(http.StatusSeeOther, "/login")
			return
		}
		c.String(http.StatusInternalServerError, "Internal error")
		return
	}
	h.render(c, "profile.html", http.StatusOK, profileData{
		Title:  "Profile",
		UserID: id,
		User:   user,
	})
}
