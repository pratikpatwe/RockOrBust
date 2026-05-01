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

	// Use "rock" command as the startup command, wrap path in quotes to handle spaces
	return key.SetStringValue(appName, fmt.Sprintf("\"%s\" rock", execPath))
}

func Disable() error {
	key, err := registry.OpenKey(registry.CURRENT_USER, registryPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()

	return key.DeleteValue(appName)
}
