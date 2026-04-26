package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/websocket"
	"github.com/pratikpatwe/RockOrBust/cli/cmd"
	"github.com/pratikpatwe/RockOrBust/cli/internal/config"
	ws "github.com/pratikpatwe/RockOrBust/cli/internal/ws"
)

func main() {
	// Internal flags used when the process is re-launched as a background daemon.
	// These are not exposed via Cobra — they are for internal process management only.
	daemonMode := flag.Bool("daemon", false, "Run as background daemon (internal use)")
	gatewayURL := flag.String("gateway-url", "", "Gateway WebSocket URL (internal use)")
	flag.Parse()

	if *daemonMode {
		// This is the child daemon process running in the background.
		runDaemon(*gatewayURL)
		return
	}

	// Normal CLI mode — hand off to Cobra
	cmd.Execute()
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

	// Phase 5 will implement the full proxy message handler.
	// For now the handler logs every message received from the gateway.
	handler := func(conn *websocket.Conn, raw []byte) {
		log.Printf("[ws] received message: %s", string(raw))
	}

	client, err := ws.NewClient(cfg.GatewayURL, cfg.Key, handler)
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
