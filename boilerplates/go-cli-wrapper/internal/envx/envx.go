// Package envx provides environment variable lookup helpers with default fallbacks
// and dependency injection for testing.
package envx

import (
	"os"
	"strconv"
	"strings"
)

// Env abstracts environment lookup for testability.
type Env func(string) string

func resolveEnv(env Env) Env {
	if env == nil {
		return os.Getenv
	}
	return env
}

// Or returns the value of key from env, or def if key is unset or empty.
func Or(env Env, key, def string) string {
	if v := resolveEnv(env)(key); v != "" {
		return v
	}
	return def
}

// IntOr returns the integer value of key from env, or def if key is unset, empty,
// or not a valid integer.
func IntOr(env Env, key string, def int) int {
	v := strings.TrimSpace(resolveEnv(env)(key))
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

// BoolOr returns the boolean value of key from env, or def if key is unset or empty.
// "1", "true", "yes", "on" (case-insensitive) return true.
// "0", "false", "no", "off" (case-insensitive) return false.
// Invalid values fall back to def.
func BoolOr(env Env, key string, def bool) bool {
	v := strings.TrimSpace(resolveEnv(env)(key))
	if v == "" {
		return def
	}
	switch strings.ToLower(v) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return def
	}
}
