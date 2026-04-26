package cmd

import (
	"fmt"
	"strings"

	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
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
		key := strings.TrimSpace(args[0])

		if !strings.HasPrefix(key, "rob_") {
			fmt.Println("Error: key must start with 'rob_'")
			return
		}

		if err := config.SetKey(key); err != nil {
			fmt.Printf("Error: failed to save key: %v\n", err)
			return
		}

		fmt.Printf("✓ Key saved successfully.\n")
	},
}

func init() {
	keyCmd.AddCommand(keySetCmd)
	rootCmd.AddCommand(keyCmd)
}
