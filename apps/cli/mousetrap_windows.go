//go:build windows
// +build windows

package main

import "github.com/inconshreveable/mousetrap"

func startedByExplorer() bool {
	return mousetrap.StartedByExplorer()
}
