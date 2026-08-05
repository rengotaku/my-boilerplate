package cmd

// Cobra command conventions (read before adding commands)
//
// This file is the recommended skeleton for new subcommands. Follow these
// rules so `--help`, flag parsing, and `--` (end-of-options) keep working —
// they are exactly what you lose the moment you reach for DisableFlagParsing.
//
//  1. Do NOT set `DisableFlagParsing: true` without a concrete, documented
//     reason. It silently disables cobra/pflag's built-in `--help`/`-h`
//     handling AND the standard `--` argument terminator, forcing every
//     command to re-implement a worse parser by hand. The classic failure:
//     `mytool add --help` writes a record titled "--help" instead of printing
//     usage. If you truly must disable it, write a `// DisableFlagParsing:`
//     comment explaining why.
//  2. Define options as real pflag flags (cmd.Flags().StringVar(...)), never a
//     hand-rolled scan of args. Typos then fail loudly as `unknown flag`.
//  3. Free-form text that may start with `-` is passed by the caller AFTER a
//     `--` terminator: `mycli note -- "--dry-run is broken"`. pflag treats a
//     token as a flag only when it starts with `-`, so `--` is the standard,
//     zero-cost way to pass leading-dash text. Let cobra own help/flag/`--`.

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
)

// noteCmd is the canonical "safe" subcommand: a free-text positional argument
// plus real flags, with no DisableFlagParsing. `--help` works automatically,
// unknown flags are rejected, and a leading-dash title is passed via `--`.
var noteCmd = &cobra.Command{
	Use:   "note TITLE [--tags t1,t2] [--priority N]",
	Short: "Record a note (skeleton showing safe flag handling)",
	Long: "Record a note.\n\n" +
		"Demonstrates the recommended cobra pattern: real flags, automatic --help,\n" +
		"and `--` for titles that start with a dash, e.g.:\n" +
		"  mycli note -- \"--dry-run needs documenting\"",
	Args: cobra.ExactArgs(1), // TITLE
	RunE: func(cmd *cobra.Command, args []string) error {
		title := args[0]
		tags, err := cmd.Flags().GetStringSlice("tags")
		if err != nil {
			return err
		}
		priority, err := cmd.Flags().GetInt("priority")
		if err != nil {
			return err
		}
		out := cmd.OutOrStdout()
		if _, err := fmt.Fprintf(out, "note: %s\n", title); err != nil {
			return err
		}
		if len(tags) > 0 {
			if _, err := fmt.Fprintf(out, "tags: %s\n", strings.Join(tags, ",")); err != nil {
				return err
			}
		}
		_, err = fmt.Fprintf(out, "priority: %d\n", priority)
		return err
	},
}

func init() {
	noteCmd.Flags().StringSlice("tags", nil, "comma-separated tags")
	noteCmd.Flags().Int("priority", 0, "priority (higher = more urgent)")
	rootCmd.AddCommand(noteCmd)
}
