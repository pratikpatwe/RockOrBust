package daemon

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

const pidFileName = "rockorbust.pid"

// pidFilePath returns the OS-appropriate path for the PID file.
// Linux/Mac: /tmp/rockorbust.pid
// Windows:   %TEMP%\rockorbust.pid
func pidFilePath() (string, error) {
	var dir string

	if runtime.GOOS == "windows" {
		dir = os.Getenv("TEMP")
		if dir == "" {
			return "", fmt.Errorf("%%TEMP%% is not set")
		}
	} else {
		dir = "/tmp"
	}

	return filepath.Join(dir, pidFileName), nil
}

// WritePID writes the given PID to the PID file.
func WritePID(pid int) error {
	path, err := pidFilePath()
	if err != nil {
		return err
	}
	return os.WriteFile(path, []byte(strconv.Itoa(pid)), 0o644)
}

// ReadPID reads the PID from the PID file.
// Returns 0 and no error if the file doesn't exist.
func ReadPID() (int, error) {
	path, err := pidFilePath()
	if err != nil {
		return 0, err
	}

	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("failed to read PID file: %w", err)
	}

	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		return 0, fmt.Errorf("PID file is corrupt: %w", err)
	}

	return pid, nil
}

// RemovePID deletes the PID file.
func RemovePID() error {
	path, err := pidFilePath()
	if err != nil {
		return err
	}
	err = os.Remove(path)
	if os.IsNotExist(err) {
		return nil // already gone, no problem
	}
	return err
}

// IsRunning checks if the process with the given PID is alive.
func IsRunning(pid int) bool {
	if pid == 0 {
		return false
	}
	return isRunning(pid)
}

// Stop sends SIGTERM to the daemon and removes the PID file.
func Stop() error {
	pid, err := ReadPID()
	if err != nil {
		return err
	}
	if !IsRunning(pid) {
		_ = RemovePID()
		return fmt.Errorf("daemon is not running")
	}

	if err := stopGracefully(pid); err != nil {
		return fmt.Errorf("failed to stop daemon: %w", err)
	}

	return RemovePID()
}
