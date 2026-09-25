"use client";

import { useState } from "react";
import { api, type CaseDetail } from "@/lib/portal/api";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Table, Td, Th } from "@/components/portal/ui";

type SyncResult = { case: CaseDetail; changes: string[]; recordChanged: boolean };

/**
 * "Check court status": fetches the court's record from eCourts and writes
 * it to the case (see court-record.ts on the API). Anyone who can see the
 * case can ask, and the result is saved for everyone — the firm and the
 * client see the same thing afterwards.
 */
function useCourtSync(record: CaseDetail, onSynced: (updated: CaseDetail, message: string) => void) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      const result = await api<SyncResult>(`/cases/${encodeURIComponent(record.reference)}/court-sync`, { method: "POST" });
      onSynced(
        result.case,
        result.changes.length
          ? `Court record checked. ${result.changes.join(" · ")}.`
          : "Court record checked — nothing has changed since the last check.",
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return { sync, syncing, error };
}

/** The court's own status line, for the case overview's side column. */
export function CourtStatusCard({ record, onSynced }: { record: CaseDetail; onSynced: (updated: CaseDetail, message: string) => void }) {
  const { sync, syncing, error } = useCourtSync(record, onSynced);
  if (!record.cnrNumber && !record.courtStatus && !record.courtStage) return null;

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
              <dd className="text-right text-ink">{record.hearings.length} / {record.orders.length}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-slate">Not checked against eCourts yet.</p>
        )}
        {record.courtCheckedAt && <p className="text-xs text-slate">Last checked {formatDateTime(record.courtCheckedAt)}</p>}
        <ErrorNote>{error}</ErrorNote>
        {record.cnrNumber && (
          <Button size="sm" tone="secondary" onClick={() => void sync()} disabled={syncing}>
            {syncing ? "Checking eCourts…" : "Check court status"}
          </Button>
        )}
      </div>
    </Card>
  );
}

/** The full court record: hearing history and orders. */
export function CourtRecordPanel({ record, onSynced }: { record: CaseDetail; onSynced: (updated: CaseDetail, message: string) => void }) {
  const { sync, syncing, error } = useCourtSync(record, onSynced);

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

  return (
    <div className="space-y-6">
      {record.cnrNumber ? (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-sm text-ink">
              CNR <span className="font-mono font-semibold">{record.cnrNumber}</span>
              {record.courtStatus && <> · <span className="font-semibold">{record.courtStatus}</span></>}
              {record.courtStage && <> · {record.courtStage}</>}
            </p>
            <p className="mt-0.5 text-xs text-slate">
              {record.courtCheckedAt ? `Last checked ${formatDateTime(record.courtCheckedAt)}` : "Not checked against eCourts yet."}
            </p>
          </div>
          <Button size="sm" onClick={() => void sync()} disabled={syncing}>
            {syncing ? "Checking eCourts…" : "Check court status"}
          </Button>
        </div>
        {error && <div className="px-5 pb-4"><ErrorNote>{error}</ErrorNote></div>}
      </Card>
      ) : (
        <p className="text-sm text-slate">No CNR on this case, so it cannot be checked against eCourts. The history below was entered by the firm.</p>
      )}

      <Card>
        <CardHeader title="Hearing history" description="Each date the matter was listed, as the court recorded it." />
        {record.hearings.length === 0 ? (
          <EmptyState title="No hearings on the court's record yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Purpose</Th>
                <Th>Judge</Th>
                <Th>Next date</Th>
              </tr>
            </thead>
            <tbody>
              {record.hearings.map((hearing) => (
                <tr key={hearing.id}>
                  <Td className="whitespace-nowrap font-semibold">{formatDate(hearing.hearingDate)}</Td>
                  <Td>
                    {hearing.purpose ?? "—"}
                    {hearing.business && <p className="mt-0.5 text-xs text-slate">{hearing.business}</p>}
                  </Td>
                  <Td className="text-xs">{hearing.judge ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-xs">{hearing.nextDate ? formatDate(hearing.nextDate) : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Orders and judgments" />
        {record.orders.length === 0 ? (
          <EmptyState title="No orders on the court's record yet" />
        ) : (
          <ul className="divide-y divide-line">
            {record.orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{order.orderType}</p>
                  {order.summary && <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{order.summary}</p>}
                  {order.fileName && <p className="mt-0.5 font-mono text-xs text-slate">{order.fileName}</p>}
                </div>
                <Badge>{formatDate(order.orderDate)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
