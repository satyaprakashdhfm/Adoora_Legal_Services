# ADOORA Legal Services

The firm's website and the services behind it.

| App | Stack | Purpose |
| --- | --- | --- |
| [`apps/web`](apps/web) | Next.js 16 (App Router), Tailwind v4 | Public website, client & lawyer dashboard, admin console |
| [`apps/api`](apps/api) | Express 5, Prisma 7, Postgres | Forms, Google sign-in, cases, encrypted documents, admin API |

`docs/ARCHITECTURE.md` covers how they fit together — sign-in, roles, the case
and document model, storage and encryption — plus the roadmap and known gaps.

## Branches

- **`main`** — production, live at <https://www.adooralegalservices.com>.
  Pushing to `main` deploys the website and the API on Railway.
- **`dev`** — staging, with test data and test logins, on Railway:
  - Website: <https://adoora-web-production.up.railway.app>
  - API: <https://adoora-api-production.up.railway.app>

## Getting started

The two apps install separately — there is no workspace linking them.

```bash
# Website
cd apps/web
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000

# API (in a second terminal)
cd apps/api
npm install
cp .env.example .env        # then set DATABASE_URL
npm run migrate             # create the schema
npm run dev                 # http://localhost:4000
```

The website works without the API running — every public page is prerendered.
The forms, `/login`, `/dashboard` and `/admin` need it. The website forwards
`/api/*` to `API_INTERNAL_URL` (default `http://localhost:4000`).

`/login` offers only Google. Without Google credentials locally, sign in with
the seeded owner's password by calling `POST /api/auth/password` (it sets the
session cookie). Documents go to `apps/api/storage/`
(encrypted) with the default `STORAGE_DRIVER=local`.

Create the first staff account for the admin API:

```bash
cd apps/api
SEED_OWNER_EMAIL=you@firm.com SEED_OWNER_PASSWORD='a-long-password' npm run seed
```

## Website structure

| Route | Content |
| --- | --- |
| `/` | Hero, practice areas, domains, insights, recognitions, offices, careers |
| `/services` · `/services/[slug]` | 8 practice areas, each with a tabbed detail page |
| `/domains` · `/domains/[slug]` | 8 industry domains, same tabbed template |
| `/insights` · `/insights/[slug]` | Explainers and regulatory updates |
| `/achievements` | Recognitions by year and awarding body |
| `/about` | Firm story, approach, compliance note, lawyer profiles |
| `/contact` · `/careers` | Intake and application forms |
| `/disclaimer` `/privacy` `/cookies` `/terms` | Policies |
| `/notice` | Shown when a visitor declines the disclaimer |
| `/login` | Sign in — "Continue with Google" only |
| `/dashboard` | Clients: their matters, documents, timeline, new-matter intake. Lawyers: their assigned cases |
| `/admin` | Admin console (owners and admins): cases, documents, clients, lawyers & staff, enquiries, applications, audit log |

"Continue with Google" sits at the top right of every page; once signed in it
becomes the account menu.

Content is typed data in `apps/web/src/content` — practice areas, industries,
insights, people, awards and policies. Editing copy means editing those files,
not the pages. The shapes match the API's `Article` model so the CMS can take
over later without a page rewrite.

## Bar Council of India compliance

Indian advocates may not solicit work or advertise, and the site is built
around that:

- A **disclaimer gate** on first visit. Acceptance is stored in a first-party
  cookie; declining routes to `/notice`, which carries no firm information and
  hides the site navigation.
- **Granular cookie consent** — strictly necessary, analytics, marketing.
  Nothing optional is set without an opt-in, and continued browsing is not
  treated as consent.
- Copy carries **no testimonials, no superlatives and no outcome claims**.
  Matter descriptions omit client names and state that they are not
  representations about outcomes. Awards are listed factually with the year and
  awarding body.
- The footer disclaimer appears on every page, and every article carries a
  not-legal-advice notice.

The gate is a compliance convention, not an access control — the markup behind
it is already in the page. Do not treat it as a security boundary.

## Deploying

### Railway

Project **AdooraLegalServices**, Singapore. Every app service is
Git-connected and redeploys on push to its branch.

| Service | Branch | Root directory | Data | Notes |
| --- | --- | --- | --- | --- |
| `adoora-coming-soon` (production website) | `main` | `apps/web` | | Holds `www.adooralegalservices.com` (port 8080). Never sleeps |
| `adoora-api-prod` | `main` | `apps/api` | `Postgres-CJo6`, bucket `documents-prod` | Google and OTP sign-in only |
| `adoora-web` (staging) | `dev` | `apps/web` | | Test logins shown (`NEXT_PUBLIC_PASSWORD_SIGN_IN`, `NEXT_PUBLIC_SHOW_TEST_LOGINS`) |
| `adoora-api` (staging) | `dev` | `apps/api` | `Postgres`, bucket `documents` | `PASSWORD_SIGN_IN=on`; sample data with `SAMPLE_DATA=add` |

Production leaves `PASSWORD_SIGN_IN`, `SAMPLE_DATA` and the web's
`NEXT_PUBLIC_*_SIGN_IN` / `TEST_LOGINS` switches unset (off).
`BOOTSTRAP_OWNER="email,mobile,name"` keeps one owner able to sign in at
`/admin/login`. Never copy a whole variable list between production and
staging: `DATABASE_URL`, `S3_*`, `APP_URL`, `CORS_ORIGINS`, `JWT_SECRET` and
`DOCUMENT_ENCRYPTION_KEY` differ per service.

Deploy from Git rather
than uploading a directory: a tarball upload is rooted at whatever you upload,
which collides with the service's Root Directory and fails in `railpack
prepare`.

`apps/*/railway.json` carries the build and health-check config. `npm start` on
the API runs `prisma migrate deploy` first, so a deploy applies pending
migrations before serving traffic.

#### If staging deploys `main` after touching the GitHub connection

Re-authorising the Railway GitHub App resets each service's deploy branch to
the repository's **default branch**, `main`. For the staging services, set
Settings → Source → Branch back to `dev`. The running version keeps serving
throughout — Railway does not retire a healthy deploy for a failed build.

Environment variables are listed in `docs/ARCHITECTURE.md`. Set
`DATABASE_URL` on the API as a reference to the Postgres service
(`${{Postgres.DATABASE_URL}}`) rather than pasting the value, so it follows
credential rotation.

## Brand

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#0f141c` | Headings, dark bands |
| `--color-gold` | `#8a6a12` | Accent on light surfaces (contrast-safe) |
| `--color-gold-bright` | `#f5b800` | Accent on dark bands only |
| `--color-paper` | `#ffffff` | Page ground |
| `--color-paper-warm` | `#faf8f4` | Raised surfaces |
| `--color-line` | `#e4dfd4` | Borders and dividers |

Source Serif 4 for display, Inter for body, both self-hosted through
`next/font`. Tokens live in `apps/web/src/app/globals.css`.

## Before go-live

- Replace the placeholder lawyer profiles and Bar enrolment numbers in
  `apps/web/src/content/people.ts`.
- Confirm the office addresses in `apps/web/src/content/firm.ts`.
- Have the firm sign off the policy pages in
  `apps/web/src/content/policies.ts`, and name the analytics provider in the
  cookie policy.
- Configure enquiry notification email (`NOTIFY_EMAIL` plus a mail provider).
- Point `NEXT_PUBLIC_SITE_URL` at the real domain — canonicals and
  `sitemap.xml` are generated from it.
