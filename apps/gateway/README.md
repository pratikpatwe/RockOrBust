# RockOrBust Gateway 🧠

The Gateway is the central intelligence of the RockOrBust network. It handles node registration, authentication, and intelligent request routing.

## Responsibilities

- **Node Management**: Tracks active residential nodes and their real-time latency.
- **Key Authentication**: Validates requests against a Supabase database.
- **Transparent Proxying**: Handles `HTTP CONNECT` and standard HTTP proxy requests.
- **Speed Routing**: Implements a bucketed selection algorithm to prioritize low-latency nodes (<250ms).
- **Traffic Tunneling**: Routes traffic to nodes via WebSockets to bypass firewalls/NAT.

## Setup & Deployment

### Prerequisites
- Node.js 18+
- Supabase Account (for key management)

### Environment Variables
Create a `.env` file in this directory:

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation
```bash
npm install
npm run build
npm start
```

## Architecture

The gateway uses a "Twin-Tunnel" architecture:
1.  **Incoming**: Receives standard Proxy requests from the Playwright Plugin.
2.  **Outgoing**: Forwards data to the target Node over a persistent WebSocket connection.

---

MIT © [BuildShot](https://buildshot.xyz)
