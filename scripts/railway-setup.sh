#!/usr/bin/env bash
#
# Creates the two Railway app services for the ADOORA project and wires their
# variables. Postgres is assumed to exist already.
#
# Run this only after `railway login`. It is idempotent enough to re-run: if a
# service already exists, `railway add` fails for that service and the script
# reports it rather than duplicating anything.
#
# One thing this script CANNOT do: set each service's Root Directory. The CLI
# has no flag for it, so finish that in the Railway dashboard (or ask Claude to
# do it through the Railway MCP tools, which can). Without it the builds fail,
# because the repository root is not a Node app.
#
#   adoora-api  ->  Root Directory: apps/api
#   adoora-web  ->  Root Directory: apps/web
#
set -euo pipefail

PROJECT_ID="98011a8e-1e37-44ee-a1c7-f4b9f57dea8a"
REPO="satyaprakashdhfm/Adoora_Legal_Services"
BRANCH="dev"

if ! railway whoami >/dev/null 2>&1; then
  echo "Not logged in to Railway. Run: railway login" >&2
  exit 1
fi

echo "Linking project..."
railway link --project "$PROJECT_ID" --environment production

# A signing secret for admin session tokens. Generated here so it never has to
# be pasted anywhere; note it down if you want to reuse it elsewhere.
JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"

echo
echo "Creating adoora-api..."
railway add \
  --service adoora-api \
  --repo "$REPO" \
  --branch "$BRANCH" \
  --variables "NODE_ENV=production" \
  --variables "JWT_SECRET=${JWT_SECRET}" \
  --variables "LOG_LEVEL=info" \
  --variables "DATABASE_URL=\${{Postgres.DATABASE_URL}}" \
  || echo "  (adoora-api may already exist — continuing)"

echo
echo "Creating adoora-web..."
railway add \
  --service adoora-web \
  --repo "$REPO" \
  --branch "$BRANCH" \
  || echo "  (adoora-web may already exist — continuing)"

cat <<'NEXT'

--------------------------------------------------------------------
Remaining steps (dashboard, or via the Railway MCP tools)
--------------------------------------------------------------------

1. Set Root Directory on each service — builds fail without this:
     adoora-api  ->  apps/api
     adoora-web  ->  apps/web

2. Generate a public domain for each service.

3. Set the cross-references once the domains exist:

     adoora-api:
       CORS_ORIGINS   = https://<adoora-web domain>

     adoora-web:
       NEXT_PUBLIC_SITE_URL = https://<adoora-web domain>
       NEXT_PUBLIC_API_URL  = https://<adoora-api domain>

   NEXT_PUBLIC_* values are inlined at build time, so redeploy adoora-web
   after setting them — a restart is not enough.

4. Create the first staff account:

     railway run --service adoora-api \
       env SEED_OWNER_EMAIL=you@firm.com \
           SEED_OWNER_PASSWORD='a-long-password' \
       npm run seed

5. Check it came up:

     curl https://<adoora-api domain>/health
     curl https://<adoora-api domain>/health/ready

NEXT
