package cmd

// wrapCmd is the reference example for this template: it wires
// internal/execx + internal/fallback + internal/logscan together to run an
// external command, retrying against the next candidate only when the
// failure looks retryable (timeout, or a rate-limit/quota signature
// detected in stdout/stderr/error text). Copy this pattern when wrapping a
// real external CLI (see internal/fallback and internal/logscan doc
// comments for the underlying policy).

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"mycli/internal/execx"
	"mycli/internal/fallback"
)

var wrapCmd = &cobra.Command{
	Use:   "wrap --candidates CMD1[,CMD2,...] [--timeout DURATION] -- ARGS...",
	Short: "Run an external command with fallback across candidates",
	Long: "Execute ARGS against each candidate command in order.\n\n" +
		"A candidate attempt is retried against the next candidate only when\n" +
		"the failure looks retryable: the attempt timed out, or its combined\n" +
		"stdout/stderr/error text matches a rate-limit/quota signature\n" +
		"(internal/logscan.Detect). Any other non-zero exit is treated as a\n" +
		"permanent failure and stops the chain immediately.\n\n" +
		"Example: mycli wrap --candidates primary-cli,backup-cli -- --version",
	Args: cobra.ArbitraryArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		candidatesRaw, err := cmd.Flags().GetString("candidates")
		if err != nil {
			return err
		}
		timeout, err := cmd.Flags().GetDuration("timeout")
		if err != nil {
			return err
		}

		candidates := strings.Split(candidatesRaw, ",")
		for i, c := range candidates {
			candidates[i] = strings.TrimSpace(c)
		}

		run := func(ctx context.Context, candidate string) (execx.Result, error) {
			return execx.Run(ctx, &execx.Options{
				Command: candidate,
				Args:    args,
				Timeout: timeout,
			})
		}

		res, err := fallback.Execute(cmd.Context(), candidates, run)
		for _, attempt := range res.Attempts {
			slog.DebugContext(cmd.Context(), "wrap attempt",
				"candidate", attempt.Candidate,
				"retryable", attempt.Retryable,
				"error", attempt.Error,
			)
		}

		// Forward the final attempt's stderr so the wrapped CLI's warnings and
		// diagnostics are never silently discarded, whether it succeeded or
		// failed permanently.
		if res.FinalResult.Stderr != "" {
			if _, werr := fmt.Fprint(cmd.ErrOrStderr(), res.FinalResult.Stderr); werr != nil {
				return werr
			}
		}

		if err != nil {
			return err
		}

		if _, werr := fmt.Fprint(cmd.OutOrStdout(), res.FinalResult.Stdout); werr != nil {
			return werr
		}
		slog.InfoContext(cmd.Context(), "wrap succeeded", "candidate", res.SuccessfulCandidate)
		return nil
	},
}

func init() {
	wrapCmd.Flags().String("candidates", "", "comma-separated candidate commands to try in order (required)")
	wrapCmd.Flags().Duration("timeout", 30*time.Second, "per-attempt execution timeout")
	if err := wrapCmd.MarkFlagRequired("candidates"); err != nil {
		panic(err)
	}
	rootCmd.AddCommand(wrapCmd)
}
