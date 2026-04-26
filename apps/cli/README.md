# RockOrBust CLI

The Go CLI node client for the RockOrBust stealth proxy network.

## Installation

```bash
go build -o rockorbust .
```

## Commands

| Command | Description |
|---|---|
| `rockorbust key set <key>` | Save your `rob_` key to local config |
| `rockorbust start` | Start the node daemon in the background |
| `rockorbust status` | Check if the daemon is running |
| `rockorbust stop` | Stop the running daemon |

## Configuration

Config is stored at:
- **Linux/Mac**: `~/.config/rockorbust/config.json`
- **Windows**: `%APPDATA%\rockorbust\config.json`

## PID File

The daemon PID is stored at:
- **Linux/Mac**: `/tmp/rockorbust.pid`
- **Windows**: `%TEMP%\rockorbust.pid`
