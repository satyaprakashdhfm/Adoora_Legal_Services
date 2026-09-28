"use client";

import { useState } from "react";
import { api, downloadUrl, type CaseDetail, type CourtHearing, type CourtOrder } from "@/lib/portal/api";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { CourtCaptcha } from "@/components/portal/court-captcha";
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
 * The eCourtsIndia backup (staff only, paid): asks eCourtsIndia to re-read
 * the court's record, then picks the fresh copy up a few minutes later (see
 * court-record.ts on the API). Also "Re-read saved record", which is free.
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
            ? "Backup update requested from eCourtsIndia. The fresh record appears here in about 5 minutes — no need to wait on this page."
            : `${
                result.changes.length ? `Checked through eCourtsIndia. ${result.changes.join(" · ")}.` : "Checked through eCourtsIndia — nothing has changed."
              }${result.sourceUpdatedAt ? ` eCourtsIndia data as of ${formatDateTime(result.sourceUpdatedAt)}.` : ""}`,
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSyncing(null);
    }
  }

  return { sync: () => run("check"), rebuild: () => run("rebuild"), syncing, error };
}

/** Staff only: what the backup costs. Clients never see prices. */
function PriceLine({ record }: { record: CaseDetail }) {
  const pricing = record.ecourtsPricing;
  if (!pricing || !record.ecourtsBackup) return null;
  return (
    <p className="text-xs text-slate">
      Court website: free. eCourtsIndia backup: refresh {pricing.refresh ?? "—"} + details {pricing.details ?? "—"} per check — use it only when the
      court&apos;s website is not working.
    </p>
  );
}

function PendingNote({ record }: { record: CaseDetail }) {
  if (!refreshPending(record)) return null;
  return (
    <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
      Updating through eCourtsIndia — requested {formatDateTime(record.courtRefreshQueuedAt!)}. The fresh record appears within a few minutes.
    </p>
  );
}

/** The small "use the backup" button, for staff while the backup is switched on. */
function BackupButton({ record, onSynced }: { record: CaseDetail; onSynced: OnSynced }) {
  const { sync, syncing, error } = useCourtSync(record, onSynced);
  if (!record.ecourtsBackup || !record.cnrNumber) return null;
  const pending = refreshPending(record);
  return (
    <>
      <Button size="sm" tone="ghost" onClick={() => void sync()} disabled={syncing !== null || pending}>
        {syncing ? "Asking eCourtsIndia…" : pending ? "Backup update on its way" : "Use eCourtsIndia backup"}
      </Button>
      {error && <ErrorNote>{error}</ErrorNote>}
    </>
  );
}

// ---------------------------------------------------------------------------
// Update from court: the court's own website (captcha typed by a person)
// ---------------------------------------------------------------------------

type Summary = { hearings: number; orders: number; saved: number; alreadySaved: number; failed: number; remaining: number; changes: string[] };

function summaryMessage(s: Summary) {
  const changed = s.changes.length ? ` ${s.changes.join(" · ")}.` : "";
  if (!s.orders) {
    return `Updated from the court's website: ${s.hearings} hearing${s.hearings === 1 ? "" : "s"} on record.${changed} The court has not uploaded any orders or judgments for this case yet.`;
  }
  const parts = [
    s.saved ? `${s.saved} new document${s.saved === 1 ? "" : "s"} saved` : "No new documents",
    s.alreadySaved ? `${s.alreadySaved} already saved` : null,
    s.failed ? `${s.failed} could not be downloaded — try again later` : null,
    s.remaining ? `${s.remaining} more on the next update` : null,
    `${s.hearings} hearing${s.hearings === 1 ? "" : "s"} on record`,
  ].filter(Boolean);
  return `Updated from the court's website: ${parts.join(" · ")}.${changed} Documents are in Documents → From the court.`;
}

/**
 * "Update from court": the court's website shows a captcha, the person types
 * it, and the API reads the case page — status, next date, hearings — and
 * saves each order's PDF to the case's documents, skipping any it already has.
 */
export function UpdateFromCourtButton({
  record,
  onSynced,
  size,
  tone,
}: {
  record: CaseDetail;
  onSynced: OnSynced;
  size?: "sm";
  tone?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  if (!record.cnrNumber) return null;
  return (
    <>
      <Button size={size} tone={tone} onClick={() => setOpen(true)}>
        Update from court
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Update from court">
        {open && (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Reads CNR <span className="font-mono font-semibold">{record.cnrNumber}</span> on the court&apos;s own website: the latest status, next date and
              hearings, and every order and judgment PDF — saved to this case. PDFs already saved are not downloaded again.
            </p>
            <CourtCaptcha<{ case: CaseDetail; summary: Summary }>
              base={`/cases/${encodeURIComponent(record.reference)}/portal`}
              submitLabel="Update"
              onResult={(result) => {
                onSynced(result.case, summaryMessage(result.summary));
                setOpen(false);
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

/** The court's own status line, for the case overview's side column. */
export function CourtStatusCard({ record, onSynced }: { record: CaseDetail; onSynced: OnSynced }) {
  if (!record.cnrNumber && !record.courtStatus && !record.courtStage) return null;

  return (
    <Card>
      <CardHeader title="Court status" description="From the court's own record." />
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
          <p className="text-slate">Not updated from the court yet.</p>
        )}
        {record.courtCheckedAt && <p className="text-xs text-slate">Last updated {formatDateTime(record.courtCheckedAt)}</p>}
        <PendingNote record={record} />
        <div className="flex flex-wrap gap-2">
          <UpdateFromCourtButton record={record} onSynced={onSynced} size="sm" tone="secondary" />
          <BackupButton record={record} onSynced={onSynced} />
        </div>
        <PriceLine record={record} />
      </div>
    </Card>
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
  const { rebuild, syncing, error } = useCourtSync(record, onSynced);

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
                {record.courtCheckedAt ? `Last updated ${formatDateTime(record.courtCheckedAt)}` : "Not updated from the court yet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {record.canEdit && record.courtCheckedAt && (
                <Button size="sm" tone="ghost" onClick={() => void rebuild()} disabled={syncing !== null}>
                  {syncing === "rebuild" ? "Re-reading…" : "Re-read saved record"}
                </Button>
              )}
              <BackupButton record={record} onSynced={onSynced} />
              <UpdateFromCourtButton record={record} onSynced={onSynced} size="sm" />
            </div>
          </div>
          <div className="space-y-2 px-5 pb-4">
            <PendingNote record={record} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <p className="text-xs text-slate">
              <span className="font-semibold text-ink-soft">Update from court</span> reads the court&apos;s own website — status, hearings and order PDFs.
              You type its captcha; it is free.
            </p>
            <PriceLine record={record} />
          </div>
        </Card>
      ) : (
        <p className="text-sm text-slate">No CNR on this case, so it cannot be updated from the court. The history below was entered by the firm.</p>
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
                      ? ` (${savedOrders} saved to Documents${savedOrders < record.orders.length ? " — use Update from court for the rest" : ""})`
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

    </div>
  );
}
