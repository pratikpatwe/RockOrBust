package cmd

import (
	"fmt"
	"os"

	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "rockorbust",
	Short: "RockOrBust — The ultimate stealth residential proxy network",
	Long: `RockOrBust is a high-performance stealth proxy network that humanizes
automation by routing traffic through real residential connections.

` + ui.BoldText("Quick Start:") + `
  1. rockorbust key generate  - Get your unique access key
  2. rockorbust key show      - View your active key
  3. rockorbust rock          - Join the residential network
  4. rockorbust status        - Check your connection health
  5. rockorbust bust          - Leave the network`,
}

// Execute is the entry point called from main.go
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
