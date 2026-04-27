//go:build windows

package cmd

import "syscall"

// getSysProcAttr returns Windows-specific process attributes (none required for detachment).
func getSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}
