//go:build windows

package cmd

import "syscall"

// getSysProcAttr returns Windows-specific process attributes to detach and hide the window.
func getSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{
		CreationFlags: 0x08000000 | 0x00000008, // 0x08000000 is CREATE_NO_WINDOW, 0x00000008 is DETACHED_PROCESS
	}
}
