package cmd

import (
	"os"
	"os/exec"

	"github.com/pratikpatwe/RockOrBust/cli/internal/autostart"
	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
	"github.com/pratikpatwe/RockOrBust/cli/internal/daemon"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
)

var rockCmd = &cobra.Command{
	Use:   "rock",
	Short: "Start the residential node daemon",
	Long:  `Launches the background process that connects your residential IP to the proxy pool.`,
	Run: func(cmd *cobra.Command, args []string) {
		// Check if already running
		pid, _ := daemon.ReadPID()
		if daemon.IsRunning(pid) {
			ui.Warning("Daemon is already rocking (PID: %d)", pid)
			return
		}

		// Load config and apply --gateway override if provided
		cfg, err := config.Load()
		if err != nil {
			ui.Error("Failed to load config: %v", err)
			return
		}
		if cfg.Key == "" {
			ui.Error("No key configured. Run 'rockorbust key set <key>' or 'rockorbust key generate' first.")
			return
		}

		gatewayFlag, _ := cmd.Flags().GetString("gateway")
		if gatewayFlag != "" {
			cfg.GatewayURL = gatewayFlag
		}

		// Re-run this binary with the internal --daemon flag, detached from the terminal.
		self, err := os.Executable()
		if err != nil {
			ui.Error("Could not determine executable path: %v", err)
			return
		}

		child := exec.Command(self, "--daemon", "--gateway-url", cfg.GatewayURL)
		child.SysProcAttr = getSysProcAttr()
		// Redirect child output to /dev/null so it runs silently
		child.Stdout = nil
		child.Stderr = nil
		child.Stdin = nil

		if err := child.Start(); err != nil {
			ui.Error("Failed to start daemon: %v", err)
			return
		}

		// Write the child's PID so status/stop can track it
		if err := daemon.WritePID(child.Process.Pid); err != nil {
			ui.Warning("Daemon started but PID file could not be written: %v", err)
		}

		// Enable autostart
		if err := autostart.Enable(); err != nil {
			ui.Warning("Could not enable autostart: %v", err)
		}

		ui.Success("Daemon is now rocking (PID: %d)", child.Process.Pid)
	},
}

func init() {
	rockCmd.Flags().String("gateway", "", "Override the gateway WebSocket URL (e.g. ws://example.com:8080)")
	rootCmd.AddCommand(rockCmd)
}
