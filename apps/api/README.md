# ADOORA API

Node + Express + Prisma service backing the ADOORA Legal Services website, and
the foundation for the admin and client portals.

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
| GET | `/api/admin/stats` | Bearer (OWNER/ADMIN) | Dashboard counts. |

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
