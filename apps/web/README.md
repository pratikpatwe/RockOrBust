# RockOrBust Web

**The official landing page and dashboard for the RockOrBust proxy infrastructure.**

This repository contains the frontend application for RockOrBust. It is built with Next.js and styled using Tailwind CSS, featuring a strict brutalist design system characterized by high-contrast monochrome layouts, geometric sharp edges, and a distinct lack of rounded corners or soft shadows.

---

## Technical Stack

- **Framework**: Next.js 16.2.4 (React 19)
- **Styling**: Tailwind CSS v4
- **Icons**: Hugeicons Core Free Icons

---

## Design System

The UI relies heavily on a brutalist aesthetic to convey an industrial, raw, and highly functional feel.

- **Colors**: 
  - Background: Deep Black (`#000000`) and Off-Black (`#050505`, `#0A0A0A`).
  - Accent: High-visibility Yellow (`#FACC15`).
  - Text: Stark White (`#FFFFFF`) and Muted Gray (`#A3A3A3`).
- **Typography**: Space Grotesk for headings and body, Geist Mono for technical data, code blocks, and metrics.
- **Borders**: Sharp `1px` solid or dashed borders (`#333333`) are used extensively to define layout structures and components.

---

## Development

### Prerequisites

Ensure you have Node.js 20+ installed.

### Setup

1. Navigate to the web directory and start the development server:
```bash
npm run dev
```

2. Open `http://localhost:3000` in your browser.

---

## Build and Deployment

To generate a production build:

```bash
npm run build
```

This will produce an optimized Next.js build ready for deployment.

---

## Related Packages

- [RockOrBust Root](../../README.md)
- [Gateway](../gateway/README.md)
- [CLI Node](../cli/README.md)

---

MIT © [BuildShot](https://buildshot.xyz)