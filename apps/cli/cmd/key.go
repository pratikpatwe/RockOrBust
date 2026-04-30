package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
)

// Default gateway for key generation
const defaultGateway = "https://robapi.buildshot.xyz"

var keyCmd = &cobra.Command{
	Use:   "key",
	Short: "Manage your residential access key",
}

var keyShowCmd = &cobra.Command{
	Use:   "show",
	Short: "Display your current access key",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, err := config.Load()
		if err != nil {
			ui.Error("Failed to load configuration: %v", err)
			return
		}

		if cfg.Key == "" {
			ui.Warning("No access key found. Run 'rockorbust key generate' to get one.")
			return
		}

		fmt.Printf("Current Key: %s\n", ui.BoldText(cfg.Key))
	},
}

var keyGenerateCmd = &cobra.Command{
	Use:   "generate",
	Short: "Get a new rob_ key automatically",
	Long:  `Securely requests a new unique access key from the gateway and saves it to your local configuration.`,
	Run: func(cmd *cobra.Command, args []string) {
		ui.Info("Requesting new key from gateway...")

		resp, err := http.Post(defaultGateway+"/auth/register", "application/json", nil)
		if err != nil {
			ui.Error("Could not connect to gateway: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			var errResp struct {
				Error string `json:"error"`
			}
			json.NewDecoder(resp.Body).Decode(&errResp)
			ui.Error("Gateway returned %d - %s", resp.StatusCode, errResp.Error)
			return
		}

		var successResp struct {
			Key string `json:"key"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&successResp); err != nil {
			ui.Error("Failed to parse gateway response: %v", err)
			return
		}

		if err := config.SetKey(successResp.Key); err != nil {
			ui.Error("Failed to save new key: %v", err)
			return
		}

		ui.Success("New key generated and saved: %s", ui.BoldText(successResp.Key))
		fmt.Printf("Run '%s' to begin contributing.\n", ui.BoldText("rockorbust start"))
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
			ui.Error("Key must start with 'rob_'")
			return
		}

		if err := config.SetKey(key); err != nil {
			ui.Error("Failed to save key: %v", err)
			return
		}

		ui.Success("Key linked successfully.")
	},
}

func init() {
	keyCmd.AddCommand(keyShowCmd)
	keyCmd.AddCommand(keySetCmd)
	keyCmd.AddCommand(keyGenerateCmd)
	rootCmd.AddCommand(keyCmd)
}
