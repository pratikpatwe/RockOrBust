package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "rockorbust",
	Short: "RockOrBust — stealth proxy network for Playwright",
	Long: `RockOrBust routes Playwright traffic through residential nodes
to bypass bot detection, TLS fingerprinting, and IP reputation checks.

Use 'rockorbust key set <key>' to configure your node key,
then 'rockorbust start' to join the network.`,
}

// Execute is the entry point called from main.go
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
