package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

// Config holds the persisted node configuration.
type Config struct {
	Key        string `json:"key"`
	GatewayURL string `json:"gateway_url"`
}

const (
	configDirName  = "rockorbust"
	configFileName = "config.json"
	defaultGateway = "wss://robapi.buildshot.xyz"
)

// configPath returns the OS-appropriate path to config.json.
// Linux/Mac: ~/.config/rockorbust/config.json
// Windows:   %APPDATA%\rockorbust\config.json
func configPath() (string, error) {
	var baseDir string

	if runtime.GOOS == "windows" {
		baseDir = os.Getenv("APPDATA")
		if baseDir == "" {
			return "", fmt.Errorf("%%APPDATA%% is not set")
		}
	} else {
		// Prefer XDG_CONFIG_HOME if set, otherwise default to ~/.config
		xdg := os.Getenv("XDG_CONFIG_HOME")
		if xdg != "" {
			baseDir = xdg
		} else {
			home, err := os.UserHomeDir()
			if err != nil {
				return "", fmt.Errorf("cannot determine home directory: %w", err)
			}
			baseDir = filepath.Join(home, ".config")
		}
	}

	return filepath.Join(baseDir, configDirName, configFileName), nil
}

// Load reads and returns the config from disk.
// Returns a default config if the file does not exist yet.
func Load() (*Config, error) {
	path, err := configPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		// No config yet — return defaults
		return &Config{GatewayURL: defaultGateway}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("config file is malformed: %w", err)
	}

	// Apply defaults for any missing fields
	if cfg.GatewayURL == "" {
		cfg.GatewayURL = defaultGateway
	}

	// Migration: If the user is still pointing to the old localhost default from 
	// previous beta versions, upgrade them to the production gateway automatically.
	if cfg.GatewayURL == "ws://localhost:8080" || cfg.GatewayURL == "http://localhost:8080" {
		cfg.GatewayURL = defaultGateway
		// We don't save here to avoid side effects during load, 
		// but it will be corrected for the current session.
	}

	return &cfg, nil
}

// Save writes the config to disk, creating parent directories if needed.
func Save(cfg *Config) error {
	path, err := configPath()
	if err != nil {
		return err
	}

	// Create the directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to serialize config: %w", err)
	}

	// Write with restricted permissions — this file contains a secret key
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// SetKey loads the current config, sets the key, and saves it back.
func SetKey(key string) error {
	cfg, err := Load()
	if err != nil {
		return err
	}
	cfg.Key = key
	return Save(cfg)
}

// SetGatewayURL loads the current config, sets the gateway URL, and saves it back.
func SetGatewayURL(url string) error {
	cfg, err := Load()
	if err != nil {
		return err
	}
	cfg.GatewayURL = url
	return Save(cfg)
}
