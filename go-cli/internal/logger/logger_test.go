package logger

import (
	"bytes"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNew_DevelopmentUsesTextHandler(t *testing.T) {
	var buf bytes.Buffer
	log := New(&buf, Options{AppEnv: "development", LogLevel: "info"})
	require.NotNil(t, log)

	log.Info("hello", "name", "World")

	out := buf.String()
	assert.Contains(t, out, "msg=hello")
	assert.Contains(t, out, "name=World")
	assert.False(t, strings.HasPrefix(strings.TrimSpace(out), "{"), "text handler should not emit JSON")
}

func TestNew_ProductionUsesJSONHandler(t *testing.T) {
	var buf bytes.Buffer
	log := New(&buf, Options{AppEnv: "production", LogLevel: "info"})

	log.Info("hello", "name", "World")

	out := strings.TrimSpace(buf.String())
	assert.True(t, strings.HasPrefix(out, "{") && strings.HasSuffix(out, "}"), "JSON handler should emit a JSON object: %s", out)
	assert.Contains(t, out, `"msg":"hello"`)
	assert.Contains(t, out, `"name":"World"`)
}

func TestNew_DebugLevelEmitsDebug(t *testing.T) {
	var buf bytes.Buffer
	log := New(&buf, Options{AppEnv: "development", LogLevel: "debug"})

	log.Debug("trace")

	assert.Contains(t, buf.String(), "msg=trace")
}

func TestNew_InvalidLevelFallsBackToInfo(t *testing.T) {
	var buf bytes.Buffer
	log := New(&buf, Options{AppEnv: "development", LogLevel: "not-a-level"})

	log.Debug("should-not-appear")
	log.Info("info-message")

	out := buf.String()
	assert.NotContains(t, out, "should-not-appear")
	assert.Contains(t, out, "msg=info-message")
}
