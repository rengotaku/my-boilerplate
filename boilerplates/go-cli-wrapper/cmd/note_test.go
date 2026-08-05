package cmd

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNoteCommand_FlagsParsed(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("LOG_LEVEL", "info")

	out, _, err := runRoot(t, "note", "Buy milk", "--tags", "home,errand", "--priority", "3")

	require.NoError(t, err)
	assert.Contains(t, out, "note: Buy milk")
	assert.Contains(t, out, "tags: home,errand")
	assert.Contains(t, out, "priority: 3")
}

// Regression for the DisableFlagParsing trap: `--help` must print usage and
// exit 0, never be swallowed as the TITLE argument.
func TestNoteCommand_HelpIsHandled(t *testing.T) {
	out, _, err := runRoot(t, "note", "--help")

	require.NoError(t, err)
	assert.Contains(t, out, "Usage:")
	assert.Contains(t, out, "note TITLE")
}

// A leading-dash title is passed literally after the `--` terminator instead
// of being misread as a flag.
func TestNoteCommand_DashDashPassesLiteralTitle(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	t.Setenv("LOG_LEVEL", "info")

	out, _, err := runRoot(t, "note", "--", "--dry-run needs documenting")

	require.NoError(t, err)
	assert.Contains(t, out, "note: --dry-run needs documenting")
}

// Unknown flags fail loudly rather than being silently accepted as input.
func TestNoteCommand_UnknownFlagRejected(t *testing.T) {
	_, _, err := runRoot(t, "note", "Title", "--bogus", "x")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "unknown flag")
}
