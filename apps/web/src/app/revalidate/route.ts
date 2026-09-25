import { revalidateTag } from "next/cache";
import { JOBS_TAG, PEOPLE_TAG } from "@/lib/website-data";

/**
 * POST /revalidate { "tags": ["website-people"] } — called by the admin
 * console after it saves a lawyer profile or a job opening, so the public
 * pages show the change on their next visit instead of within five minutes.
 *
 * Only an owner or admin may call it: the caller's session cookie is passed
 * to the API's /auth/me and the role checked there.
 */
const apiOrigin = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const ALLOWED = new Set([PEOPLE_TAG, JOBS_TAG]);

export async function POST(request: Request) {
  const me = await fetch(`${apiOrigin}/api/auth/me`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  const role = me?.user?.kind === "staff" ? me.user.role : null;
  if (role !== "OWNER" && role !== "ADMIN") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string" && ALLOWED.has(tag)) : [];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
