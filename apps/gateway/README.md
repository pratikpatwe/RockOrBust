# RockOrBust Gateway

The Gateway is the orchestration engine of the RockOrBust network. It handles edge authentication, node telemetry, and secure traffic tunneling.

## Core Responsibilities

- **Node Registry**: Manages a real-time pool of active residential nodes.
- **Bucketed Routing**: Implements an O(1) selection algorithm to prioritize low-latency nodes (<250ms).
- **Authentication**: Validates request keys against a Supabase backend.
- **WebSocket Tunneling**: Multiplexes incoming HTTP(S) proxy traffic over persistent WebSocket connections to residential nodes.
- **Security**: Implements IP-based rate limiting for key generation and edge protection for the residential pool.

## API & Interface Reference

| Endpoint | Method | Protocol | Description |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | HTTP | Generates a new unique `rob_` key (Rate limited: 1/hr). |
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

---

MIT © [BuildShot](https://buildshot.xyz)
