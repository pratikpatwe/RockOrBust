package cmd

import (
	"fmt"

	"github.com/pratikpatwe/RockOrBust/cli/internal/daemon"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check if the RockOrBust node daemon is running",
	Long:  `Reads the PID file and checks whether the daemon process is alive.`,
	Run: func(cmd *cobra.Command, args []string) {
		pid, err := daemon.ReadPID()
		if err != nil {
			fmt.Printf("Error: could not read PID file: %v\n", err)
			return
		}

		if daemon.IsRunning(pid) {
			fmt.Printf("Running (PID: %d)\n", pid)
		} else {
			fmt.Println("Not running")
		}
	},
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
