# RockOrBust Gateway

The Gateway is the orchestration engine of the RockOrBust network. It handles edge authentication, node telemetry, and secure traffic tunneling.

## Core Responsibilities

- **Signaling Orchestration**: Coordinates WebRTC SDP offer/answer exchanges between SDK clients and CLI nodes.
- **Node Registry**: Manages a real-time pool of active residential nodes.
- **Bucketed Routing**: Implements an O(1) selection algorithm to prioritize low-latency nodes (<250ms).
- **Authentication**: Validates request keys against a Supabase backend.
- **WebSocket Tunneling**: Multiplexes legacy HTTP(S) proxy traffic and serves as a TURN-equivalent fallback for failed P2P connections.
- **Version Management**: Automated GitHub release tracking to serve the latest CLI binaries to the node network.
- **Security**: Implements IP-based rate limiting for key generation and edge protection for the residential pool.

## API & Interface Reference

| Endpoint | Method | Protocol | Description |
| :--- | :--- | :--- | :--- |
| `/`              | `GET`  | HTTP | Premium landing page and status dashboard. |
| `/auth/register` | `POST` | HTTP | Generates a new unique `rob_` key (Rate limited: 1/hr). |
| `/api/stats`    | `GET`  | HTTP | Returns global network health and total active nodes. |
| `/api/stats/:keyId` | `GET` | HTTP | Returns active node count for a specific key. |
| `/api/signal/:keyId`| `POST` | HTTP | Initiates WebRTC signaling between SDK and a residential node. |
| `/api/cli/latest`| `GET`  | HTTP | Returns the latest CLI version and OS-specific download URL. |
| `/health`        | `GET`  | HTTP | Lightweight JSON status for automated monitoring. |
| `/ws` | `Upgrade` | WebSocket | Primary tunnel and control plane entry for Residential CLI nodes. |
| `*` (Root) | `CONNECT` | Proxy | Legacy fallback HTTP Proxy entry point. |

## Deployment

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL (via Supabase)

### Environment Variables
Required configuration in `.env`:

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TURN_SECRET=your-coturn-static-auth-secret
TURN_HOST=robapi.buildshot.xyz
```

### Installation & Build
```bash
npm install
npm run build
npm start
```

## API Reference

### POST `/auth/register`
Generates a new unique `rob_` access key.
- **Rate Limit**: 1 request per hour per IP.
- **Response**: `{ "key": "rob_..." }`

### POST `/api/signal/:keyId`
Orchestrates a WebRTC P2P connection between an SDK client and a residential node.
- **Payload**: `{ "sdp": "...", "candidates": ["..."] }`
- **Response**: Returns the node's SDP answer, ICE candidates, and Gateway-provided STUN/TURN server configuration.
- **Timeout**: Gracefully fails with 504 if the node does not respond within 10 seconds.

### WebSocket `/ws`
Internal endpoint for Residential CLI nodes to establish a persistent control plane and fallback data tunnel. Requires a valid `rob_` key in the connection headers.

## Self-Hosting & VPS Configuration

When hosting the Gateway on a private VPS, specialized networking configuration is required to support secure proxy tunneling (HTTPS over HTTP).

### 1. Network Requirements
The Gateway multiplexes standard HTTP API calls and raw TCP proxy traffic. Your environment must support:
- **Port Exposure**: The `PORT` defined in your `.env` (default: `8080`) must be open for both ingress and egress.
- **Protocol Support**: If using a reverse proxy (Nginx, HAProxy, Traefik), you **must** use a Layer 4 (Stream/TCP) configuration for the proxy port.

### 2. Reverse Proxy Configuration (L4/TCP Passthrough)
Standard Layer 7 (HTTP) load balancers will reject the `CONNECT` method used by Playwright. To ensure stability, configure your reverse proxy to pass raw TCP traffic directly to the Gateway.

**Example: Nginx (Stream Module)**
```nginx
stream {
    server {
        listen 8080;
        proxy_pass gateway_backend:8080;
    }
}
```

---

## P2P Infrastructure: Self-Hosting a TURN Relay (coturn)

For high-performance P2P routing (Mesh-Flow), a TURN relay is essential to facilitate connections between nodes behind symmetric NATs or restrictive firewalls. 

### 1. Firewall Configuration
Ensure the following ports are open on your host firewall:
- **Port 3478 (TCP/UDP)**: Primary STUN/TURN signaling.
- **Ports 49152–65535 (UDP)**: Relay data range (RFC 5766).

### 2. Deployment via Docker
Deploy the official `coturn` image using the following production-grade configuration. It is recommended to use `network_mode: host` to avoid the overhead of Docker's user-land proxy for the large UDP port range.

**docker-compose.yaml**
```yaml
services:
  coturn:
    image: coturn/coturn:latest
    container_name: coturn
    network_mode: host
    restart: unless-stopped
    command:
      - turnserver
      - -n
      - --log-file=stdout
      - --lt-cred-mech
      - --fingerprint
      - --no-multicast-peers
      - --no-loopback-peers
      - --static-auth-secret=${TURN_SECRET}
      - --realm=coturn.yourdomain.com
      - --external-ip=$$(curl -s https://api.ipify.org)
```

### 3. Gateway Integration
Once the TURN server is live, link it to the RockOrBust Gateway by updating your `.env`:
```env
TURN_SECRET=your_static_auth_secret
TURN_HOST=coturn.yourdomain.com
```

### 4. DNS Requirements
Create an `A Record` for your TURN subdomain (e.g., `coturn.yourdomain.com`) pointing to your server's public IP. 
> [!IMPORTANT]
> If using Cloudflare, you **must** disable the proxy (Grey Cloud) for this record. TURN/STUN traffic is not compatible with Layer 7 HTTP proxies.

### 3. Protocol Selection
- **API (Port 443/80)**: Use standard HTTPS for key generation and status checks.
- **Proxy (Port 8080)**: Use raw `http://` (unencrypted) for the proxy server address. Encryption is handled at the tunnel level.

---

## Public API

### Network Telemetry

**`GET /api/stats/`**

Returns real-time global metrics for the entire RockOrBust network.

- **Architecture**: Powered by an O(1) atomic in-memory counter for zero-latency retrieval.
- **Caching**: Includes `Cache-Control` headers (5s TTL) for edge-side performance.
- **Rate Limit**: 10 requests per minute per IP.

**Response:**
```json
{
  "totalActiveNodes": 2847,
  "status": "operational",
  "timestamp": 1714650000
}
```

**`GET /api/stats/:keyId`**

Returns the real-time status and active node count for a specific ROB key.

**Path Parameters:**
- `keyId`: Your unique RockOrBust key (e.g., `rob_ae1...`).

**Response:**
```json
{
  "activeNodes": 1,
  "status": "online"
}
```

---

## Configuration
- **`PORT`**: The port the gateway will listen on (default: `8080`).
- **`SUPABASE_URL`**: Your Supabase project URL.
- **`SUPABASE_SERVICE_ROLE_KEY`**: Your Supabase service role key.

---

## License

MIT © [BuildShot](https://buildshot.xyz)
