# ADOORA API

Node + Express + Prisma service backing the ADOORA Legal Services website, and
the foundation for the admin and client portals.

Deployed from `dev` at <https://adoora-api-production.up.railway.app>.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | — | Liveness. Does not touch the database. |
| GET | `/health/ready` | — | Readiness. Returns 503 if Postgres is unreachable. |
| POST | `/api/enquiries` | — | Website contact form. Rate limited. |
| POST | `/api/careers` | — | Careers application form. Rate limited. |
| POST | `/api/subscribers` | — | Newsletter sign-up (double opt-in). |
| POST | `/api/admin/auth/login` | — | Staff sign-in, returns a bearer token. |
| GET | `/api/admin/me` | Bearer | Current token claims. |
| GET | `/api/admin/enquiries` | Bearer (OWNER/ADMIN) | Cursor-paginated enquiries. |
| GET | `/api/admin/applications` | Bearer (OWNER/ADMIN) | Cursor-paginated applications. |
| GET | `/api/admin/stats` | Staff (OWNER/ADMIN) | Console counts and upcoming hearings. |
| PATCH | `/api/admin/enquiries/:id` · `/api/admin/applications/:id` | Staff (OWNER/ADMIN) | Status and internal notes. |
| GET POST PATCH | `/api/admin/users` | Staff (OWNER/ADMIN) | Lawyers and staff. Only an OWNER manages owners and admins. |
| GET POST PATCH | `/api/admin/clients` | Staff (OWNER/ADMIN) | Client accounts, with `caseIds` to link cases. Staff emails are left out. Deactivating revokes sessions. |
| GET | `/api/admin/audit` | Staff (OWNER/ADMIN) | Audit log. |
| GET | `/api/auth/google` → `/api/auth/google/callback` | — | Google sign-in (OIDC + PKCE). Sets the session cookie. |
| POST | `/api/auth/password` | — | Staff password sign-in, session cookie. |
| POST | `/api/auth/otp` | — | Client sign-in with mobile OTP: `{ accessToken, next }` from the MSG91 widget, verified with MSG91 server to server. Existing clients only, matched on phone. |
| GET · POST | `/api/auth/me` · `/api/auth/logout` | Session | Current account; sign out. |
| GET POST | `/api/cases` | Session | Cases in the caller's scope; create (clients create INTAKE matters). |
| GET PATCH | `/api/cases/:ref` | Session | Case detail (filtered by role); edit (lawyers on the case, admins). |
| GET | `/api/cases/:cnr` | Staff (not EDITOR), clients | eCourtsIndia record by 16-character CNR, returned as a case-form `draft`. The response is stored. 20/min per account; clients also 15/hour. Audited. |
| POST | `/api/cases/:ref/court-sync` | Session | "Check court status": queue an eCourts re-scrape (`POST /api/partner/case/{cnr}/refresh`), wait ~10 s, then fetch the case and apply it. Same limits. |
| POST | `/api/cases/:ref/court-rebuild` | Case staff | Re-read the latest stored eCourts response (no eCourts call, no credit) and rebuild the hearings and orders from it. |
| POST | `/api/cases/:ref/portal/start` | Session (case) | Opens the court's own website (district or High Court portal) for the CNR and returns its captcha image. Free; 30-minute cooldown after a lookup. |
| POST | `/api/cases/:ref/portal/captcha` | Session (case) | A new captcha image for the same session. |
| POST | `/api/cases/:ref/portal/submit` | Session (case) | The typed captcha: fetches the case page, applies hearings/status, saves each order PDF to Documents → From the court (never twice). |
| GET | `/api/admin/leads` | Admin | Trending judgments of the last 72 hours, urgent first. `PATCH /api/admin/leads/:id` shortlists or rejects; `POST /api/admin/leads/refresh` reads the feeds now. |
| POST | `/api/admin/articles/draft` | Admin | "Write now": `{ topic, leadId? }` → Gemini draft saved In review. `GET /api/admin/pipeline` reports setup and today's runs. |
| POST | `/api/cases/:ref/updates` | Session | Timeline entry. |
| PUT | `/api/cases/:ref/assignments` · `/clients` | Admin | Lawyers on the case; client accounts that can see it. |
| POST | `/api/cases/:ref/documents` | Session | Multipart upload (`file`), encrypted and stored. |
| GET | `/api/documents` · `/api/documents/:ref` | Session | Documents in scope; metadata and versions. |
| POST | `/api/documents/:ref/versions` | Session | New version; nothing is overwritten. |
| GET | `/api/documents/:ref/download` | Session | Decrypted file. Audited. `?version=n`, `?inline=1`. |
| PATCH · DELETE | `/api/documents/:ref` | Staff · Admin | Title, type, visibility; soft delete. |
| GET POST | `/api/queries` | Session | Client queries: clients raise and read their own; admins see all, lawyers those on their cases. |
| PATCH | `/api/queries/:id` | Staff (not EDITOR) | Reply and status. |

"Session" means the `__Host-als_session` cookie, sent by the website through
its `/api` rewrite. Staff endpoints also accept the bearer token from
`/api/admin/auth/login`. What each caller sees is decided in `src/access.ts`.

`/api/cases/:cnr` and `/api/cases/:ref` share a path: a 16-character value
with no hyphens is treated as a CNR and looked up on eCourtsIndia
(`src/integrations/ecourts.ts`); anything else (`ALS-2026-K7Q3X9`) is the
firm's own record. `ECOURTS_API_KEY` is sent only to eCourtsIndia, as a
bearer token — it never reaches the browser or the logs.

What is kept from eCourts (`src/integrations/court-record.ts`):

- `CourtSnapshot`: the response exactly as received. A new row is written
  only when the record has changed (SHA-256 of the payload, ignoring scrape
  timestamps). An unchanged check only moves `Case.courtCheckedAt`.
- `CourtHearing`, `CourtOrder`: the hearing history and orders, upserted so
  re-reading never duplicates them.
- `Case`: the court decides dates, stage, coram and disposal, so those are
  overwritten on every sync. Court name, case number and filing dates are
  filled only when empty. Title, summary, parties and the firm's own
  status/stage are never changed, except that a disposal moves an open case
  to Disposed. Each change a client would care about (new date, new order,
  disposal) goes on the timeline.

A lookup made while filling in a new case is stored unattached, and saving
a case with that CNR within 24 hours adopts it, so eCourts is not billed a
second time.

## Local development

```bash
cp .env.example .env      # then set DATABASE_URL
npm install
npm run migrate           # creates the schema
npm run dev               # http://localhost:4000
```

Create the first staff account:

```bash
SEED_OWNER_EMAIL=you@firm.com SEED_OWNER_PASSWORD='a-long-password' npm run seed
```

## Notes

- Prisma 7 keeps the connection string in `prisma.config.ts`, not in
  `schema.prisma`. The runtime client connects through the `pg` driver adapter
  in `src/db.ts`.
- The generated client is written to `generated/prisma` (outside `src`) so the
  same relative import resolves from both `src` and `dist`.
- `npm start` runs `prisma migrate deploy` first, so a deploy applies pending
  migrations before the server accepts traffic.
- Enquiry content is redacted from logs — see `src/logger.ts`. Enquiries can
  contain information that later becomes privileged.
