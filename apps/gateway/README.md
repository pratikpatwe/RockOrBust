# RockOrBust Gateway

The Gateway is the orchestration engine of the RockOrBust network. It handles edge authentication, node telemetry, and secure traffic tunneling.

## Core Responsibilities

- **Node Registry**: Manages a real-time pool of active residential nodes.
- **Bucketed Routing**: Implements an O(1) selection algorithm to prioritize low-latency nodes (<250ms).
- **Authentication**: Validates request keys against a Supabase backend.
- **WebSocket Tunneling**: Multiplexes incoming HTTP(S) proxy traffic over persistent WebSocket connections to residential nodes.
- **Version Management**: Automated GitHub release tracking to serve the latest CLI binaries to the node network.
- **Security**: Implements IP-based rate limiting for key generation and edge protection for the residential pool.

## API & Interface Reference

| Endpoint | Method | Protocol | Description |
| :--- | :--- | :--- | :--- |
| `/`              | `GET`  | HTTP | Premium landing page and status dashboard. |
| `/auth/register` | `POST` | HTTP | Generates a new unique `rob_` key (Rate limited: 1/hr). |
| `/api/stats`    | `GET`  | HTTP | Returns global network health and total active nodes. |
| `/api/stats/:keyId` | `GET` | HTTP | Returns active node count for a specific key. |
| `/api/cli/latest`| `GET`  | HTTP | Returns the latest CLI version and OS-specific download URL. |
| `/health`        | `GET`  | HTTP | Lightweight JSON status for automated monitoring. |
| `/ws` | `Upgrade` | WebSocket | Primary tunnel entry for Residential CLI nodes. |
| `*` (Root) | `CONNECT` | Proxy | Standard HTTP Proxy entry point for Playwright traffic. |

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

### WebSocket `/ws`
Internal endpoint for Residential CLI nodes to establish a persistent tunnel. Requires a valid `rob_` key in the connection headers.

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
