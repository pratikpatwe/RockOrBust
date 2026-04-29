package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "rockorbust",
	Short: "RockOrBust 🎸 — The ultimate stealth residential proxy network",
	Long: `RockOrBust is a high-performance stealth proxy network that humanizes
automation by routing traffic through real residential connections.

Quick Start:
  1. rockorbust key generate  - Get your unique access key
  2. rockorbust start         - Join the residential network
  3. rockorbust status        - Check your connection health`,
}

// Execute is the entry point called from main.go
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
