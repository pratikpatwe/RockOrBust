//go:build !windows

package cmd

import "syscall"

// getSysProcAttr returns Unix-specific process attributes to detach from the terminal.
func getSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{
		Setsid: true,
	}
}
