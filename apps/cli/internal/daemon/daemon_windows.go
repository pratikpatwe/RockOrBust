//go:build windows

package daemon

import (
	"os"
	"syscall"
)

// isRunning checks if a process is alive using Windows API.
func isRunning(pid int) bool {
	const processQueryLimitedInformation = 0x1000
	h, err := syscall.OpenProcess(processQueryLimitedInformation, false, uint32(pid))
	if err != nil {
		return false
	}
	defer syscall.CloseHandle(h)

	var exitCode uint32
	err = syscall.GetExitCodeProcess(h, &exitCode)
	if err != nil {
		return false
	}
	return exitCode == 259 // STILL_ACTIVE
}

// stopGracefully kills the process on Windows as SIGTERM is not supported.
func stopGracefully(pid int) error {
	process, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	return process.Kill()
}

// forceKill is the same as stopGracefully on Windows.
func forceKill(pid int) error {
	return stopGracefully(pid)
}
