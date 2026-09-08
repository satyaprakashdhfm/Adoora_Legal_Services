# ADOORA Legal Services — Coming Soon

**Live:** https://adoora-legal-services.vercel.app

A single-page holding site for **ADOORA Legal Services**, built with Next.js (App Router) and
Tailwind CSS, and deployed on Vercel. It announces the upcoming full website and gives visitors
the two ways to reach the firm.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- `next/font` (Inter) — no external CSS or icon CDNs, everything is self-hosted
- Static by default: the page is a server component with no client-side JavaScript

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

Other scripts:

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint
```

## Project layout

```
src/
  app/
    layout.tsx     # fonts, metadata, <html> shell
    page.tsx       # the single coming-soon section
    globals.css    # brand tokens (@theme) and animations
    icon.svg       # favicon
  lib/
    content.ts     # firm name, tagline, regions, phone and email
```

Copy changes go in `src/lib/content.ts` — the phone number, email address and regions all live
there, so the page itself rarely needs editing.

## Brand

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#0d0f12` | page background |
| `--color-ink-soft` | `#14171c` | raised surfaces |
| `--color-ink-line` | `#23272f` | borders and dividers |
| `--color-gold` | `#f5b800` | primary accent |
| `--color-gold-deep` | `#e6a600` | accent hover |

## Deploying

The Vercel project `adoora-legal-services` is connected to this repository, with `main` as the
production branch. **Pushing to `main` deploys to production automatically** — no manual step is
needed. Pushes to any other branch get their own preview URL.

Vercel auto-detects Next.js (build `npm run build`); no environment variables are required.

To deploy manually from a local checkout if ever needed:

```bash
npx vercel        # preview deployment
npx vercel --prod # production deployment
```
