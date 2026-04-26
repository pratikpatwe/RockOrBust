package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop the running RockOrBust node daemon",
	Long:  `Reads the PID file, sends a signal to the daemon process, and removes the PID file.`,
	Run: func(cmd *cobra.Command, args []string) {
		// Phase 3: Daemon management will be implemented here
		fmt.Println("stop: not yet implemented (Phase 3)")
	},
}

func init() {
	rootCmd.AddCommand(stopCmd)
}
