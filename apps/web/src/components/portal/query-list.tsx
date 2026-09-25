"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type CaseSummary, type ClientQuery, type Page } from "@/lib/portal/api";
import { formatDateTime } from "@/lib/portal/format";
import { Badge, Button, Card, EmptyState, ErrorNote, Field, Input, Modal, Select, Spinner, Textarea } from "@/components/portal/ui";

const STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "ANSWERED", label: "Answered" },
  { value: "CLOSED", label: "Closed" },
];

function StatusChip({ status }: { status: ClientQuery["status"] }) {
  return <Badge tone={status === "OPEN" ? "gold" : status === "ANSWERED" ? "green" : "grey"}>{STATUSES.find((s) => s.value === status)?.label}</Badge>;
}

/** A client raising a question, optionally about one of their matters. */
export function RaiseQueryButton({ onRaised }: { onRaised: () => void }) {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api<Page<CaseSummary>>("/cases?limit=100").then((page) => setCases(page.data)).catch(() => undefined);
  }, [open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setSaving(true);
    setError(null);
    try {
      await api("/queries", { method: "POST", body: data });
      setOpen(false);
      onRaised();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Raise a query</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Raise a query">
        {open && (
          <form onSubmit={submit} className="space-y-4">
            <Field label="About which matter?">
              <Select
                name="caseReference"
                defaultValue=""
                placeholder="A general question"
                options={cases.map((c) => ({ value: c.reference, label: `${c.title} · ${c.reference}` }))}
              />
            </Field>
            <Field label="Subject" required>
              <Input name="subject" required minLength={3} maxLength={200} />
            </Field>
            <Field label="Your question" required hint="Your lawyers reply here, on your dashboard.">
              <Textarea name="message" required minLength={10} maxLength={5000} rows={5} />
            </Field>
            <ErrorNote>{error}</ErrorNote>
            <Button type="submit" disabled={saving}>{saving ? "Sending…" : "Send query"}</Button>
          </form>
        )}
      </Modal>
    </>
  );
}

/**
 * Client queries. `staff` shows who asked and lets the firm reply; a client
 * sees their own questions and the firm's answers.
 */
export function QueryList({ staff, basePath, refreshKey }: { staff: boolean; basePath: string; refreshKey?: number }) {
  const [status, setStatus] = useState(staff ? "OPEN" : "");
  const [rows, setRows] = useState<ClientQuery[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answering, setAnswering] = useState<ClientQuery | null>(null);

  const load = useCallback(() => {
    api<Page<ClientQuery>>(`/queries?limit=50${status ? `&status=${status}` : ""}`)
      .then((page) => {
        setRows(page.data);
        setCursor(page.nextCursor);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [status]);

  useEffect(load, [load, refreshKey]);

  async function more() {
    if (!cursor) return;
    const page = await api<Page<ClientQuery>>(`/queries?limit=50&cursor=${cursor}${status ? `&status=${status}` : ""}`);
    setRows((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  async function reply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answering) return;
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try {
      await api(`/queries/${answering.id}`, { method: "PATCH", body: { reply: data.reply, status: data.status } });
      setAnswering(null);
      load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <Card>
      <div className="border-b border-line p-4 sm:max-w-xs">
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All queries" options={STATUSES} />
      </div>
      {error && <div className="p-4"><ErrorNote>{error}</ErrorNote></div>}

      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title={status === "OPEN" ? "No open queries" : "No queries yet"}>
          {staff ? "Questions clients raise from their dashboard appear here." : "Ask your lawyers anything about your matters — the answer appears here."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((q) => (
            <li key={q.id} className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-gold-deep">{q.reference}</span>
                    <StatusChip status={q.status} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-ink">{q.subject}</p>
                  <p className="text-xs text-slate">
                    {[staff ? `${q.client.name} (${q.client.email})` : null, formatDateTime(q.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                  {q.case && (
                    <Link href={`${basePath}/cases/${q.case.reference}`} className="mt-0.5 inline-block text-xs text-gold-deep hover:underline">
                      {q.case.title} · {q.case.reference}
                    </Link>
                  )}
                </div>
                {staff && (
                  <Button tone="secondary" size="sm" onClick={() => setAnswering(q)}>
                    {q.reply ? "Edit reply" : "Reply"}
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{q.message}</p>
              {q.reply && (
                <div className="rounded-lg border border-line bg-paper-warm px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                    Reply{q.answeredBy ? ` from ${q.answeredBy.name}` : ""}{q.answeredAt ? ` · ${formatDateTime(q.answeredAt)}` : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">{q.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {cursor && (
        <div className="border-t border-line p-4 text-center">
          <Button tone="secondary" size="sm" onClick={() => void more()}>Load more</Button>
        </div>
      )}

      <Modal open={answering !== null} onClose={() => setAnswering(null)} title={answering ? `Reply to ${answering.reference}` : "Reply"}>
        {answering && (
          <form onSubmit={reply} className="space-y-4">
            <div className="rounded-lg border border-line bg-paper-warm px-4 py-3 text-sm">
              <p className="font-semibold text-ink">{answering.subject}</p>
              <p className="mt-1 whitespace-pre-line text-ink-soft">{answering.message}</p>
            </div>
            <Field label="Reply" hint="The client sees this on their dashboard.">
              <Textarea name="reply" rows={6} maxLength={5000} defaultValue={answering.reply ?? ""} />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={answering.status === "OPEN" ? "ANSWERED" : answering.status} options={STATUSES} />
            </Field>
            <Button type="submit">Save</Button>
          </form>
        )}
      </Modal>
    </Card>
  );
}
