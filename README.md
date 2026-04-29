# RockOrBust 🎸

**The ultimate stealth residential proxy network for Playwright.**

RockOrBust is a three-tier infrastructure designed to make web automation indistinguishable from a real human. It combines a private residential node pool with advanced browser fingerprinting and TLS masking.

---

<!-- [VISUAL PLACEHOLDER: PROJECT ARCHITECTURE DIAGRAM] -->
<!-- This is the best place for your high-level system diagram showing the flow between Developer, Gateway, and Node -->

---

## 🏗️ The Three Pillars

The project is divided into three core components:

1.  **[The Gateway (apps/gateway)](./apps/gateway)**: The brain. It manages authentication, node health, and speed-based routing.
2.  **[The Node CLI (apps/cli)](./apps/cli)**: The muscle. A lightweight Go executable that allows anyone to contribute their residential IP to the pool.
3.  **[The Playwright Plugin (packages/playwright-plugin)](./packages/playwright-plugin)**: The interface. A drop-in replacement for Playwright that handles stealth injection and proxy routing.

## 🚀 Key Features

- **Residential IP Rotation**: Route traffic through real home connections, not flagged datacenters.
- **Smart Speed Filtering**: The Gateway automatically picks the fastest available node (latency-based).
- **Stealth Fingerprinting**: Automatically patches `navigator.webdriver`, spoofs `canvas`/`webgl`, and mocks the Chrome environment.
- **TLS Fingerprint Masking**: Prevents JA3 detection by re-handshaking at the Gateway level.
- **VPS Fallback**: Optional toggle to use the Gateway's own IP if your residential pool is offline.

## 🛠️ Quick Start

### 1. Host the Gateway
Deploy the gateway to a VPS or use the hosted version at `https://robapi.buildshot.xyz/`.

### 2. Start a Node
Download the CLI for your OS, set your key, and start contributing:
```bash
rockorbust key set rob_your_key
rockorbust start
```

### 3. Use the Plugin
Install the plugin in your Playwright project:
```bash
npm install @rockorbust/playwright-plugin
```

```typescript
import { chromium } from '@rockorbust/playwright-plugin';

const browser = await chromium.launch({
  rockorbust: { key: process.env.ROB_KEY }
});
```

## 📖 Component Documentation

- **[Gateway Setup & API](./apps/gateway/README.md)**
- **[CLI User Manual](./apps/cli/README.md)**
- **[Playwright Plugin Guide](./packages/playwright-plugin/README.md)**

---

MIT © [BuildShot](https://buildshot.xyz)