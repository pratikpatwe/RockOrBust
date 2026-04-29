# @rockorbust/playwright-plugin

**Stealth proxy and fingerprint patching for Playwright.**

Automatically route your Playwright traffic through the RockOrBust residential node pool and bypass advanced bot detection with built-in stealth scripts.

## Installation

```bash
npm install @rockorbust/playwright-plugin
```

## Quick Start

The plugin is a drop-in replacement for Playwright's browser objects (`chromium`, `firefox`, `webkit`).

```typescript
import { chromium } from '@rockorbust/playwright-plugin';

(async () => {
  const browser = await chromium.launch({
    rockorbust: {
      key: 'rob_your_key_here',
      fallbackToVps: true // If no residential nodes are available, use the VPS IP
    }
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://example.com');
  await browser.close();
})();
```

## Features

- **Residential IP Rotation**: Every request is routed through a peer-to-peer residential node pool.
- **Fingerprint Patching**: Automatically masks `navigator.webdriver`, spoofs `canvas`/`webgl`, and mocks the Chrome environment.
- **TLS Stealth**: Handled by the RockOrBust Gateway to prevent JA3 fingerprinting.
- **VPS Fallback**: Optional toggle to continue your automation using the gateway's IP if your node pool is offline.

## Configuration Options

Pass the `rockorbust` object to any Playwright launch method.

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | **Required** | Your RockOrBust access key (starts with `rob_`). |
| `gatewayUrl` | `string` | `https://robapi.buildshot.xyz/` | The URL of the RockOrBust gateway. |
| `stealth` | `boolean` | `true` | Whether to inject stealth scripts into every context. |
| `fallbackToVps` | `boolean` | `false` | If `true`, the gateway will use its own IP if no residential nodes are available for your key. |

## How it Works

1. **Proxy Injection**: The plugin configures Playwright's internal proxy settings to point to the RockOrBust Gateway.
2. **Key Isolation**: Your traffic is isolated at the gateway level using your unique key.
3. **Stealth Injection**: On every `newContext()`, the plugin automatically calls `addInitScript` with a robust suite of anti-detection patches.

## Why use this?

Existing solutions like `playwright-extra` are often unmaintained and only handle JavaScript-level detection. RockOrBust handles all three layers: **IP Reputation**, **TLS Fingerprinting**, and **Browser Fingerprinting**.

---

MIT © [BuildShot](https://buildshot.xyz)
