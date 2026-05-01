//go:build windows

package autostart

import (
	"fmt"
	"golang.org/x/sys/windows/registry"
)

const (
	registryPath = `Software\Microsoft\Windows\CurrentVersion\Run`
	appName      = "RockOrBust"
)

func Enable() error {
	execPath, err := getExecutablePath()
	if err != nil {
		return err
	}

	key, err := registry.OpenKey(registry.CURRENT_USER, registryPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	// Use --daemon flag to start silently in the background, bypasses mousetrap/explorer checks
	return key.SetStringValue(appName, fmt.Sprintf("\"%s\" --daemon", execPath))
}

func Disable() error {
	key, err := registry.OpenKey(registry.CURRENT_USER, registryPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	return key.DeleteValue(appName)
}
