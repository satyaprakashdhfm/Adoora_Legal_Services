# Architecture and roadmap

How the pieces fit today, and where the admin portal, client portal and
document/RAG features attach when we build them.

## Today

```
                         ┌──────────────────────┐
   browser ────────────► │  adoora-web          │  Next.js 16, App Router
                         │  (Railway service)   │  static-first, 40 pages
                         └──────────┬───────────┘
                                    │ fetch (CORS-allowlisted)
                                    ▼
                         ┌──────────────────────┐
                         │  adoora-api          │  Express 5 + Prisma 7
                         │  (Railway service)   │  forms, auth, admin API
                         └──────────┬───────────┘
                                    │ postgres.railway.internal
                                    ▼
                         ┌──────────────────────┐
                         │  Postgres            │  Railway managed, volume-backed
                         └──────────────────────┘
```

Two independent Node apps in one repository. There is no npm workspace linking
them: each has its own `package.json` and lockfile, and each Railway service
sets its own root directory. That keeps Railway's builder simple and means a
change to one app cannot break the other's install.

### Why the site is static

Every public page is prerendered at build time. Practice areas, domains and
insights come from typed data in `apps/web/src/content`, not from the API, so:

- the site stays up if the API is down;
- pages are fast without caching infrastructure;
- content is version-controlled and reviewable in a pull request.

The API is only called for form submissions. That is a deliberate trade: the
firm gives up instant content edits until the CMS lands, and gets a site that
cannot fail on a database blip.

## Data flow for a form submission

1. Browser posts JSON to `POST /api/enquiries`.
2. CORS check against `CORS_ORIGINS`, then the per-IP rate limit.
3. Zod validates and rejects the honeypot field.
4. Row written with the DPDP consent flag and timestamp.
5. Response carries a quotable reference (`ENQ-2A4F19`). Enquiry content is
   never logged.

## Roadmap

The order below is chosen so each phase is independently useful and none of it
requires reworking what came before.

### Phase 1 — Content management (next)

Replaces the file-based content with the database, so the firm can publish
without a deploy.

- The `Article` model already mirrors `insights.ts`, including the `body` block
  array. Migrating means seeding from the file and switching the page's data
  source.
- Add `PracticeArea` and `Industry` models with the same shape as
  `practice-areas.ts` and `industries.ts`.
- Keep pages statically generated and revalidate on publish (Next's
  `revalidatePath` via a webhook from the API), rather than moving to
  request-time rendering. The site should stay static.
- Admin UI: a route group in `apps/web` (`/(admin)`) behind the existing bearer
  auth, or a separate service if the firm wants it on its own domain.

### Phase 2 — Admin portal

- Enquiry pipeline: assignment, status transitions, internal notes. The status
  enum and `AuditLog` are already in place.
- Conflicts-check workflow — the step that currently happens by email and is
  the one with real professional-conduct consequences.
- Careers pipeline and subscriber management.
- User management for `OWNER`; the role gates already exist.
- Add refresh tokens and a revocation list. Today's tokens are stateless and
  8-hour, which means a compromised token cannot be withdrawn early — fine for
  a small internal API, not fine once the portal holds matter data.

### Phase 3 — Client portal and documents

New models, roughly:

```
Client   ── organisation or individual, created only after conflicts clearance
Matter   ── belongs to a Client, has assigned Users, a status and a practice area
Document ── belongs to a Matter; metadata in Postgres, bytes in object storage
Version  ── one row per document revision, so nothing is overwritten in place
Access   ── which client contacts may see which Matter
```

Decisions to make before writing code:

- **Storage.** Document bytes do not belong in Postgres. Railway offers volume
  storage; S3-compatible object storage with server-side encryption is the
  better fit for privileged material, and gives lifecycle rules for retention.
- **Authentication is a different problem from staff auth.** Client users need
  invitation flows, MFA, and per-matter authorisation. Do not extend the `User`
  model to cover them — a bug that conflates the two exposes matter data across
  clients. Separate table, separate token audience.
- **Every read is auditable.** For privileged documents, who opened what and
  when has to be reconstructable. `AuditLog` is already append-only; documents
  should write to it on read, not only on write.
- **Retention.** Professional record-keeping obligations set a floor, the DPDP
  Act sets expectations on erasure. Both need to be encoded as policy on the
  `Matter`, not decided per document.

### Phase 4 — RAG and assistants

Only worth building on top of Phase 3, because the value is in answering
questions over the firm's own documents.

- `pgvector` on the existing Postgres avoids adding a second datastore. Chunk
  and embed documents on upload; store chunks with the `Matter` id.
- **Authorisation must be applied at retrieval, not after generation.** Filter
  candidate chunks by the caller's matter access before they reach the model.
  Filtering the answer afterwards is not a control.
- Keep a citation for every generated claim, back to document and version. An
  assistant that cannot show its source is not usable for legal work.
- Client-facing chat is a later step than internal chat, and needs an explicit
  disclaimer that it is not legal advice — the same BCI reasoning that drives
  the disclaimer gate applies with more force to generated text.

## Environment variables

### `adoora-api`

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Set as a reference: `${{Postgres.DATABASE_URL}}` |
| `CORS_ORIGINS` | yes | Comma-separated. Must include the web service's public URL. |
| `JWT_SECRET` | yes in production | 32+ chars. `openssl rand -base64 48` |
| `NOTIFY_EMAIL` | no | Enquiry notifications, once mail is wired up. |
| `PORT` | no | Railway injects it. |
| `NODE_ENV` | yes | `production` |
| `LOG_LEVEL` | no | Defaults to `info`. |

### `adoora-web`

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical origin. Wrong value breaks canonicals and the sitemap. |
| `NEXT_PUBLIC_API_URL` | yes | The API service's public URL. |

`NEXT_PUBLIC_*` values are inlined at build time, so changing one requires a
redeploy, not a restart.

## Known gaps

Carried deliberately, listed so they are not forgotten:

- **Lawyer profiles are placeholders.** `apps/web/src/content/people.ts` has
  invented names and experience. Bar enrolment numbers are `null` rather than
  fabricated, and the UI omits the enrolment line when they are. Not
  publishable until the firm supplies real profiles.
- **Office addresses are illustrative.** Same file family — `firm.ts`.
- **No enquiry notification email.** Enquiries land in Postgres and are read
  from there until a mail provider is configured.
- **No CV upload.** The careers form asks candidates to email the CV instead.
  Accepting uploads needs virus scanning and a retention policy first.
- **No analytics provider.** The cookie banner's analytics category exists and
  is honoured; nothing is wired to it yet.
- **Media & mentions section not built.** The home page has no YouTube/podcast
  block because there are no real URLs to embed yet.
