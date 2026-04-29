# RockOrBust Residential CLI

The RockOrBust CLI is a lightweight, cross-platform utility that connects your local residential network to the RockOrBust proxy pool.

## Features

- **Efficiency**: Written in Go for minimal resource consumption.
- **Portability**: Compiled as a standalone binary with no external dependencies.
- **Automated Setup**: On-demand key generation with no account registration required.
- **Telemetry**: Built-in latency reporting to ensure high-speed routing.

## Installation

Binaries are available for Windows, Linux, and macOS on the [Releases](https://github.com/pratikpatwe/RockOrBust/releases) page.

### Linux / macOS
```bash
chmod +x rockorbust
sudo mv rockorbust /usr/local/bin/
```

## Configuration

### 1. Generate an Access Key
If you do not already have a key, you can generate one securely from the gateway:
```bash
rockorbust key generate
```
This command will request a unique `rob_` key and save it to your local configuration file automatically.

### 2. Manual Key Configuration
If you have been provided a key by an administrator:
```bash
rockorbust key set rob_your_key_here
```

## Management

### Start Node
Starts the residential proxy daemon in the background:
```bash
rockorbust start
```

### Check Status
Verify connection health and view the active PID:
```bash
rockorbust status
```

### Stop Node
Gracefully disconnect and stop the background daemon:
```bash
rockorbust stop
```

## Troubleshooting

### Unauthorized Errors
If the CLI reports an "Unauthorized" status, ensure that:
1.  Your key is valid and has not been revoked.
2.  Your network allows outgoing WebSocket connections (Port 443).
3.  The Gateway URL is reachable from your environment.

---

MIT © [BuildShot](https://buildshot.xyz)
