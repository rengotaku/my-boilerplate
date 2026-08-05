package cmd

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"mycli/testutil/fakebin"
)

func TestWrapCommand_SingleCandidateSucceeds(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("LOG_LEVEL", "info")
	fakebin.CreateInPATH(t, "primary-cli", "#!/bin/sh\necho \"ok: $*\"\n")

	out, _, err := runRoot(t, "wrap", "--candidates", "primary-cli", "--", "--version")

	require.NoError(t, err)
	assert.Equal(t, "ok: --version\n", out)
}

func TestWrapCommand_FallsBackOnRateLimitSignature(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("LOG_LEVEL", "info")
	fakebin.CreateInPATH(t, "primary-cli", "#!/bin/sh\necho 'rate limit exceeded' >&2\nexit 1\n")
	fakebin.CreateInPATH(t, "backup-cli", "#!/bin/sh\necho \"backup: $*\"\n")

	out, _, err := runRoot(t, "wrap", "--candidates", "primary-cli,backup-cli", "--", "ping")

	require.NoError(t, err)
	assert.Equal(t, "backup: ping\n", out)
}

func TestWrapCommand_PermanentFailureStopsImmediately(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("LOG_LEVEL", "info")
	fakebin.CreateInPATH(t, "primary-cli", "#!/bin/sh\necho 'boom: invalid argument' >&2\nexit 2\n")
	fakebin.CreateInPATH(t, "backup-cli", "#!/bin/sh\necho \"backup: $*\"\n")

	_, _, err := runRoot(t, "wrap", "--candidates", "primary-cli,backup-cli", "--", "ping")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "exit code 2")
}

func TestWrapCommand_RequiresCandidatesFlag(t *testing.T) {
	_, _, err := runRoot(t, "wrap", "--", "ping")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "candidates")
}
