package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-ssr-web/internal/middleware"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func newRouterWithSession(t *testing.T) *gin.Engine {
	t.Helper()
	store := sessions.NewCookieStore([]byte("test-secret"))
	r := gin.New()
	r.Use(middleware.Session(store))
	return r
}

func TestSession_AttachesSessionToContext(t *testing.T) {
	r := newRouterWithSession(t)
	r.GET("/whoami", func(c *gin.Context) {
		assert.NotNil(t, middleware.GetSession(c))
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/whoami", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestRequireAuth_RedirectsWhenAnonymous(t *testing.T) {
	r := newRouterWithSession(t)
	r.GET("/protected", middleware.RequireAuth(), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	assert.Equal(t, http.StatusSeeOther, rec.Code)
	assert.Equal(t, "/login", rec.Header().Get("Location"))
}

func TestSetAndClearUserID(t *testing.T) {
	r := newRouterWithSession(t)
	r.POST("/login", func(c *gin.Context) {
		require.NoError(t, middleware.SetUserID(c, "user-123"))
		c.Status(http.StatusOK)
	})
	r.GET("/me", middleware.RequireAuth(), func(c *gin.Context) {
		c.String(http.StatusOK, middleware.UserID(c))
	})
	r.POST("/logout", func(c *gin.Context) {
		require.NoError(t, middleware.ClearUserID(c))
		c.Status(http.StatusOK)
	})

	// Login
	loginReq := httptest.NewRequest(http.MethodPost, "/login", nil)
	loginRec := httptest.NewRecorder()
	r.ServeHTTP(loginRec, loginReq)
	require.Equal(t, http.StatusOK, loginRec.Code)
	cookies := loginRec.Result().Cookies()
	require.NotEmpty(t, cookies)

	// Authenticated request
	meReq := httptest.NewRequest(http.MethodGet, "/me", nil)
	for _, c := range cookies {
		meReq.AddCookie(c)
	}
	meRec := httptest.NewRecorder()
	r.ServeHTTP(meRec, meReq)
	require.Equal(t, http.StatusOK, meRec.Code)
	assert.Equal(t, "user-123", meRec.Body.String())

	// Logout
	logoutReq := httptest.NewRequest(http.MethodPost, "/logout", nil)
	for _, c := range cookies {
		logoutReq.AddCookie(c)
	}
	logoutRec := httptest.NewRecorder()
	r.ServeHTTP(logoutRec, logoutReq)
	require.Equal(t, http.StatusOK, logoutRec.Code)

	// Authenticated request after logout — use cookies from logout response
	logoutCookies := logoutRec.Result().Cookies()
	if len(logoutCookies) == 0 {
		logoutCookies = cookies
	}
	afterReq := httptest.NewRequest(http.MethodGet, "/me", nil)
	for _, c := range logoutCookies {
		afterReq.AddCookie(c)
	}
	afterRec := httptest.NewRecorder()
	r.ServeHTTP(afterRec, afterReq)
	assert.Equal(t, http.StatusSeeOther, afterRec.Code)
}

func TestUserID_NoSessionMiddleware(t *testing.T) {
	r := gin.New()
	r.GET("/x", func(c *gin.Context) {
		assert.Empty(t, middleware.UserID(c))
		assert.Nil(t, middleware.GetSession(c))
		c.Status(http.StatusOK)
	})
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestSetUserID_NoSessionMiddleware(t *testing.T) {
	r := gin.New()
	r.GET("/x", func(c *gin.Context) {
		assert.NoError(t, middleware.SetUserID(c, "x"))
		assert.NoError(t, middleware.ClearUserID(c))
		c.Status(http.StatusOK)
	})
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	assert.Equal(t, http.StatusOK, rec.Code)
}
