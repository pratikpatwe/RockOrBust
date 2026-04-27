//go:build !windows

package daemon

import (
	"os"
	"syscall"
)

// isRunning checks if a process is alive using signal 0.
func isRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	// On Unix, FindProcess always succeeds; we must send signal 0
	// to actually check if the process is alive.
	return process.Signal(syscall.Signal(0)) == nil
}

// stopGracefully sends SIGTERM to the process.
func stopGracefully(pid int) error {
	process, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	return process.Signal(syscall.SIGTERM)
}
