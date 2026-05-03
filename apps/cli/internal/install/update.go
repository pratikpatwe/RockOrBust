package install

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/pratikpatwe/RockOrBust/cli/internal/ui"
	"github.com/pratikpatwe/RockOrBust/cli/internal/version"
)

// UpdateInfo holds information about the latest available version
type UpdateInfo struct {
	LatestVersion string `json:"version"`
	DownloadURL   string `json:"url"`
}

// CheckForUpdate checks if a new version is available
func CheckForUpdate(gatewayURL string) (*UpdateInfo, error) {
	// Convert ws:// to http:// for the update check
	apiURL := gatewayURL
	if len(apiURL) > 5 && apiURL[:5] == "ws://" {
		apiURL = "http://" + apiURL[5:]
	} else if len(apiURL) > 6 && apiURL[:6] == "wss://" {
		apiURL = "https://" + apiURL[6:]
	}
	
	query := fmt.Sprintf("?os=%s&arch=%s", runtime.GOOS, runtime.GOARCH)
	resp, err := http.Get(apiURL + "/api/cli/latest" + query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status: %d", resp.StatusCode)
	}

	var info UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}

	if info.LatestVersion != version.Version {
		return &info, nil
	}

	return nil, nil
}

// Update downloads and installs the latest version
func Update(downloadURL string) error {
	ui.Info("Downloading update...")

	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("failed to download update: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download: server returned %d", resp.StatusCode)
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}

	// because we cannot overwrite a running executable.
	oldExePath := exePath + ".old"
	_ = os.Remove(oldExePath) // ignore error if doesn't exist

	if err := os.Rename(exePath, oldExePath); err != nil {
		return fmt.Errorf("failed to rename existing binary: %w", err)
	}

	out, err := os.OpenFile(exePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		// Try to recover
		os.Rename(oldExePath, exePath)
		return fmt.Errorf("failed to create new binary: %w", err)
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to save update: %w", err)
	}

	ui.Success("RockOrBust has been updated to the latest version!")
	if runtime.GOOS == "windows" {
		ui.Info("You can now delete the temporary file: %s", filepath.Base(oldExePath))
	}

	return nil
}
