# @rockorbust/playwright-plugin

**The transparent stealth layer for Playwright automation.**

This package provides a drop-in replacement for the Playwright `chromium` object. it automatically handles residential proxy routing, TLS fingerprint masking, and advanced browser fingerprint spoofing.

## Features

- **Transparent Proxying**: Automatically routes all context traffic through the RockOrBust residential gateway.
- **Fingerprint Deception**: Masks `navigator.webdriver`, spoofs `WebGL`/`Canvas` fingerprints, and mocks hardware concurrency.
- **TLS Masking**: Prevents JA3/JA4 detection by offloading TLS handshakes to the gateway.
- **Zero Configuration**: Automatically picks up your `ROB_KEY` from environment variables.

## Installation

```bash
npm install @rockorbust/playwright-plugin playwright
```

## Usage

### Basic Setup
Simply replace your `playwright` import with `@rockorbust/playwright-plugin`.

```typescript
import { chromium } from '@rockorbust/playwright-plugin';

async function main() {
  // The plugin automatically injects stealth scripts and proxy settings
  const browser = await chromium.launch({
    rockorbust: {
      key: 'rob_your_key_here', // Or use process.env.ROB_KEY
      fallbackToVps: true       // Optional: failover to VPS IP if no residential nodes are active
    }
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://bot.sannysoft.com');
  // Observe your residential IP and "Green" stealth results
}

main();
```

## Configuration Options

The `chromium.launch` method accepts a `rockorbust` configuration object:

| Option | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | Your RockOrBust access key (required if `ROB_KEY` env var is missing). |
| `gatewayUrl` | `string` | Custom gateway URL (defaults to `https://robapi.buildshot.xyz`). |
| `fallbackToVps` | `boolean` | If `true`, traffic routes through the Gateway IP if no residential nodes are available. |

## Why RockOrBust?

Modern anti-bot solutions (Cloudflare, Akamai, Datadome) use a combination of IP reputation and browser fingerprinting to block automation. 

1.  **IP Reputation**: We solve this by routing through real home connections (Residential Nodes).
2.  **Fingerprinting**: We solve this by injecting custom stealth scripts before the first line of any page code executes.
3.  **TLS Fingerprinting**: We solve this by ensuring the TLS handshake is performed by a high-level Go/Node client on the Gateway, not the automated browser.

---

MIT © [BuildShot](https://buildshot.xyz)
