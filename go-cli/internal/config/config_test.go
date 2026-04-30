package config

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoad_Defaults(t *testing.T) {
	// Anchor environment for test cleanup, then unset so envconfig applies defaults.
	t.Setenv("APP_ENV", "x")
	t.Setenv("LOG_LEVEL", "x")
	require.NoError(t, os.Unsetenv("APP_ENV"))
	require.NoError(t, os.Unsetenv("LOG_LEVEL"))

	cfg, err := Load(context.Background())

	require.NoError(t, err)
	assert.Equal(t, "development", cfg.AppEnv)
	assert.Equal(t, "info", cfg.LogLevel)
}

func TestLoad_FromEnv(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("LOG_LEVEL", "debug")

	cfg, err := Load(context.Background())

	require.NoError(t, err)
	assert.Equal(t, "production", cfg.AppEnv)
	assert.Equal(t, "debug", cfg.LogLevel)
}
