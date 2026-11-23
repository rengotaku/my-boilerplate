package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
)

const (
	SessionName    = "ssr_session"
	SessionUserKey = "user_id"
	contextSession = "session"
	contextUserID  = "user_id"
)

// Session attaches the gorilla/sessions session to the gin context for handlers
// to read or modify. The session is saved automatically before the response is
// written by calling Save in handlers that mutate it.
func Session(store sessions.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		sess, _ := store.Get(c.Request, SessionName)
		c.Set(contextSession, sess)
		c.Next()
	}
}

// RequireAuth aborts the request with a redirect to /login when the session has
// no user_id. Must be installed after Session.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := UserID(c)
		if userID == "" {
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		c.Next()
	}
}

// GetSession returns the per-request session. Returns nil when middleware is
// not installed (e.g. in tests bypassing the real router).
func GetSession(c *gin.Context) *sessions.Session {
	v, ok := c.Get(contextSession)
	if !ok {
		return nil
	}
	sess, ok := v.(*sessions.Session)
	if !ok {
		return nil
	}
	return sess
}

// UserID returns the authenticated user id from the session, or empty string.
func UserID(c *gin.Context) string {
	sess := GetSession(c)
	if sess == nil {
		return ""
	}
	id, _ := sess.Values[SessionUserKey].(string)
	return id
}

// SetUserID stores the authenticated user id in the session and saves it.
func SetUserID(c *gin.Context, id string) error {
	sess := GetSession(c)
	if sess == nil {
		return nil
	}
	sess.Values[SessionUserKey] = id
	return sess.Save(c.Request, c.Writer)
}

// ClearUserID removes the user id from the session and saves it.
func ClearUserID(c *gin.Context) error {
	sess := GetSession(c)
	if sess == nil {
		return nil
	}
	delete(sess.Values, SessionUserKey)
	sess.Options.MaxAge = -1
	return sess.Save(c.Request, c.Writer)
}
