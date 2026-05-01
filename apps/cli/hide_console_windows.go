//go:build windows

package main

import "syscall"

// hideConsole detaches the process from the console window that Windows
// automatically creates when launching a console-subsystem binary from the
// Registry or Task Scheduler. Without this call, a black CMD window would
// appear on the desktop every time the node starts at boot.
func hideConsole() {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	freeConsole := kernel32.NewProc("FreeConsole")
	freeConsole.Call()
}
