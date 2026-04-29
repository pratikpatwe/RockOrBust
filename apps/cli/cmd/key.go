package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
	"github.com/spf13/cobra"
)

// Default gateway for key generation
const defaultGateway = "https://robapi.buildshot.xyz"

var keyCmd = &cobra.Command{
	Use:   "key",
	Short: "Manage your residential access key",
}

var keyGenerateCmd = &cobra.Command{
	Use:   "generate",
	Short: "Get a new rob_ key automatically",
	Long:  `Securely requests a new unique access key from the gateway and saves it to your local configuration.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("🛰️ Requesting new key from gateway...")

		resp, err := http.Post(defaultGateway+"/auth/register", "application/json", nil)
		if err != nil {
			fmt.Printf("Error: could not connect to gateway: %v\n", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			var errResp struct {
				Error string `json:"error"`
			}
			json.NewDecoder(resp.Body).Decode(&errResp)
			fmt.Printf("Error: gateway returned %d - %s\n", resp.StatusCode, errResp.Error)
			return
		}

		var successResp struct {
			Key string `json:"key"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&successResp); err != nil {
			fmt.Printf("Error: failed to parse gateway response: %v\n", err)
			return
		}

		if err := config.SetKey(successResp.Key); err != nil {
			fmt.Printf("Error: failed to save new key: %v\n", err)
			return
		}

		fmt.Printf("✨ New key generated and saved: %s\n", successResp.Key)
		fmt.Println("🚀 You can now run 'rockorbust start' to begin contributing.")
	},
}

var keySetCmd = &cobra.Command{
	Use:   "set <key>",
	Short: "Link your device with an existing key",
	Long:  `Saves a provided rob_ key to your local config. Use this if you already have a key from a teammate or the dashboard.`,
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

		fmt.Printf("✓ Key linked successfully.\n")
	},
}

func init() {
	keyCmd.AddCommand(keySetCmd)
	keyCmd.AddCommand(keyGenerateCmd)
	rootCmd.AddCommand(keyCmd)
}
