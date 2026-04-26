# RockOrBust

**Stealth proxy network for Playwright. Patch browser fingerprints, rotate residential IPs, and bypass TLS detection without touching your existing automation code.**

[![License](https://img.shields.io/badge/License-MIT-white.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/badge/npm-coming%20soon-white)](https://www.npmjs.com/package/@rockorbust/playwright-plugin)
[![Go](https://img.shields.io/badge/Go-1.21-white.svg)](https://golang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-white.svg)](CONTRIBUTING.md)

---

## Overview

Playwright automation is detectable by default. Anti-bot systems like Cloudflare, DataDome, and Akamai identify automated browsers through three vectors: browser fingerprints exposed via JavaScript properties, TLS handshake signatures unique to Chromium, and datacenter IP reputation.

Existing solutions such as `playwright-extra` and `puppeteer-extra-plugin-stealth` address browser fingerprinting only, and have not been actively maintained since 2023. None of them solve TLS-level detection or provide integrated residential IP routing.

RockOrBust solves all three layers in a single drop-in package, built around a key-isolated residential proxy network that you control.

---

## How It Works

```
Your Playwright Script
        │
        ▼
@rockorbust/playwright-plugin
  ├── Patches browser fingerprints via addInitScript
  └── Routes requests through your key-isolated gateway
        │
        ▼
RockOrBust Gateway (self-hosted)
  ├── Validates your key
  ├── Selects fastest available node from your pool
  └── Forwards request through that node's residential IP
        │
        ▼
rockorbust CLI (running on contributor devices)
  └── Makes the actual request using its local residential IP
        │
        ▼
Target Website
  └── Sees a real residential IP. Thinks it's a human.
```

---

## What Gets Bypassed

| Detection Layer | Method | Status |
|---|---|---|
| Browser Fingerprinting | `navigator.webdriver`, plugins, canvas, WebGL, screen spoofing via `addInitScript` | Handled |
| TLS Fingerprinting | JA3 signature obfuscation via residential proxy re-handshake | Handled |
| IP Reputation | Key-isolated residential IP rotation through contributor node pool | Handled |

---

## Packages

This is a monorepo containing three packages:

| Package | Language | Description |
|---|---|---|
| `packages/playwright-plugin` | TypeScript | Drop-in NPM package for Playwright |
| `apps/gateway` | TypeScript / Node.js | Central routing server, self-hosted on your VPS |
| `apps/cli` | Go | Cross-platform daemon for contributing your IP as a node |

---

## Quick Start

### 1. Install the Playwright plugin

```bash
npm install @rockorbust/playwright-plugin
```

### 2. Two-line integration

```typescript
// Before
import { chromium } from 'playwright'

// After
import { chromium } from '@rockorbust/playwright-plugin'
```

```typescript
const browser = await chromium.launch({
  rockorbust: {
    key: 'rob_your_key_here'
  }
})

// Everything else in your codebase stays exactly the same
const page = await browser.newPage()
await page.goto('https://example.com')
```

### 3. Get a key

Run the gateway locally or point to your hosted instance, then register:

```bash
curl -X POST https://your-gateway.com/register
# Returns: { "key": "rob_a3f8b2c9d4e1f6a7..." }
```

---

## Contributing a Node

Anyone can contribute their device's residential IP to a key-isolated pool. This is transparent — your device only routes traffic for keys you have authorized.

### Install the CLI

**macOS / Linux**
```bash
curl -sSL https://rockorbust.dev/install.sh | sh
```

**Windows**
```powershell
irm https://rockorbust.dev/install.ps1 | iex
```

**Go install**
```bash
go install github.com/pratikpatwe/RockOrBust/apps/cli@latest
```

### CLI Commands

```bash
# Save your key (run once)
rockorbust key set rob_your_key_here

# Start the node daemon (runs in background)
rockorbust start

# Check node status
rockorbust status

# Stop the node daemon
rockorbust stop
```

Your normal internet is unaffected. The daemon only routes traffic authorized by your specific key.

---

## Self-Hosting the Gateway

The gateway is the central server that connects your Playwright plugin to your node pool. You host it on your own VPS.

```bash
git clone https://github.com/pratikpatwe/RockOrBust
cd RockOrBust/apps/gateway
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run start
```

**Environment variables** (see `.env.example`):

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GATEWAY_PORT=8080
```

> [!NOTE]
> The `SUPABASE_SERVICE_ROLE_KEY` is required because the gateway needs to bypass Row Level Security (RLS) to manage keys and nodes directly across different users.

---

## Repository Structure

```
RockOrBust/
├── packages/
│   └── playwright-plugin/     # @rockorbust/playwright-plugin (TypeScript, NPM)
├── apps/
│   ├── gateway/               # Gateway server (TypeScript, Node.js, Supabase)
│   └── cli/                   # Node daemon (Go, cross-platform)
├── docs/                      # Documentation
└── README.md
```

---

## Key System

Keys are generated server-side using cryptographically random bytes. Users never choose their own keys. Each key defines an isolated network:

- Playwright plugin with key `X` only routes through nodes registered with key `X`
- No cross-key traffic is possible
- Keys can be revoked at any time via the gateway

This means you can share a key with your team and build a private residential proxy pool that only your automation uses.

---

## Roadmap

- [x] Playwright plugin with fingerprint patching
- [x] Go CLI node daemon (macOS, Linux, Windows)
- [x] Key-isolated gateway with Supabase
- [ ] Node health scoring and automatic rotation
- [ ] Android node client
- [ ] Python SDK (`pip install rockorbust`)
- [ ] Web dashboard for key and node management

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

```bash
git clone https://github.com/pratikpatwe/RockOrBust
cd RockOrBust
pnpm install
```

Run the plugin in development:
```bash
cd packages/playwright-plugin
pnpm dev
```

Run the gateway in development:
```bash
cd apps/gateway
cp .env.example .env
pnpm dev
```

---

## Why "Rock or Bust"

Named after the AC/DC album. You either break through or you don't. There is no middle ground in bot detection.

---

## License

MIT © [BuildShot](https://buildshot.xyz)