# ADOORA Legal Services — Coming Soon

A single-page holding site for **ADOORA Legal Services**, built with Next.js (App Router) and
Tailwind CSS, and deployed on Vercel. It announces the upcoming full website while still giving
visitors the essentials: what the firm does, where it operates, and how to reach it.

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
    page.tsx       # the entire single-page site
    globals.css    # brand tokens (@theme) and animations
    icon.svg       # favicon
  lib/
    content.ts     # all copy: firm details, practice areas, offices, values
```

Editing the copy is a `src/lib/content.ts` change — the phone number, office addresses,
practice areas and stats all live there.

## Brand

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#0d0f12` | page background |
| `--color-ink-soft` | `#14171c` | alternating section background |
| `--color-ink-line` | `#23272f` | borders and dividers |
| `--color-gold` | `#f5b800` | primary accent |
| `--color-gold-deep` | `#e6a600` | accent hover |

## Deploying to Vercel

1. Push this branch to GitHub.
2. In Vercel, **Add New → Project** and import `satyaprakashdhfm/Adoora_Legal_Services`.
3. Vercel auto-detects Next.js — framework preset **Next.js**, build `npm run build`, no
   environment variables are required.
4. Deploy. Every push to the connected branch triggers a new deployment; other branches get
   preview URLs.

Or from the CLI:

```bash
npx vercel        # preview deployment
npx vercel --prod # production deployment
```
