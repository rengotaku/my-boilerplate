package envx

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOr(t *testing.T) {
	mockEnv := map[string]string{
		"FOO": "bar",
		"EMPTY": "",
	}
	env := func(key string) string {
		return mockEnv[key]
	}

	t.Run("custom env returns stored value", func(t *testing.T) {
		assert.Equal(t, "bar", Or(env, "FOO", "default"))
	})

	t.Run("empty or missing key returns fallback", func(t *testing.T) {
		assert.Equal(t, "default", Or(env, "EMPTY", "default"))
		assert.Equal(t, "default", Or(env, "MISSING", "default"))
	})

	t.Run("nil env falls back to os.Getenv", func(t *testing.T) {
		t.Setenv("TEST_ENVX_OR", "from_os")
		assert.Equal(t, "from_os", Or(nil, "TEST_ENVX_OR", "default"))
		assert.Equal(t, "default", Or(nil, "TEST_ENVX_OR_MISSING", "default"))
	})
}

func TestIntOr(t *testing.T) {
	mockEnv := map[string]string{
		"VALID":   "42",
		"NEGATIVE": "-10",
		"ZERO":     "0",
		"INVALID":  "abc",
		"EMPTY":    "  ",
	}
	env := func(key string) string {
		return mockEnv[key]
	}

	t.Run("valid integer strings", func(t *testing.T) {
		assert.Equal(t, 42, IntOr(env, "VALID", 100))
		assert.Equal(t, -10, IntOr(env, "NEGATIVE", 100))
		assert.Equal(t, 0, IntOr(env, "ZERO", 100))
	})

	t.Run("invalid integer strings or empty fallback to default", func(t *testing.T) {
		assert.Equal(t, 100, IntOr(env, "INVALID", 100))
		assert.Equal(t, 100, IntOr(env, "EMPTY", 100))
		assert.Equal(t, 100, IntOr(env, "MISSING", 100))
	})

	t.Run("nil env falls back to os.Getenv", func(t *testing.T) {
		t.Setenv("TEST_ENVX_INT", "123")
		assert.Equal(t, 123, IntOr(nil, "TEST_ENVX_INT", 100))
		assert.Equal(t, 100, IntOr(nil, "TEST_ENVX_INT_MISSING", 100))
	})
}

func TestBoolOr(t *testing.T) {
	mockEnv := map[string]string{
		"TRUE_1":    "1",
		"TRUE_BOOL": "true",
		"TRUE_YES":  "YES",
		"TRUE_ON":   "On",
		"FALSE_0":   "0",
		"FALSE_BOOL":"false",
		"FALSE_NO":  "no",
		"FALSE_OFF": "OFF",
		"INVALID":   "maybe",
		"EMPTY":     "",
	}
	env := func(key string) string {
		return mockEnv[key]
	}

	t.Run("truthy values", func(t *testing.T) {
		assert.True(t, BoolOr(env, "TRUE_1", false))
		assert.True(t, BoolOr(env, "TRUE_BOOL", false))
		assert.True(t, BoolOr(env, "TRUE_YES", false))
		assert.True(t, BoolOr(env, "TRUE_ON", false))
	})

	t.Run("falsy values", func(t *testing.T) {
		assert.False(t, BoolOr(env, "FALSE_0", true))
		assert.False(t, BoolOr(env, "FALSE_BOOL", true))
		assert.False(t, BoolOr(env, "FALSE_NO", true))
		assert.False(t, BoolOr(env, "FALSE_OFF", true))
	})

	t.Run("invalid or empty fallback to default", func(t *testing.T) {
		assert.True(t, BoolOr(env, "INVALID", true))
		assert.False(t, BoolOr(env, "INVALID", false))
		assert.True(t, BoolOr(env, "EMPTY", true))
		assert.False(t, BoolOr(env, "MISSING", false))
	})

	t.Run("nil env falls back to os.Getenv", func(t *testing.T) {
		t.Setenv("TEST_ENVX_BOOL", "true")
		assert.True(t, BoolOr(nil, "TEST_ENVX_BOOL", false))
		assert.False(t, BoolOr(nil, "TEST_ENVX_BOOL_MISSING", false))
	})
}
