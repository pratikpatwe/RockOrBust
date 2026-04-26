package cmd

import (
	"fmt"

	"github.com/pratikpatwe/RockOrBust/cli/internal/daemon"
	"github.com/spf13/cobra"
)

var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop the running RockOrBust node daemon",
	Long:  `Reads the PID file, sends a signal to the daemon process, and removes the PID file.`,
	Run: func(cmd *cobra.Command, args []string) {
		if err := daemon.Stop(); err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}
		fmt.Println("✓ Daemon stopped")
	},
}

func init() {
	rootCmd.AddCommand(stopCmd)
}
