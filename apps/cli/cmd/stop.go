package cmd

import (
	"os/exec"
	"github.com/pratikpatwe/RockOrBust/cli/internal/autostart"
	"github.com/pratikpatwe/RockOrBust/cli/internal/daemon"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
	"runtime"
)

func isSystemdManaged() bool {
	if runtime.GOOS != "linux" {
		return false
	}
	err := exec.Command("systemctl", "--user", "is-active", "rockorbust.service").Run()
	return err == nil
}

var bustCmd = &cobra.Command{
	Use:   "bust",
	Short: "Stop the running residential node daemon",
	Long:  `Reads the PID file, sends a signal to the daemon process, and removes the PID file.`,
	Run: func(cmd *cobra.Command, args []string) {
		if isSystemdManaged() {
			if err := exec.Command("systemctl", "--user", "stop", "rockorbust.service").Run(); err != nil {
				ui.Error("Failed to stop via systemd: %v", err)
				return
			}
		} else {
			if err := daemon.Stop(); err != nil {
				ui.Error("%v", err)
				return
			}
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
