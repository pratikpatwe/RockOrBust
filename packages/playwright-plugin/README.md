# @rockorbust/playwright-plugin

**The transparent stealth layer for all Playwright browsers.**

This package provides a drop-in stealth wrapper for Playwright's `chromium`, `firefox`, and `webkit` objects. It automatically handles residential proxy routing and advanced browser-specific fingerprint spoofing.

## Features

- **Multi-Browser Support**: Drop-in replacement for `chromium`, `firefox`, and `webkit`.
- **Transparent Proxying**: Automatically routes all context traffic through the RockOrBust residential gateway.
- **Advanced Fingerprint Deception**: Deep prototype faking (`PluginArray`, `MimeTypeArray`) to defeat sophisticated `instanceof` detector checks.
- **Native Browser Masking**: Injects standard Windows `User-Agent`/Client Hints, strips `HeadlessChrome` signatures, and removes `webdriver` natively via Chromium C++ flags.
- **Zero Configuration**: Automatically picks up your `ROB_KEY` from environment variables.
- **Drop-in Compatibility**: Works seamlessly with your existing Playwright scripts—no logic changes required.

## Installation

```bash
npm install @rockorbust/playwright-plugin playwright
```

## Usage

### Basic Setup
Simply replace your `playwright` import with `@rockorbust/playwright-plugin`.

```typescript
import { chromium } from '@rockorbust/playwright-plugin';
// Use standard playwright types if needed
import type { Browser, Page } from 'playwright';

async function main() {
  // The plugin automatically injects stealth scripts and proxy settings
  const browser: Browser = await chromium.launch({
    rockorbust: {
      key: 'rob_your_key_here', // Or use process.env.ROB_KEY
      fallbackToVps: true       // Optional: failover to VPS IP if no residential nodes are active
    }
  });

  const context = await browser.newContext();
  const page: Page = await context.newPage();

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
| `stealth` | `boolean` | Enable/disable automatic stealth script injection (defaults to `true`). |

## Why RockOrBust?

Modern anti-bot solutions (Cloudflare, Akamai, Datadome) use a combination of IP reputation and browser fingerprinting to block automation. 

1.  **IP Reputation**: We solve this by routing through real home connections (Residential Nodes) rather than flagged datacenter IPs.
2.  **Fingerprinting**: We solve this by injecting custom stealth scripts before the first line of any page code executes, masking common automation signals.

---

MIT © [BuildShot](https://buildshot.xyz)
