//go:build darwin

package autostart

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

const plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.rockorbust.daemon</string>
	<key>ProgramArguments</key>
	<array>
		<string>%s</string>
		<string>--daemon</string>
	</array>
	<key>RunAtLoad</key>
	<true/>
	<key>KeepAlive</key>
	<true/>
</dict>
</plist>
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

	plistPath := filepath.Join(home, "Library", "LaunchAgents", "com.rockorbust.daemon.plist")
	content := fmt.Sprintf(plistTemplate, execPath)

	if err := os.WriteFile(plistPath, []byte(content), 0644); err != nil {
		return err
	}

	// Modern macOS use bootstrap gui/<uid>
	uid := os.Getuid()
	domain := fmt.Sprintf("gui/%d", uid)
	return exec.Command("launchctl", "bootstrap", domain, plistPath).Run()
}

func Disable() error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	plistPath := filepath.Join(home, "Library", "LaunchAgents", "com.rockorbust.daemon.plist")
	if _, err := os.Stat(plistPath); err == nil {
		uid := os.Getuid()
		domain := fmt.Sprintf("gui/%d", uid)
		exec.Command("launchctl", "bootout", domain, plistPath).Run()
		return os.Remove(plistPath)
	}

	return nil
}
