package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check if the RockOrBust node daemon is running",
	Long:  `Reads the PID file and checks whether the daemon process is alive.`,
	Run: func(cmd *cobra.Command, args []string) {
		// Phase 3: Daemon management will be implemented here
		fmt.Println("status: not yet implemented (Phase 3)")
	},
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
