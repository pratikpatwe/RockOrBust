package cmd

import (
	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
	"github.com/pratikpatwe/RockOrBust/cli/internal/install"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
)

var updateCmd = &cobra.Command{
	Use:   "update",
	Short: "Check for and install the latest RockOrBust version",
	Run: func(cmd *cobra.Command, args []string) {
		cfg, err := config.Load()
		if err != nil {
			ui.Error("Failed to load config: %v", err)
			return
		}

		info, err := install.CheckForUpdate(cfg.GatewayURL)
		if err != nil {
			ui.Error("Failed to check for updates: %v", err)
			return
		}

		if info == nil {
			ui.Success("RockOrBust is already up to date!")
			return
		}

		ui.Info("A new version (%s) is available.", info.LatestVersion)
		if err := install.Update(info.DownloadURL); err != nil {
			ui.Error("Update failed: %v", err)
			return
		}
	},
}

func init() {
	rootCmd.AddCommand(updateCmd)
}
