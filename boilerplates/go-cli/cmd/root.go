// Package cmd wires Cobra commands to internal services.
package cmd

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"

	"github.com/spf13/cobra"

	"mycli/internal/config"
	"mycli/internal/greet"
	"mycli/internal/logger"
)

// Version is set at build time.
var Version = "dev"

var (
	cfg    *config.Config
	logOut io.Writer = os.Stderr
)

var rootCmd = &cobra.Command{
	Use:   "mycli",
	Short: "A simple CLI application",
	Long:  "A simple CLI application built with Go and Cobra.",
	PersistentPreRunE: func(cmd *cobra.Command, _ []string) error {
		c, err := config.Load(cmd.Context())
		if err != nil {
			return fmt.Errorf("load config: %w", err)
		}
		cfg = c
		slog.SetDefault(logger.New(logOut, logger.Options{
			AppEnv:   c.AppEnv,
			LogLevel: c.LogLevel,
		}))
		return nil
	},
}

var helloCmd = &cobra.Command{
	Use:   "hello [name]",
	Short: "Print a greeting",
	Long:  "Print a greeting message. Optionally specify a name.",
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := "World"
		if len(args) > 0 {
			name = args[0]
		}
		slog.DebugContext(cmd.Context(), "greeting", "name", name)
		_, err := fmt.Fprintln(cmd.OutOrStdout(), greet.Hello(name))
		return err
	},
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version",
	Long:  "Print the version of mycli.",
	RunE: func(cmd *cobra.Command, _ []string) error {
		_, err := fmt.Fprintf(cmd.OutOrStdout(), "mycli version %s\n", Version)
		return err
	},
}

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Print the loaded configuration",
	Long:  "Print the runtime configuration loaded from environment variables.",
	RunE: func(cmd *cobra.Command, _ []string) error {
		if cfg == nil {
			return fmt.Errorf("config not loaded")
		}
		_, err := fmt.Fprintf(cmd.OutOrStdout(), "APP_ENV=%s\nLOG_LEVEL=%s\n", cfg.AppEnv, cfg.LogLevel)
		return err
	},
}

func init() {
	rootCmd.AddCommand(helloCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(configCmd)
}

// Execute runs the root command with a background context.
func Execute() error {
	return rootCmd.ExecuteContext(context.Background())
}
