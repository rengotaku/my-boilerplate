package cmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"mycli/internal/greet"
)

// Version is set at build time.
var Version = "dev"

var rootCmd = &cobra.Command{
	Use:   "mycli",
	Short: "A simple CLI application",
	Long:  "A simple CLI application built with Go and Cobra.",
}

var helloCmd = &cobra.Command{
	Use:   "hello [name]",
	Short: "Print a greeting",
	Long:  "Print a greeting message. Optionally specify a name.",
	Args:  cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		name := "World"
		if len(args) > 0 {
			name = args[0]
		}
		fmt.Println(greet.Hello(name))
	},
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version",
	Long:  "Print the version of mycli.",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("mycli version %s\n", Version)
	},
}

func init() {
	rootCmd.AddCommand(helloCmd)
	rootCmd.AddCommand(versionCmd)
}

// Execute runs the root command.
func Execute() error {
	return rootCmd.Execute()
}
