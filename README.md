# RockOrBust

**High-performance stealth residential proxy network for Playwright.**

RockOrBust is an industrial-grade infrastructure designed to humanize web automation. By combining a private residential node pool with advanced browser fingerprinting and TLS masking, it allows automated browsers to bypass modern bot detection systems effectively.

---

<!-- [VISUAL PLACEHOLDER: PROJECT ARCHITECTURE DIAGRAM] -->

---

## System Architecture

The project consists of three integrated components:

1.  **[Gateway (apps/gateway)](./apps/gateway)**: A Node.js orchestration layer that manages authentication, node telemetry, and latency-based routing.
2.  **[Residential CLI (apps/cli)](./apps/cli)**: A standalone Go executable used to contribute residential connections to the proxy pool.
3.  **[Playwright Plugin (packages/playwright-plugin)](./packages/playwright-plugin)**: A drop-in Playwright wrapper that automates stealth script injection and proxy configuration.

## Key Capabilities

- **Residential IP Routing**: Seamlessly route traffic through real home connections to avoid datacenter IP reputation flags.
- **Latency-Based Selection**: The Gateway automatically prioritizes nodes with sub-250ms latency for optimal performance.
- **Fingerprint Stealth**: Automatically masks `navigator.webdriver`, spoofs hardware concurrency, and mocks Chromium runtime properties.
- **TLS Fingerprint Masking**: Prevents JA3 detection by re-negotiating TLS handshakes at the Gateway level.
- **Resilient Fallback**: Optional VPS failover ensures connectivity even when the residential pool is undersized.

## Getting Started

### 1. Deploy the Gateway
Host the gateway on a VPS or use the managed instance at `https://robapi.buildshot.xyz/`.

### 2. Configure a Residential Node
No account registration is required. Simply download the CLI and use the following commands:

| Command | Description |
| :--- | :--- |
| `rockorbust key generate` | Securely requests and saves a new unique access key from the gateway. |
| `rockorbust key set <key>` | Manually links your device to an existing `rob_` key. |
| `rockorbust start` | Launches the residential node as a background daemon. |
| `rockorbust status` | Displays the current connection health and process ID. |
| `rockorbust stop` | Gracefully disconnects and terminates the background daemon. |

```bash
# Example: Automatic Setup
rockorbust key generate
rockorbust start
```

### 3. Integrate with Playwright
Install the plugin in your Node.js project:
```bash
npm install @rockorbust/playwright-plugin
```

```typescript
import { chromium } from '@rockorbust/playwright-plugin';

const browser = await chromium.launch({
  rockorbust: { 
    key: process.env.ROB_KEY 
  }
});
```

## Documentation

- **[Gateway Configuration](./apps/gateway/README.md)**
- **[CLI User Guide](./apps/cli/README.md)**
- **[Playwright Plugin Documentation](./packages/playwright-plugin/README.md)**

---

MIT © [BuildShot](https://buildshot.xyz)