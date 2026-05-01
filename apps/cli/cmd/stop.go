package cmd

import (
	"github.com/pratikpatwe/RockOrBust/cli/internal/autostart"
	"github.com/pratikpatwe/RockOrBust/cli/internal/daemon"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
)

var bustCmd = &cobra.Command{
	Use:   "bust",
	Short: "Stop the running residential node daemon",
	Long:  `Reads the PID file, sends a signal to the daemon process, and removes the PID file.`,
	Run: func(cmd *cobra.Command, args []string) {
		if err := daemon.Stop(); err != nil {
			ui.Error("%v", err)
			return
		}

		// Disable autostart
		if err := autostart.Disable(); err != nil {
			ui.Warning("Could not disable autostart: %v", err)
		}

		ui.Success("Daemon busted")
	},
}

func init() {
	rootCmd.AddCommand(bustCmd)
}
