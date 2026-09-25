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
| GET POST PATCH | `/api/admin/clients` | Staff (OWNER/ADMIN) | Client accounts. Deactivating revokes sessions. |
| GET | `/api/admin/audit` | Staff (OWNER/ADMIN) | Audit log. |
| GET | `/api/auth/google` → `/api/auth/google/callback` | — | Google sign-in (OIDC + PKCE). Sets the session cookie. |
| POST | `/api/auth/password` | — | Staff password sign-in, session cookie. |
| GET · POST | `/api/auth/me` · `/api/auth/logout` | Session | Current account; sign out. |
| GET POST | `/api/cases` | Session | Cases in the caller's scope; create (clients create INTAKE matters). |
| GET PATCH | `/api/cases/:ref` | Session | Case detail (filtered by role); edit (lawyers on the case, admins). |
| GET | `/api/cases/:cnr` | Staff (not EDITOR) | Live case record from eCourtsIndia by 16-character CNR. 20 lookups/min per user; audited. |
| POST | `/api/cases/:ref/updates` | Session | Timeline entry. |
| PUT | `/api/cases/:ref/assignments` · `/clients` | Admin | Lawyers on the case; client accounts that can see it. |
| POST | `/api/cases/:ref/documents` | Session | Multipart upload (`file`), encrypted and stored. |
| GET | `/api/documents` · `/api/documents/:ref` | Session | Documents in scope; metadata and versions. |
| POST | `/api/documents/:ref/versions` | Session | New version; nothing is overwritten. |
| GET | `/api/documents/:ref/download` | Session | Decrypted file. Audited. `?version=n`, `?inline=1`. |
| PATCH · DELETE | `/api/documents/:ref` | Staff · Admin | Title, type, visibility; soft delete. |

"Session" means the `__Host-als_session` cookie, sent by the website through
its `/api` rewrite. Staff endpoints also accept the bearer token from
`/api/admin/auth/login`. What each caller sees is decided in `src/access.ts`.

`/api/cases/:cnr` and `/api/cases/:ref` share a path: a 16-character value
with no hyphens is treated as a CNR and looked up on eCourtsIndia
(`src/integrations/ecourts.ts`); anything else (`ALS-2026-K7Q3X9`) is the
firm's own record. `ECOURTS_API_KEY` is sent only to eCourtsIndia, as a
bearer token — it never reaches the browser or the logs.

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
