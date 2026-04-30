package handler_test

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-ssr-web/internal/handler"
)

const (
	testEmail    = "john@example.com"
	testPassword = "secret123"
)

func login(t *testing.T, h *handler.Handler) []*http.Cookie {
	t.Helper()
	form := url.Values{"email": {testEmail}, "password": {testPassword}}
	req := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)
	require.Equal(t, http.StatusSeeOther, rec.Code, "login should redirect on success; body=%s", rec.Body.String())
	return rec.Result().Cookies()
}

func TestHandler_LoginForm(t *testing.T) {
	h, _ := setupHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/login", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "Login")
}

func TestHandler_Login_Success(t *testing.T) {
	h, svc := setupHandler(t)
	_, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	cookies := login(t, h)
	assert.NotEmpty(t, cookies)
}

func TestHandler_Login_Failure(t *testing.T) {
	h, svc := setupHandler(t)
	_, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	form := url.Values{"email": {"john@example.com"}, "password": {"wrong"}}
	req := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "Invalid")
}

func TestHandler_LoginForm_RedirectsWhenAuthenticated(t *testing.T) {
	h, svc := setupHandler(t)
	_, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)
	cookies := login(t, h)

	req := httptest.NewRequest(http.MethodGet, "/login", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusSeeOther, rec.Code)
	assert.Equal(t, "/profile", rec.Header().Get("Location"))
}

func TestHandler_Profile_RequiresAuth(t *testing.T) {
	h, _ := setupHandler(t)
	req := httptest.NewRequest(http.MethodGet, "/profile", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusSeeOther, rec.Code)
	assert.Equal(t, "/login", rec.Header().Get("Location"))
}

func TestHandler_Profile_WhenAuthenticated(t *testing.T) {
	h, svc := setupHandler(t)
	_, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)
	cookies := login(t, h)

	req := httptest.NewRequest(http.MethodGet, "/profile", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "john@example.com")
}

func TestHandler_Logout(t *testing.T) {
	h, svc := setupHandler(t)
	_, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)
	cookies := login(t, h)

	req := httptest.NewRequest(http.MethodPost, "/logout", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusSeeOther, rec.Code)
	assert.Equal(t, "/", rec.Header().Get("Location"))
}

func TestHandler_Logout_RequiresAuth(t *testing.T) {
	h, _ := setupHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/logout", nil)
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)
	assert.Equal(t, http.StatusSeeOther, rec.Code)
	assert.Equal(t, "/login", rec.Header().Get("Location"))
}

func TestHandler_Profile_DeletedUserClearsSession(t *testing.T) {
	h, svc := setupHandler(t)
	user, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)
	cookies := login(t, h)
	require.NoError(t, svc.DeleteUser(user.ID))

	req := httptest.NewRequest(http.MethodGet, "/profile", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	h.Routes().ServeHTTP(rec, req)

	assert.Equal(t, http.StatusSeeOther, rec.Code)
	assert.Equal(t, "/login", rec.Header().Get("Location"))
}
