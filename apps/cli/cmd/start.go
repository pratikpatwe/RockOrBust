package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"syscall"

	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
	"github.com/pratikpatwe/RockOrBust/cli/internal/daemon"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the RockOrBust node daemon in the background",
	Long:  `Launches the node daemon as a background process. The terminal returns immediately. Use 'rockorbust status' to check if it is running.`,
	Run: func(cmd *cobra.Command, args []string) {
		// Check if already running
		pid, _ := daemon.ReadPID()
		if daemon.IsRunning(pid) {
			fmt.Printf("Daemon is already running (PID: %d)\n", pid)
			return
		}

		// Load config and apply --gateway override if provided
		cfg, err := config.Load()
		if err != nil {
			fmt.Printf("Error: failed to load config: %v\n", err)
			return
		}
		if cfg.Key == "" {
			fmt.Println("Error: no key configured. Run 'rockorbust key set <key>' first.")
			return
		}

		gatewayFlag, _ := cmd.Flags().GetString("gateway")
		if gatewayFlag != "" {
			cfg.GatewayURL = gatewayFlag
		}

		// Re-run this binary with the internal --daemon flag, detached from the terminal.
		self, err := os.Executable()
		if err != nil {
			fmt.Printf("Error: could not determine executable path: %v\n", err)
			return
		}

		child := exec.Command(self, "--daemon", "--gateway-url", cfg.GatewayURL)
		child.SysProcAttr = &syscall.SysProcAttr{
			Setsid: true, // Detach from terminal session (Unix)
		}
		// Redirect child output to /dev/null so it runs silently
		child.Stdout = nil
		child.Stderr = nil
		child.Stdin = nil

		if err := child.Start(); err != nil {
			fmt.Printf("Error: failed to start daemon: %v\n", err)
			return
		}

		// Write the child's PID so status/stop can track it
		if err := daemon.WritePID(child.Process.Pid); err != nil {
			fmt.Printf("Warning: daemon started but PID file could not be written: %v\n", err)
		}

		fmt.Printf("✓ Daemon started (PID: %d)\n", child.Process.Pid)
	},
}

func init() {
	startCmd.Flags().String("gateway", "", "Override the gateway WebSocket URL (e.g. ws://example.com:8080)")
	rootCmd.AddCommand(startCmd)
}
