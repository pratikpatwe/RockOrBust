package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/pratikpatwe/RockOrBust/cli/cmd"
	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
	"github.com/pratikpatwe/RockOrBust/cli/internal/install"
	"github.com/pratikpatwe/RockOrBust/cli/internal/proxy"
	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	ws "github.com/pratikpatwe/RockOrBust/cli/internal/ws"
)

func main() {
	// Detect if started by Windows Explorer (double-click)
	if isStartedByExplorer() && !install.IsInstalled() {
		ui.Info("RockOrBust detected first-run from Explorer.")
		ui.Info("Initiating automatic global installation...")
		if err := install.Install(); err != nil {
			ui.Error("Auto-install failed: %v", err)
			ui.Info("Press Enter to exit...")
			var input string
			fmt.Scanln(&input)
			os.Exit(1)
		}
		ui.Info("Press Enter to exit...")
		var input string
		fmt.Scanln(&input)
		return
	}

	// Internal check for daemon mode. We do this manually to avoid 
	// flag.Parse() conflicting with Cobra's flag handling.
	args := os.Args[1:]
	isDaemon := false
	gatewayURL := ""

	for i := 0; i < len(args); i++ {
		if args[i] == "--daemon" {
			isDaemon = true
		} else if args[i] == "--gateway-url" && i+1 < len(args) {
			gatewayURL = args[i+1]
			i++
		}
	}

	if isDaemon {
		// This is the child daemon process running in the background.
		runDaemon(gatewayURL)
		return
	}

	// Normal CLI mode — hand off to Cobra
	cmd.Execute()
}

func isStartedByExplorer() bool {
	// This is a simplified check. On Windows, Cobra uses mousetrap for this.
	// Since we already have mousetrap via Cobra dependencies, we can use it.
	return startedByExplorer()
}

// runDaemon is the entry point for the background process.
// It loads the config, starts the WebSocket client, and blocks until SIGTERM/SIGINT.
func runDaemon(gatewayURL string) {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[daemon] failed to load config: %v", err)
	}
	if cfg.Key == "" {
		log.Fatal("[daemon] no key configured. Run 'rockorbust key set <key>' first.")
	}

	// If a gateway URL was passed via flag, it overrides the config
	if gatewayURL != "" {
		cfg.GatewayURL = gatewayURL
	}

	log.Printf("[daemon] starting — gateway: %s, hostname will be auto-detected", cfg.GatewayURL)

	// Create the proxy handler — manages HTTP requests and CONNECT tunnels
	proxyHandler := proxy.NewHandler()

	client, err := ws.NewClient(cfg.GatewayURL, cfg.Key, proxyHandler.Handle)
	if err != nil {
		log.Fatalf("[daemon] failed to create WebSocket client: %v", err)
	}

	// Run the WebSocket loop in a goroutine so we can listen for signals
	go client.Run()

	// Block until SIGTERM or SIGINT
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit

	log.Println("[daemon] shutting down")
	client.Stop()
}
