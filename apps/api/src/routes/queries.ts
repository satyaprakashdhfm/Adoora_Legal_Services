import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError, makeReference } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { requireSignedIn } from "../middleware/auth.js";
import { caseScope, findVisibleCase, isCaseStaff, isFirmAdmin, notFound } from "../access.js";
import { queryCreateSchema, queryListSchema, queryPatchSchema } from "../portal-schemas.js";
import type { Principal } from "../auth/session.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * Client queries: a signed-in client asking the firm something from their
 * dashboard, optionally about one of their cases. Not the website's contact
 * form — those are `Enquiry` rows from people who are not clients yet.
 *
 *   client   raises queries and reads the firm's replies to their own
 *   admin    sees and answers every query
 *   lawyer   sees and answers queries on the cases assigned to them
 */
export const queriesRouter = Router();

queriesRouter.use(requireSignedIn);

function queryScope(principal: Principal): Prisma.ClientQueryWhereInput {
  if (principal.kind === "client") return { clientId: principal.id };
  if (isFirmAdmin(principal)) return {};
  if (isCaseStaff(principal)) return { case: caseScope(principal) };
  return { id: { in: [] } };
}

const include = {
  case: { select: { reference: true, title: true } },
  client: { select: { id: true, name: true, email: true } },
  answeredBy: { select: { name: true } },
} satisfies Prisma.ClientQueryInclude;

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `query:${req.principal?.id ?? "anonymous"}`,
  message: { error: "rate_limited", message: "You have sent several queries this hour. Please try again later." },
});

queriesRouter.get("/", async (req, res) => {
  const principal = req.principal!;
  const query = queryListSchema.parse(req.query);
  const rows = await prisma.clientQuery.findMany({
    where: { AND: [queryScope(principal), query.status ? { status: query.status } : {}] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include,
  });
  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  res.set("Cache-Control", "no-store");
  res.json({ data: page, nextCursor: hasMore ? page[page.length - 1]?.id : null });
});

queriesRouter.post("/", createLimiter, async (req, res) => {
  const principal = req.principal!;
  if (principal.kind !== "client") throw notFound("query");
  const input = queryCreateSchema.parse(req.body);
  const found = input.caseReference ? await findVisibleCase(principal, input.caseReference) : null;

  let created;
  for (let attempt = 0; ; attempt++) {
    try {
      created = await prisma.clientQuery.create({
        data: {
          reference: makeReference("QRY"),
          clientId: principal.id,
          caseId: found?.id ?? null,
          subject: input.subject,
          message: input.message,
        },
        include,
      });
      break;
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002" || attempt >= 4) throw error;
    }
  }

  await audit(req, "query.created", "ClientQuery", created.id, { reference: created.reference });
  res.status(201).json(created);
});

queriesRouter.patch("/:id", async (req, res) => {
  const principal = req.principal!;
  if (!isCaseStaff(principal)) throw notFound("query");
  const id = z.string().uuid().parse(req.params.id);
  const input = queryPatchSchema.parse(req.body);

  const found = await prisma.clientQuery.findFirst({ where: { id, ...queryScope(principal) } });
  if (!found) throw notFound("query");

  const replying = input.reply !== undefined && input.reply !== null && input.reply !== found.reply;
  if (input.reply === null && input.status === "ANSWERED") {
    throw new HttpError(400, "Write a reply before marking the query answered.", "no_reply");
  }

  const updated = await prisma.clientQuery.update({
    where: { id },
    data: {
      reply: input.reply,
      status: input.status ?? (replying ? "ANSWERED" : undefined),
      answeredById: replying ? principal.id : undefined,
      answeredAt: replying ? new Date() : undefined,
    },
    include,
  });

  await audit(req, "query.updated", "ClientQuery", id, { status: updated.status, replied: replying });
  res.json(updated);
});
