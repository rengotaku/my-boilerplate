package cmd

import (
	"bytes"
	"context"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func runRoot(t *testing.T, args ...string) (stdout, stderr string, err error) {
	t.Helper()
	var outBuf, errBuf bytes.Buffer
	rootCmd.SetOut(&outBuf)
	rootCmd.SetErr(&errBuf)
	rootCmd.SetArgs(args)
	logOut = &errBuf
	t.Cleanup(func() {
		rootCmd.SetArgs(nil)
		logOut = nil
	})
	err = rootCmd.ExecuteContext(context.Background())
	return outBuf.String(), errBuf.String(), err
}

func TestHelloCommand_Default(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("LOG_LEVEL", "info")

	out, _, err := runRoot(t, "hello")

	require.NoError(t, err)
	assert.Equal(t, "Hello, World!\n", out)
}

func TestHelloCommand_WithName(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("LOG_LEVEL", "debug")

	out, errOut, err := runRoot(t, "hello", "Alice")

	require.NoError(t, err)
	assert.Equal(t, "Hello, Alice!\n", out)
	assert.Contains(t, errOut, "msg=greeting")
	assert.Contains(t, errOut, "name=Alice")
}

func TestVersionCommand(t *testing.T) {
	out, _, err := runRoot(t, "version")

	require.NoError(t, err)
	assert.True(t, strings.HasPrefix(out, "mycli version "), "got %q", out)
}

func TestConfigCommand(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "warn")

	out, _, err := runRoot(t, "config")

	require.NoError(t, err)
	assert.Contains(t, out, "APP_ENV=production")
	assert.Contains(t, out, "LOG_LEVEL=warn")
}
