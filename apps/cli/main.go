package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/pratikpatwe/RockOrBust/cli/cmd"
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
// Phase 4 will replace the placeholder with the real WebSocket client loop.
func runDaemon(gatewayURL string) {
	fmt.Fprintf(os.Stderr, "[daemon] starting with gateway: %s\n", gatewayURL)

	// Block until we receive a termination signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit

	fmt.Fprintln(os.Stderr, "[daemon] shutting down")
	os.Exit(0)
}
