package cmd

import (
	"github.com/pratikpatwe/RockOrBust/cli/internal/install"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/spf13/cobra"
)

var installCmd = &cobra.Command{
	Use:   "install",
	Short: "Install RockOrBust globally for easy terminal access",
	Long:  `Installs the RockOrBust binary to a permanent location and adds it to your system PATH.`,
	Run: func(cmd *cobra.Command, args []string) {
		if err := install.Install(); err != nil {
			ui.Error("Installation failed: %v", err)
		}
	},
}

func init() {
	rootCmd.AddCommand(installCmd)
}
