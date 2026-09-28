"use client";

/* eslint-disable @next/next/no-img-element -- the captcha arrives as a data: URL from the API */
import { useState } from "react";
import { api, downloadUrl, type CaseDetail, type CourtHearing, type CourtOrder } from "@/lib/portal/api";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Modal, Table, Td, Th } from "@/components/portal/ui";

type SyncResult = {
  case: CaseDetail;
  changes: string[];
  recordChanged: boolean;
  refreshed?: boolean;
  pending?: boolean;
  sourceUpdatedAt?: string | null;
};

type OnSynced = (updated: CaseDetail, message: string) => void;

/** A refresh queued within this long is still "on its way". */
const PENDING_FOR_MS = 15 * 60 * 1000;

function refreshPending(record: CaseDetail) {
  return Boolean(record.courtRefreshQueuedAt && Date.now() - new Date(record.courtRefreshQueuedAt).getTime() < PENDING_FOR_MS);
}

/**
 * "Check court status": asks eCourtsIndia to re-read the court's record, then
 * picks the fresh copy up a few minutes later (see court-record.ts on the
 * API). Anyone who can see the case can ask; the result is saved for everyone.
 */
function useCourtSync(record: CaseDetail, onSynced: OnSynced) {
  const [syncing, setSyncing] = useState<"check" | "rebuild" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "check" | "rebuild") {
    setSyncing(kind);
    setError(null);
    try {
      const path = kind === "check" ? "court-sync" : "court-rebuild";
      const result = await api<SyncResult>(`/cases/${encodeURIComponent(record.reference)}/${path}`, { method: "POST" });
      onSynced(
        result.case,
        kind === "rebuild"
          ? `Saved court record re-read: ${result.changes.join(" · ")}.`
          : result.pending
            ? "Update requested from eCourts. The fresh record appears here in about 5 minutes — no need to wait on this page."
            : `${
                result.changes.length ? `Court record checked. ${result.changes.join(" · ")}.` : "Court record checked — nothing has changed since the last check."
              }${result.sourceUpdatedAt ? ` eCourts data as of ${formatDateTime(result.sourceUpdatedAt)}.` : ""}`,
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSyncing(null);
    }
  }

  return { sync: () => run("check"), rebuild: () => run("rebuild"), syncing, error };
}

/** Staff only: what each way of checking costs. Clients never see prices. */
function PriceLine({ record }: { record: CaseDetail }) {
  const pricing = record.ecourtsPricing;
  if (!pricing) return null;
  const set = pricing.details || pricing.refresh;
  return (
    <p className="text-xs text-slate">
      {set
        ? `eCourtsIndia: details ${pricing.details ?? "—"} · refresh ${pricing.refresh ?? "—"} per request. Court website: free.`
        : "eCourtsIndia prices not set (ECOURTS_PRICE_DETAILS / ECOURTS_PRICE_REFRESH on Railway). Court website: free."}
    </p>
  );
}

function PendingNote({ record }: { record: CaseDetail }) {
  if (!refreshPending(record)) return null;
  return (
    <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
      Updating from eCourts — requested {formatDateTime(record.courtRefreshQueuedAt!)}. The fresh record appears within a few minutes.
    </p>
  );
}

/** The court's own status line, for the case overview's side column. */
export function CourtStatusCard({ record, onSynced }: { record: CaseDetail; onSynced: OnSynced }) {
  const { sync, syncing, error } = useCourtSync(record, onSynced);
  if (!record.cnrNumber && !record.courtStatus && !record.courtStage) return null;
  const pending = refreshPending(record);

  return (
    <Card>
      <CardHeader title="Court status" description="From the court's record on eCourts." />
      <div className="space-y-3 px-5 py-4 text-sm">
        {record.courtStatus || record.courtStage ? (
          <dl className="space-y-2">
            {record.courtStatus && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Status</dt>
                <dd className="text-right font-semibold text-ink">{record.courtStatus}</dd>
              </div>
            )}
            {record.courtStage && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate">Stage</dt>
                <dd className="text-right font-semibold text-ink">{record.courtStage}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-slate">Hearings / orders</dt>
              <dd className="text-right text-ink">
                {record.hearings.length} / {record.orders.length}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-slate">Not checked against eCourts yet.</p>
        )}
        {record.courtCheckedAt && <p className="text-xs text-slate">Last checked {formatDateTime(record.courtCheckedAt)}</p>}
        <PendingNote record={record} />
        <ErrorNote>{error}</ErrorNote>
        {record.cnrNumber && (
          <Button size="sm" tone="secondary" onClick={() => void sync()} disabled={syncing !== null || pending}>
            {syncing ? "Asking eCourts…" : pending ? "Update on its way" : "Check court status"}
          </Button>
        )}
        <PriceLine record={record} />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Court documents from the court's own website (captcha typed by a person)
// ---------------------------------------------------------------------------

type Summary = { hearings: number; orders: number; saved: number; alreadySaved: number; failed: number; remaining: number };

/**
 * "Get court documents": the court's website shows a captcha, the person
 * types it, and the API fetches the case page and saves each order's PDF to
 * the case's documents — skipping any it already has.
 */
function CourtDocumentsDialog({ record, onSynced, onClose }: { record: CaseDetail; onSynced: OnSynced; onClose: () => void }) {
  const base = `/cases/${encodeURIComponent(record.reference)}/portal`;
  const [session, setSession] = useState<{ sessionId: string; captcha: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"start" | "image" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function start() {
    setBusy("start");
    setError(null);
    try {
      setSession(await api<{ sessionId: string; captcha: string }>(`${base}/start`, { method: "POST" }));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function newImage() {
    if (!session) return;
    setBusy("image");
    setError(null);
    try {
      const next = await api<{ sessionId: string; captcha: string }>(`${base}/captcha`, { method: "POST", body: { sessionId: session.sessionId } });
      setSession(next);
      setCode("");
    } catch (cause) {
      setError((cause as Error).message);
      setSession(null);
    } finally {
      setBusy(null);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !code.trim()) return;
    setBusy("submit");
    setError(null);
    setNote(null);
    try {
      const result = await api<{ retry?: boolean; captcha?: string; case?: CaseDetail; summary?: Summary }>(`${base}/submit`, {
        method: "POST",
        body: { sessionId: session.sessionId, code },
      });
      if (result.retry && result.captcha) {
        setSession({ sessionId: session.sessionId, captcha: result.captcha });
        setCode("");
        setNote("That did not match. Here is a new picture — please try again.");
        return;
      }
      const s = result.summary!;
      if (!s.orders) {
        onSynced(
          result.case!,
          `Checked the court's website: ${s.hearings} hearing${s.hearings === 1 ? "" : "s"} on record, but the court has not uploaded any orders or judgments for this case yet — there is nothing to download. Try again after the next hearing.`,
        );
        onClose();
        return;
      }
      const parts = [
        s.saved ? `${s.saved} new document${s.saved === 1 ? "" : "s"} saved` : "No new documents",
        s.alreadySaved ? `${s.alreadySaved} already saved` : null,
        s.failed ? `${s.failed} could not be downloaded` : null,
        s.remaining ? `${s.remaining} more on the next check` : null,
        `${s.hearings} hearing${s.hearings === 1 ? "" : "s"} on record`,
      ].filter(Boolean);
      onSynced(result.case!, `From the court's website: ${parts.join(" · ")}. Saved in Documents → From the court.`);
      onClose();
    } catch (cause) {
      setError((cause as Error).message);
      setSession(null);
      setCode("");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Fetches the hearing history and every order and judgment PDF for CNR <span className="font-mono font-semibold">{record.cnrNumber}</span> from the
        court&apos;s own website, and saves them to this case. Documents already saved are not downloaded again.
      </p>
      <p className="rounded-md bg-paper-warm px-3 py-2 text-xs text-ink-soft">
        <span className="font-semibold">Why a captcha?</span> The court&apos;s website asks for this code to check a person is asking. We pass it straight to the court.
      </p>
      <ErrorNote>{error}</ErrorNote>
      {note && <p className="text-sm text-amber-800">{note}</p>}

      {!session ? (
        <Button onClick={() => void start()} disabled={busy !== null}>
          {busy === "start" ? "Opening the court's website…" : "Show the court's captcha"}
        </Button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <img src={session.captcha} alt="Captcha from the court's website" className="h-14 rounded border border-line bg-white" />
            <Button size="sm" tone="ghost" onClick={() => void newImage()} disabled={busy !== null}>
              {busy === "image" ? "Loading…" : "New picture"}
            </Button>
          </div>
          <label className="block text-xs font-semibold text-ink-soft">
            Type the characters in the picture
            <input
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12))}
              autoComplete="off"
              className="mt-1.5 w-full rounded-md border border-line-strong bg-white px-3 py-2 font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </label>
          <Button type="submit" disabled={busy !== null || !code.trim()}>
            {busy === "submit" ? "Fetching from the court — this can take a minute…" : "Get documents"}
          </Button>
        </form>
      )}
    </div>
  );
}

/** The full court record: hearing history and orders. */
type TimelineEntry = { key: string; date: string; hearing: CourtHearing | null; orders: CourtOrder[] };

/** Day key in UTC — the court's dates carry no time. */
const dayOf = (value: string) => value.slice(0, 10);

/**
 * Hearings and orders as one list, newest first. Each order joins the hearing
 * held on its date; an order from a day with no listed hearing gets a row of its own.
 */
function buildTimeline(record: CaseDetail): TimelineEntry[] {
  const byDay = new Map<string, TimelineEntry>();
  for (const hearing of record.hearings) {
    const day = dayOf(hearing.hearingDate);
    if (!byDay.has(day)) byDay.set(day, { key: `h-${hearing.id}`, date: hearing.hearingDate, hearing, orders: [] });
  }
  for (const order of record.orders) {
    const day = dayOf(order.orderDate);
    const entry = byDay.get(day) ?? { key: `o-${order.id}`, date: order.orderDate, hearing: null, orders: [] };
    entry.orders.push(order);
    byDay.set(day, entry);
  }
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0)).map(([, entry]) => entry);
}

function OrderLine({ order }: { order: CourtOrder }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-line bg-paper-warm/60 px-2.5 py-1.5 text-xs">
      <Badge tone="gold">Order</Badge>
      <span className="font-semibold text-ink">{order.orderType}</span>
      {order.documentReference ? (
        <a
          href={downloadUrl(order.documentReference, { inline: true })}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-gold-deep underline underline-offset-2"
        >
          Open PDF
        </a>
      ) : (
        <span className="text-slate">PDF not saved yet</span>
      )}
      {order.summary && <p className="basis-full leading-relaxed text-ink-soft">{order.summary}</p>}
    </div>
  );
}

export function CourtRecordPanel({ record, onSynced }: { record: CaseDetail; onSynced: OnSynced }) {
  const { sync, rebuild, syncing, error } = useCourtSync(record, onSynced);
  const [fetching, setFetching] = useState(false);
  const pending = refreshPending(record);

  const hasHistory = record.hearings.length > 0 || record.orders.length > 0;
  if (!record.cnrNumber && !hasHistory) {
    return (
      <Card>
        <EmptyState title="No CNR on this case">
          {record.canEdit
            ? "Add the CNR under Edit details, then check the court's record here."
            : "Once the firm records the court's CNR number, the hearing history and orders appear here."}
        </EmptyState>
      </Card>
    );
  }

  const savedOrders = record.orders.filter((order) => order.documentReference).length;
  const timeline = buildTimeline(record);

  return (
    <div className="space-y-6">
      {record.cnrNumber ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm text-ink">
                CNR <span className="font-mono font-semibold">{record.cnrNumber}</span>
                {record.courtStatus && (
                  <>
                    {" "}
                    · <span className="font-semibold">{record.courtStatus}</span>
                  </>
                )}
                {record.courtStage && <> · {record.courtStage}</>}
              </p>
              <p className="mt-0.5 text-xs text-slate">
                {record.courtCheckedAt ? `Last checked ${formatDateTime(record.courtCheckedAt)}` : "Not checked against eCourts yet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {record.canEdit && record.courtCheckedAt && (
                <Button size="sm" tone="ghost" onClick={() => void rebuild()} disabled={syncing !== null}>
                  {syncing === "rebuild" ? "Re-reading…" : "Re-read saved record"}
                </Button>
              )}
              <Button size="sm" tone="secondary" onClick={() => setFetching(true)}>
                Get court documents
              </Button>
              <Button size="sm" onClick={() => void sync()} disabled={syncing !== null || pending}>
                {syncing === "check" ? "Asking eCourts…" : pending ? "Update on its way" : "Check court status"}
              </Button>
            </div>
          </div>
          <div className="space-y-2 px-5 pb-4">
            <PendingNote record={record} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <p className="text-xs text-slate">
              <span className="font-semibold text-ink-soft">Check court status</span> updates dates and stage through eCourtsIndia.{" "}
              <span className="font-semibold text-ink-soft">Get court documents</span> fetches hearing history and order PDFs from the court&apos;s own
              website — you type its captcha.
            </p>
            <PriceLine record={record} />
          </div>
        </Card>
      ) : (
        <p className="text-sm text-slate">No CNR on this case, so it cannot be checked against eCourts. The history below was entered by the firm.</p>
      )}

      {(record.courtFacts ?? []).length > 0 && (
        <Card>
          <CardHeader title="Court details" description="More from the court's record." />
          <dl className="grid gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
            {record.courtFacts.map((fact, index) => (
              <div key={`${fact.label}-${index}`}>
                <dt className="text-xs text-slate">{fact.label}</dt>
                <dd className="mt-0.5 text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Hearings and orders"
          description={
            timeline.length === 0
              ? undefined
              : [
                  `${record.hearings.length} hearing${record.hearings.length === 1 ? "" : "s"}`,
                  `${record.orders.length} order${record.orders.length === 1 ? "" : "s"}${
                    record.orders.length
                      ? ` (${savedOrders} saved to Documents${savedOrders < record.orders.length ? " — use Get court documents for the rest" : ""})`
                      : ""
                  }`,
                ].join(" · ") + ". An order appears on the hearing of the same date."
          }
        />
        {timeline.length === 0 ? (
          <EmptyState title="No hearings or orders on the court's record yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Listed for · what happened · orders</Th>
                <Th>Judge</Th>
                <Th>Next date</Th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((entry) => (
                <tr key={entry.key}>
                  <Td className="whitespace-nowrap font-semibold">{formatDate(entry.date)}</Td>
                  <Td>
                    {entry.hearing ? (entry.hearing.purpose ?? "—") : <span className="text-xs text-slate">Order passed (not a listed hearing)</span>}
                    {entry.hearing?.business && <p className="mt-0.5 text-xs text-slate">{entry.hearing.business}</p>}
                    {entry.orders.map((order) => (
                      <OrderLine key={order.id} order={order} />
                    ))}
                  </Td>
                  <Td className="text-xs">{entry.hearing?.judge ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-xs">{entry.hearing?.nextDate ? formatDate(entry.hearing.nextDate) : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={fetching} onClose={() => setFetching(false)} title="Get court documents">
        {fetching && <CourtDocumentsDialog record={record} onSynced={onSynced} onClose={() => setFetching(false)} />}
      </Modal>
    </div>
  );
}
