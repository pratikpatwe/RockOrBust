package cmd

import (
	"fmt"
	"os"

	"github.com/pratikpatwe/RockOrBust/cli/internal/install"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/pratikpatwe/RockOrBust/cli/internal/version"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:     "rockorbust",
	Version: version.Version,
	Short:   "RockOrBust — The ultimate stealth residential proxy network",
	Long: `RockOrBust is a high-performance stealth proxy network that humanizes
automation by routing traffic through real residential connections.

` + ui.BoldText("Version: ") + version.Version + `

` + ui.BoldText("Quick Start:") + `
  1. rockorbust key generate  - Get your unique access key
  2. rockorbust key show      - View your active key
  3. rockorbust rock          - Join the residential network
  4. rockorbust status        - Check your connection health
  5. rockorbust bust          - Leave the network`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// 1. Cleanup any legacy .old binaries from previous updates
		if exe, err := os.Executable(); err == nil {
			oldExe := exe + ".old"
			if _, err := os.Stat(oldExe); err == nil {
				_ = os.Remove(oldExe)
			}
		}

		// 2. Only check if we are NOT running the install command itself
		if cmd.Name() != "install" && !install.IsInstalled() {
			ui.Warning("RockOrBust is not installed globally.")
			ui.Info("Run 'rockorbust install' to enable access from any terminal.")
			fmt.Println()
		}
	},
}

func init() {
	rootCmd.SetVersionTemplate(ui.BoldText("RockOrBust CLI version: ") + "{{.Version}}\n")
}

// Execute is the entry point called from main.go
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
