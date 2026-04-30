package cmd

import (
	"fmt"

	"github.com/pratikpatwe/RockOrBust/cli/internal/daemon"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check if the residential node is active",
	Long:  `Reads the PID file and checks whether the daemon process is alive.`,
	Run: func(cmd *cobra.Command, args []string) {
		pid, err := daemon.ReadPID()
		if err != nil {
			fmt.Printf("Status: %s\n", ui.RedText("Stopped"))
			return
		}

		if daemon.IsRunning(pid) {
			fmt.Printf("Status: %s (PID: %d)\n", ui.GreenText("Running"), pid)
		} else {
			fmt.Printf("Status: %s\n", ui.RedText("Stopped"))
		}
	},
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
