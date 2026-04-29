# RockOrBust CLI 🚀

The RockOrBust CLI is a lightweight, cross-platform tool that allows you to contribute your residential IP to your private proxy pool.

## Features

- **Low Footprint**: Written in Go, uses minimal CPU and RAM.
- **Easy Setup**: Single binary, no dependencies required.
- **Speed Reporting**: Automatically measures and reports local latency to the Gateway for optimal routing.
- **Background Mode**: Runs as a background daemon.

## Installation

Download the binary for your operating system from the [Releases](https://github.com/pratikpatwe/RockOrBust/releases) page.

### Linux / macOS
```bash
chmod +x rockorbust
sudo mv rockorbust /usr/local/bin/
```

### Windows
Just download `rockorbust.exe` and add it to your PATH.

## Usage

### 1. Set your API Key
Link your device to your RockOrBust pool:
```bash
rockorbust key set rob_your_private_key
```

### 2. Start the Node
Start contributing your residential connection:
```bash
rockorbust start
```

### 3. Check Status
See if your node is online and view your current speed score:
```bash
rockorbust status
```

### 4. Stop the Node
```bash
rockorbust stop
```

## Security & Troubleshooting
### Unauthorized Errors
If you see an "Unauthorized" or "Invalid Key" error in your logs, check the following:
- Ensure the key starts with `rob_`.
- Verify the key is active in your dashboard.
- Check that your firewall isn't blocking outgoing WebSocket connections.

### Privacy
- **Encryption**: All communication with the Gateway is handled via secure WebSockets.
- **Isolation**: Your node only accepts traffic directed to your specific API Key.
- **Zero-Knowledge**: The Gateway and CLI only see encrypted traffic (for HTTPS requests).

---

MIT © [BuildShot](https://buildshot.xyz)
