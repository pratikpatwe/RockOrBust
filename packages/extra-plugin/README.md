# @rockorbust/extra-plugin

A modular plugin for **Puppeteer-Extra** and **Playwright-Extra** that routes your browser traffic through the RockOrBust residential proxy network.

## Features

- **Seamless Proxying:** Automatically configures the browser to use the RockOrBust Gateway.
- **Residential IPs:** Harness the power of decentralized residential nodes.
- **Zero Collisions:** Focused exclusively on proxying, making it compatible with other stealth plugins.
- **Unified Support:** One plugin for both Puppeteer and Playwright.

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
  key: 'rob_your_key_here',
  fallbackToVps: true // Fallback to VPS IP if no residential nodes are available
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
| `fallbackToVps` | `boolean` | `false` | If true, falls back to the VPS IP if no residential nodes are online. |

## License

MIT
