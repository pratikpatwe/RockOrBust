//go:build !windows
// +build !windows

package main

func startedByExplorer() bool {
	return false
}
