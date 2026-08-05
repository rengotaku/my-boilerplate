package cmd

import (
	"bytes"
	"context"
	"strings"
	"testing"

	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// resetFlags restores every local flag on c to its default value and clears
// Changed. cobra commands are package-level singletons, so any flag a test
// sets (including required flags like wrapCmd's --candidates) otherwise
// leaks its value and Changed=true into the next test's Execute call.
func resetFlags(c *cobra.Command) {
	c.Flags().VisitAll(func(f *pflag.Flag) {
		_ = f.Value.Set(f.DefValue)
		f.Changed = false
	})
}

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
		resetFlags(rootCmd)
		for _, c := range rootCmd.Commands() {
			resetFlags(c)
		}
	})
	err = rootCmd.ExecuteContext(context.Background())
	return outBuf.String(), errBuf.String(), err
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
