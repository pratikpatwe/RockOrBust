# @rockorbust/extra-plugin

A modular plugin for **Puppeteer-Extra** and **Playwright-Extra** that routes your browser traffic through the RockOrBust residential proxy network.

## Features

- **P2P Mesh-Flow Architecture:** Establishes direct WebRTC DataChannel connections to residential nodes for maximum speed and security.
- **Residential IPs:** Harness the power of decentralized residential nodes.
- **Zero Collisions:** Focused exclusively on proxying, making it compatible with other stealth plugins.
- **Unified Support:** One plugin for both Puppeteer and Playwright.
- **Smart Fallback:** Automatically falls back to Gateway WebSocket tunneling if P2P negotiation fails.

## Installation

```bash
npm install @rockorbust/extra-plugin
```

## Usage

### With Playwright-Extra

```javascript
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const rockorbust = require('@rockorbust/extra-plugin')({
  key: 'rob_your_key_here'
});

chromium.use(stealth);
chromium.use(rockorbust);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://api.ipify.org?format=json');
  console.log(await page.content());
  await browser.close();
})();
```

### With Puppeteer-Extra

```javascript
const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const rockorbust = require('@rockorbust/extra-plugin')({
  key: 'rob_your_key_here'
});

puppeteer.use(stealth);
puppeteer.use(rockorbust);

(async () => {
  const browser = await puppeteer.launch();
  // ... your logic
  await browser.close();
})();
```

## Configuration

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `key` | `string` | `process.env.ROB_KEY` | Your RockOrBust ROB key (starts with `rob_`). |
| `gatewayUrl` | `string` | `http://robapi.buildshot.xyz:8080` | The RockOrBust Gateway URL. |
| `fallbackToLocal` | `boolean` | `false` | If true, bypasses proxy and uses local machine IP if no nodes are online. |

## License

MIT
