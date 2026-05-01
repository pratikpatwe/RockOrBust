//go:build linux

package autostart

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

const serviceFileTemplate = `[Unit]
Description=RockOrBust Residential Node
After=network.target

[Service]
Type=simple
ExecStart=%s rock
Restart=always

[Install]
WantedBy=default.target
`

func Enable() error {
	execPath, err := getExecutablePath()
	if err != nil {
		return err
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	serviceDir := filepath.Join(home, ".config", "systemd", "user")
	if err := os.MkdirAll(serviceDir, 0755); err != nil {
		return err
	}

	serviceFile := filepath.Join(serviceDir, "rockorbust.service")
	content := fmt.Sprintf(serviceFileTemplate, execPath)

	if err := os.WriteFile(serviceFile, []byte(content), 0644); err != nil {
		return err
	}

	// Enable the service
	exec.Command("systemctl", "--user", "daemon-reload").Run()
	return exec.Command("systemctl", "--user", "enable", "rockorbust.service").Run()
}

func Disable() error {
	// Disable the service
	exec.Command("systemctl", "--user", "disable", "rockorbust.service").Run()

	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	serviceFile := filepath.Join(home, ".config", "systemd", "user", "rockorbust.service")
	if _, err := os.Stat(serviceFile); err == nil {
		return os.Remove(serviceFile)
	}

	return nil
}
