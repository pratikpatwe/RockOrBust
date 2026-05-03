package install

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
)

// Install moves the binary to a permanent location and adds it to the PATH
func Install() error {
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	var installDir string
	var binPath string

	switch runtime.GOOS {
	case "windows":
		installDir = filepath.Join(os.Getenv("LOCALAPPDATA"), "Programs", "RockOrBust")
		binPath = filepath.Join(installDir, "rockorbust.exe")
	case "darwin", "linux":
		home, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("failed to get home directory: %w", err)
		}
		installDir = filepath.Join(home, ".local", "bin")
		binPath = filepath.Join(installDir, "rockorbust")
	default:
		return fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}

	// Create directory if it doesn't exist
	if err := os.MkdirAll(installDir, 0755); err != nil {
		return fmt.Errorf("failed to create install directory: %w", err)
	}

	// Copy binary if it's not already there
	if exePath != binPath {
		ui.Info("Installing RockOrBust to: %s", installDir)
		if err := copyFile(exePath, binPath); err != nil {
			return fmt.Errorf("failed to copy binary: %w", err)
		}
		// Make executable on Unix
		if runtime.GOOS != "windows" {
			if err := os.Chmod(binPath, 0755); err != nil {
				return fmt.Errorf("failed to set permissions: %w", err)
			}
		}
	}

	// Add to PATH
	if err := addToPath(installDir); err != nil {
		return fmt.Errorf("failed to add to PATH: %w", err)
	}

	ui.Success("RockOrBust has been installed globally!")
	ui.Info("Please restart your terminal to start using 'rockorbust' from anywhere.")

	return nil
}

func copyFile(src, dst string) error {
	source, err := os.Open(src)
	if err != nil {
		return err
	}
	defer source.Close()

	// If destination exists, try to rename it first to avoid ETXTBSY on Linux
	if _, err := os.Stat(dst); err == nil {
		oldDst := dst + ".old"
		_ = os.Remove(oldDst) // ignore error if doesn't exist
		if err := os.Rename(dst, oldDst); err != nil {
			return fmt.Errorf("failed to rename existing binary: %w", err)
		}
	}

	destination, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destination.Close()

	_, err = io.Copy(destination, source)
	return err
}

func addToPath(dir string) error {
	switch runtime.GOOS {
	case "windows":
		return addToPathWindows(dir)
	case "darwin", "linux":
		return addToPathUnix(dir)
	default:
		return nil
	}
}

func addToPathWindows(dir string) error {
	// Use PowerShell to safely update the User PATH without the 1024 char limit of setx
	// and to ensure we don't add duplicate entries.
	psScript := fmt.Sprintf(`
		$oldPath = [Environment]::GetEnvironmentVariable("Path", "User")
		if ($oldPath -split ';' -notcontains '%s') {
			$newPath = "$oldPath;%s"
			[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
		}
	`, dir, dir)

	cmd := exec.Command("powershell", "-Command", psScript)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to update PATH via PowerShell: %w", err)
	}
	return nil
}

func addToPathUnix(dir string) error {
	home, _ := os.UserHomeDir()
	shellFiles := []string{".zshrc", ".bashrc", ".profile", ".bash_profile"}
	
	exportLine := fmt.Sprintf("export PATH=\"%s:$PATH\"", dir)
	
	updated := false
	for _, file := range shellFiles {
		filePath := filepath.Join(home, file)
		if _, err := os.Stat(filePath); err == nil {
			// Read file content to check for existing entry
			content, err := os.ReadFile(filePath)
			if err != nil {
				continue
			}
			
			if strings.Contains(string(content), dir) {
				ui.Info("RockOrBust already in %s", file)
				updated = true
				continue
			}

			f, err := os.OpenFile(filePath, os.O_APPEND|os.O_WRONLY, 0644)
			if err != nil {
				continue
			}
			if _, err := f.WriteString("\n" + exportLine + "\n"); err == nil {
				ui.Info("Updated %s", file)
				updated = true
			}
			f.Close()
		}
	}

	if !updated {
		return fmt.Errorf("no shell configuration files found to update")
	}
	return nil
}

// IsInstalled checks if the binary is already in the PATH
func IsInstalled() bool {
	_, err := exec.LookPath("rockorbust")
	return err == nil
}
