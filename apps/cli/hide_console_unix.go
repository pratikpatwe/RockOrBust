//go:build !windows

package main

// hideConsole is a no-op on non-Windows platforms.
// Linux and macOS services launched by Systemd/LaunchAgents never open
// a visible console window, so no action is needed.
func hideConsole() {}
