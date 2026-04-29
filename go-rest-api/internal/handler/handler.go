package handler

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"go-rest-api/internal/middleware"
	"go-rest-api/internal/service"
)

type Handler struct {
	userService    *service.UserService
	jwtSecret      string
	allowedOrigins []string
	jwtTTL         time.Duration
}

func NewHandler(userService *service.UserService, jwtSecret string, jwtTTL time.Duration, allowedOrigins []string) *Handler {
	return &Handler{userService: userService, jwtSecret: jwtSecret, jwtTTL: jwtTTL, allowedOrigins: allowedOrigins}
}

func (h *Handler) Routes() *gin.Engine {
	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(slogLogger())
	hasWildcard := false
	for _, o := range h.allowedOrigins {
		if strings.Contains(o, "*") {
			hasWildcard = true
			break
		}
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     h.allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		AllowWildcard:    hasWildcard,
		MaxAge:           5 * time.Minute,
	}))

	r.GET("/health", h.Health)

	r.POST("/api/v1/auth/login", h.Login)
	r.POST("/api/v1/users", h.CreateUser)
	r.GET("/api/v1/users", h.ListUsers)
	r.GET("/api/v1/users/:id", h.GetUser)

	protected := r.Group("/api/v1", middleware.Auth(h.jwtSecret))
	{
		protected.PUT("/users/:id", h.UpdateUser)
		protected.DELETE("/users/:id", h.DeleteUser)
	}

	return r
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func slogLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		slog.Info("request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"latency", time.Since(start),
			"ip", c.ClientIP(),
		)
	}
}
