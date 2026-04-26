package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the RockOrBust node daemon in the background",
	Long:  `Launches the node daemon as a background process. The terminal returns immediately. Use 'rockorbust status' to check if it is running.`,
	Run: func(cmd *cobra.Command, args []string) {
		// Phase 3: Daemon management will be implemented here
		fmt.Println("start: not yet implemented (Phase 3)")
	},
}

func init() {
	startCmd.Flags().String("gateway", "", "Override the gateway WebSocket URL (e.g. ws://example.com:8080)")
	rootCmd.AddCommand(startCmd)
}
