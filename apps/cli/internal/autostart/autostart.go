package autostart

import (
	"os"
	"path/filepath"
)

// getExecutablePath returns the absolute path to the current executable.
func getExecutablePath() (string, error) {
	self, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Abs(self)
}
