# Architecture and roadmap

How the pieces fit: the public site, the client and lawyer dashboards, the
admin console, and where content management and document/RAG features attach
next.

## Today

```
                         ┌──────────────────────┐
   browser ────────────► │  adoora-web          │  Next.js 16, App Router
                         │  (Railway service)   │  public pages static; /login,
                         │                      │  /dashboard, /admin client-rendered
                         └──────────┬───────────┘
                                    │ /api/* rewrite (same origin to the browser)
                                    │ adoora-api.railway.internal
                                    ▼
                         ┌──────────────────────┐        ┌──────────────────────┐
                         │  adoora-api          │ ─────► │  Google OAuth        │
                         │  (Railway service)   │        │  (OpenID Connect)    │
                         │  Express 5 + Prisma 7│        └──────────────────────┘
                         └───┬──────────────┬───┘
       postgres.railway.internal            │ S3 API (ciphertext only)
                             ▼              ▼
                ┌──────────────────┐  ┌──────────────────────┐
                │  Postgres        │  │  Railway Bucket      │
                │  records, keys,  │  │  document objects    │
                │  sessions, audit │  │  (any S3-compatible) │
                └──────────────────┘  └──────────────────────┘
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

The dashboards are the exception, and are client-rendered shells that fetch
from the API: they have nothing worth prerendering, and they must never be
cached.

### Why the browser talks to the API through the website

`apps/web/next.config.ts` rewrites `/api/*` to the API service. To the browser
the API is the website's own origin, so:

- the session cookie is **first-party** (`__Host-als_session`, httpOnly,
  Secure, SameSite=Lax). The two services sit on different `up.railway.app`
  hosts, which is on the public-suffix list — a cookie set by the API's own
  hostname would be third-party to the website and blocked by Safari and
  increasingly by Chrome;
- Google's redirect URI is on the website's domain, which is the one users see;
- no CORS configuration is needed for the dashboards.

Next buffers proxied request bodies and truncates them at 10 MB by default.
`experimental.proxyClientMaxBodySize` is raised to 30 MB, just above the API's
own 25 MB upload limit, so an oversized file is refused by the API with a
message rather than arriving truncated. The public forms still post to
`NEXT_PUBLIC_API_URL` directly; either path reaches the same API.

## Accounts and sign-in

**Staff and clients are separate tables** (`User` and `Client`), as this
document always said they should be: a bug in one audience's checks cannot
hand the other audience's access to a client's matters.

One "Continue with Google" button serves both. On the callback the API decides
which account the Google identity is (`apps/api/src/routes/auth.ts`):

1. an existing staff account with that Google id or email → staff session;
2. an email in `ADMIN_EMAILS` → a new `OWNER` (bootstraps the first admin);
3. an existing client account → client session;
4. anyone else → a new client account, if `ALLOW_CLIENT_SIGNUP` is true.

Staff are never created by signing in (apart from the bootstrap): an admin adds
a lawyer by email under **Lawyers & staff**, and the lawyer's first Google
sign-in with that email links the account. A stranger who signs in gets a
client account that sees nothing until the firm links a case to it.

The flow is OpenID Connect authorization code with PKCE, `state` and `nonce`;
the ID token is verified against Google's published keys, audience and issuer,
and the email must be verified by Google. The client secret stays on the API.

**Sessions are rows, not tokens** (`Session`). Only a SHA-256 of the cookie
value is stored. Deactivating an account revokes its sessions immediately —
this closes the "stateless 8-hour token cannot be withdrawn" gap noted in the
previous roadmap. Staff sessions last 12 hours, client sessions 7 days.
Cookie-authenticated writes must also carry an `Origin` matching the website.

The original password login (`POST /api/admin/auth/login`, bearer token) still
works for scripts, and now checks the account is still active on every call.
`POST /api/auth/password` gives staff with a password a session cookie too —
an emergency route if Google is ever unavailable. `/login` does not offer it;
the page shows only "Continue with Google".

### Roles

| Who | Sees | Can |
| --- | --- | --- |
| `OWNER` | Everything | Everything, including managing owners and admins |
| `ADMIN` | Every case, document, client, enquiry | Create cases, assign lawyers, link clients, remove documents, manage lawyers and editors |
| `LAWYER` | Cases assigned to them, internal items included | Edit those cases, log hearings/orders, upload, share or hide documents |
| `EDITOR` | No case data | Content only (for the CMS phase) |
| Client | Cases linked to their account; only items marked *Shared with client* | Open a matter (lands as `INTAKE`), upload documents, add notes, add versions of their own uploads |

All of this is enforced in one place, `apps/api/src/access.ts`: every case and
document query is built from `caseScope` / `documentScope`. A case outside the
caller's scope returns **404, not 403**, so references cannot be probed. The
`/dashboard` and `/admin` page guards are conveniences, not the boundary.

## Cases and documents

### Identifiers

| Record | Pattern | Example |
| --- | --- | --- |
| Case | `ALS-{year}-{6 × Crockford base32}` | `ALS-2026-K7Q3X9` |
| Document | `{case reference}-D{3-digit sequence}` | `ALS-2026-K7Q3X9-D004` |

The case code is random, so a client cannot infer how many matters the firm
opens a year; Crockford's alphabet drops I, L, O and U so a reference read over
the phone cannot be misheard. Documents are numbered within their case, which
is useful ("see D004") and reveals nothing beyond that case. See
`apps/api/src/lib/ids.ts`.

### The case record

Structured for Indian practice (`Case` in `schema.prisma`):

- **Forum** — Supreme Court, High Court, District/Sessions, Civil Judge /
  Magistrate, Family, Commercial, Tribunal, Consumer Commission, Arbitration,
  regulator, or not in litigation.
- **High Courts** — the form offers all 25 High Courts with their principal
  seats and benches (e.g. Bombay → Nagpur, Aurangabad, Goa, Kolhapur), in
  `apps/web/src/lib/portal/legal.ts`.
- **Court numbering** — case type as the court writes it (WP, WA, CRL.P,
  SLP(C), OS, CC (NI Act)…, suggested per forum), number, year, filing/diary
  number, filing and registration dates, and the 16-character eCourts **CNR**.
  Displayed the way courts cite it: *WP No. 12345 of 2026*.
- **Parties** in cause-title form — role and position ("Respondent No. 2"),
  which party the firm acts for, and opposing counsel.
- Acts and sections invoked, relief sought, the lower court and impugned order
  for appeals, coram and court hall, and the hearing calendar (last, next and
  purpose, disposal date and nature).
- **Status** (intake → active → disposed/closed) and **stage** (pre-filing,
  scrutiny, defects, admission, notice, pleadings, evidence, arguments,
  reserved, disposed).

The firm's reference never changes; the court's number is recorded separately
because it only exists after registration and can change on transfer.

### How the two dashboards stay connected

There is one set of records and one API; the dashboards are two views of it.
The **case timeline** (`CaseUpdate`) is the shared thread: a lawyer's hearing
entry, a change of status or stage, a new hearing date, a client's note and
every upload or new version write an entry, visible to the client unless the
firm marks it internal.

### Storage

`apps/api/src/storage/` is the only code that talks to a storage provider. It
exposes `put / get / delete / check`; routes never see anything else.

- **`s3`** — any S3-compatible service. Railway Buckets today; AWS S3,
  Cloudflare R2 or MinIO by changing the `S3_*` variables only.
- **`local`** — disk, for development. Refused in production.
- A different kind of provider (Azure Blob, GCS) is one new class implementing
  `StorageDriver` plus a line in `storage/index.ts`.

Each document version records which driver holds it, so after a move old
objects are still read from where they are until migrated.

### Encryption

Railway Buckets have no server-side encryption, so documents are encrypted in
the API before they leave the process (`apps/api/src/lib/crypto.ts`):
AES-256-GCM with a fresh data key per version, the data key wrapped by the
master key in `DOCUMENT_ENCRYPTION_KEY`. The bucket holds only ciphertext;
reading a document needs both the object and its database row. GCM also
authenticates, so a tampered object fails to decrypt. Object keys carry no
filenames or client details.

**Back up `DOCUMENT_ENCRYPTION_KEY` somewhere other than Railway.** Without it
the stored documents cannot be decrypted by anyone.

### Uploads and downloads

- Up to 25 MB (`MAX_UPLOAD_MB`). PDF, Word, Excel, PowerPoint, OpenDocument,
  text/CSV/RTF, JPEG/PNG/WebP/TIFF. Extension, stored type and the file's
  leading bytes must agree — a renamed executable is refused.
- New versions never overwrite: every version stays downloadable.
- Every download is written to `AuditLog` (who, which version, from which IP)
  before the bytes are fetched. Downloads are `no-store`, served as
  attachments unless a PDF/image is opened for viewing, with a sandboxing CSP.
- Removing a document is a soft delete by an admin; the stored objects are kept.

## Data flow for a form submission

1. Browser posts JSON to `POST /api/enquiries`.
2. CORS check against `CORS_ORIGINS`, then the per-IP rate limit.
3. Zod validates and rejects the honeypot field.
4. Row written with the DPDP consent flag and timestamp.
5. Response carries a quotable reference (`ENQ-2A4F19`). Enquiry content is
   never logged.

## Roadmap

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
- The editor UI belongs in the `/admin` console, gated to `EDITOR` and above.

### Phase 2 — Admin portal (built; extensions)

Built: staff and client management, role gates, case assignment, enquiry and
application status/notes, audit log viewer, revocable sessions. Still to do:

- Conflicts-check workflow — the step that currently happens by email and is
  the one with real professional-conduct consequences. An enquiry should be
  convertible into a client and case once cleared.
- Subscriber management.

### Phase 3 — Client portal and documents (built; extensions)

Built as above. Still to do:

- **Virus scanning** of uploads (e.g. ClamAV as a Railway service) before a
  file is shown to anyone but its uploader.
- **Retention policy** encoded on the case — professional record-keeping sets
  a floor, the DPDP Act sets expectations on erasure. Today nothing is ever
  hard-deleted.
- **Notifications** — email the client when the firm adds a document or a
  hearing, and the lawyer when the client uploads. Needs a mail provider.
- **Key rotation tooling** — records carry `encKeyId`; a script to re-wrap data
  keys under a new master key.
- Multi-factor sign-in is delegated to Google (2-Step Verification). If the
  firm wants to require it, a Google Workspace policy does that for staff.

### Phase 4 — RAG and assistants

Only worth building on top of Phase 3, because the value is in answering
questions over the firm's own documents.

- `pgvector` on the existing Postgres avoids adding a second datastore. Chunk
  and embed documents on upload; store chunks with the `Case` id.
- **Authorisation must be applied at retrieval, not after generation.** Filter
  candidate chunks with `documentScope` before they reach the model. Filtering
  the answer afterwards is not a control.
- Keep a citation for every generated claim, back to document and version. An
  assistant that cannot show its source is not usable for legal work.
- Client-facing chat is a later step than internal chat, and needs an explicit
  disclaimer that it is not legal advice — the same BCI reasoning that drives
  the disclaimer gate applies with more force to generated text.

## Setting up Google sign-in

In Google Cloud Console, for the firm's project:

1. **APIs & Services → OAuth consent screen** (Google Auth Platform →
   Branding / Audience). User type **External**. App name *ADOORA Legal
   Services*, support email, the website as the home page, and links to
   `/privacy` and `/terms`. Scopes: `openid`, `email`, `profile` only — these
   are non-sensitive, so no Google verification review is needed. Publish the
   app to **In production**; in *Testing* only listed test users can sign in.
2. **Credentials → Create credentials → OAuth client ID**, type **Web
   application**.
   - Authorised JavaScript origins: **not needed.** Sign-in is a server-side
     redirect flow; origins only matter for in-browser Google sign-in (One
     Tap, the Google Identity Services button). Leave empty, or add the
     website origin if that is ever added.
   - Authorised redirect URIs — exactly:
     - `https://adoora-web-production.up.railway.app/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback`
   - When the firm's own domain goes live, add its origin and
     `https://<domain>/api/auth/google/callback`, and change `APP_URL`.
3. Put the client ID and secret in Railway on **adoora-api** as
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (seal the secret). They are
   never in the repository and never sent to the browser.

## Environment variables

### `adoora-api`

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Set as a reference: `${{Postgres.DATABASE_URL}}` |
| `CORS_ORIGINS` | yes | Comma-separated. Must include the web service's public URL. |
| `JWT_SECRET` | yes in production | 32+ chars. `openssl rand -base64 48`. Also signs the OAuth state cookie. |
| `APP_URL` | yes | The **website's** public origin. Cookie origin, Google redirect base, post-sign-in landing. |
| `GOOGLE_CLIENT_ID` | for Google sign-in | From Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | for Google sign-in | Seal it in Railway. |
| `ADMIN_EMAILS` | no | Comma-separated; become `OWNER` on first Google sign-in. |
| `ALLOW_CLIENT_SIGNUP` | no | `true` (default) lets any Google account create a client account. |
| `STORAGE_DRIVER` | yes in production | `s3` (production) or `local` (development). |
| `S3_BUCKET` `S3_ENDPOINT` `S3_REGION` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` | with `s3` | On Railway, references to the bucket: `${{documents.BUCKET}}`, `${{documents.ENDPOINT}}`, `${{documents.REGION}}`, `${{documents.ACCESS_KEY_ID}}`, `${{documents.SECRET_ACCESS_KEY}}`. |
| `S3_FORCE_PATH_STYLE` | no | `true` only for providers that need path-style URLs. |
| `DOCUMENT_ENCRYPTION_KEY` | yes in production | 32 bytes base64. `openssl rand -base64 32`. Seal it, and keep a copy outside Railway. |
| `DOCUMENT_ENCRYPTION_KEY_ID` | no | Label stored with each document; defaults to `k1`. |
| `MAX_UPLOAD_MB` | no | Defaults to 25. Keep below the web's `proxyClientMaxBodySize` (30 MB). |
| `NOTIFY_EMAIL` | no | Enquiry notifications, once mail is wired up. |
| `PORT` | no | Railway injects it. |
| `NODE_ENV` | yes | `production` |
| `LOG_LEVEL` | no | Defaults to `info`. |

### `adoora-web`

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical origin. Wrong value breaks canonicals and the sitemap. |
| `NEXT_PUBLIC_API_URL` | yes | The API service's public URL (used by the public forms). |
| `API_INTERNAL_URL` | yes on Railway | Target of the `/api/*` rewrite: `http://${{adoora-api.RAILWAY_PRIVATE_DOMAIN}}:${{adoora-api.PORT}}`. |

`NEXT_PUBLIC_*` values and `API_INTERNAL_URL` are read at build time, so
changing one requires a redeploy, not a restart.

## Known gaps

Carried deliberately, listed so they are not forgotten:

- **Lawyer profiles are placeholders.** `apps/web/src/content/people.ts` has
  invented names and experience. Bar enrolment numbers are `null` rather than
  fabricated, and the UI omits the enrolment line when they are. Not
  publishable until the firm supplies real profiles.
- **Office addresses are illustrative.** Same file family — `firm.ts`.
- **No notification email** — for enquiries, or for dashboard activity. Both
  wait on a mail provider.
- **No virus scanning of uploads.** The type allow-list and byte checks refuse
  executables and anything outside office documents and images, but a
  malicious PDF or macro document is not detected. Add scanning before the
  portal is opened to the public at large.
- **No CV upload.** The careers form asks candidates to email the CV instead.
  The document pipeline could now carry it, but a retention policy comes first.
- **No analytics provider.** The cookie banner's analytics category exists and
  is honoured; nothing is wired to it yet.
- **Media & mentions section not built.** The home page has no YouTube/podcast
  block because there are no real URLs to embed yet.
