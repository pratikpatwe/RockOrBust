package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var keyCmd = &cobra.Command{
	Use:   "key",
	Short: "Manage your RockOrBust node key",
}

var keySetCmd = &cobra.Command{
	Use:   "set <key>",
	Short: "Save your rob_ key to the local config file",
	Long:  `Saves the provided rob_ key to the OS-appropriate config file. The key is used to authenticate this node with the gateway.`,
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		// Phase 2: Config system will be implemented here
		fmt.Printf("key set: not yet implemented (Phase 2) — key provided: %s\n", args[0])
	},
}

func init() {
	keyCmd.AddCommand(keySetCmd)
	rootCmd.AddCommand(keyCmd)
}
