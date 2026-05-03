# RockOrBust Residential CLI

The RockOrBust CLI is a lightweight, cross-platform utility that connects your local residential network to the RockOrBust proxy pool.

## Features

- **Efficiency**: Written in Go for minimal resource consumption.
- **Portability**: Compiled as a standalone binary with no external dependencies.
- **Automated Setup**: On-demand key generation with no account registration required.
- **P2P Mesh Flow**: Leverages WebRTC DataChannels (`pion/webrtc`) for direct, high-performance P2P routing to offload the Gateway.
- **Telemetry**: Built-in latency reporting and signaling via WebSocket.

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

### 2. View Active Key
To display the key currently in use:
```bash
rockorbust key show
```

### 3. Manual Key Configuration
If you have been provided a key by an administrator:
```bash
rockorbust key set rob_your_key_here
```

## Management

### Start Node (Rock)
Starts the residential proxy daemon in the background:
```bash
rockorbust rock
```

### Check Status
Verify connection health and view the active PID:
```bash
rockorbust status
```

### Stop Node (Bust)
Gracefully disconnect and stop the background daemon:
```bash
rockorbust bust
```

## Troubleshooting

### Unauthorized Errors
If the CLI reports an "Unauthorized" status, ensure that:
1.  Your key is valid and has not been revoked.
2.  Your network allows outgoing WebSocket connections (Port 443).
3.  The Gateway URL is reachable from your environment.

### WebRTC / P2P Connectivity
The CLI relies on WebRTC DataChannels for direct proxy routing.
- **Direct Connectivity (STUN)**: The CLI uses public Google STUN servers by default to discover its public IP and attempt UDP hole-punching.
- **Relay Fallback (TURN)**: If deployed behind a restrictive firewall or symmetric NAT, the node will seamlessly fall back to using the central Gateway's TURN relay or WebSocket tunnel.
- **Firewall Requirements**: For the best performance (direct P2P), ensure your network allows outgoing UDP traffic on ports `19302` (STUN) and `3478` (TURN).

---

MIT © [BuildShot](https://buildshot.xyz)
