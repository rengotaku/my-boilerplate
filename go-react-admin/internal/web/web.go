// Package web is the HTTP/API half of the single binary: a gin engine that
// serves the REST API and falls back to the embedded SPA for everything else.
//
// In this skeleton it exposes only /health; Phase 1b (#249) adds the
// /api/runs, /api/metrics/aggregate, /api/config and /metrics routes.
package web

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Server holds the dependencies for the HTTP handlers. It is intentionally
// empty in the skeleton; Phase 1b injects the store and observability registry.
type Server struct{}

// New constructs a web Server.
func New() *Server {
	return &Server{}
}

// Routes builds the gin engine. staticHandler serves the embedded SPA (prod)
// or 404s (dev, where Vite owns the frontend) for any non-API route.
func (s *Server) Routes(staticHandler http.Handler) http.Handler {
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/health", s.health)

	r.NoRoute(gin.WrapH(staticHandler))
	return r
}

func (s *Server) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
