"use client";

import { useState } from "react";
import { api, type SessionUser, type TimelineEntry } from "@/lib/portal/api";
import { UPDATE_KINDS } from "@/lib/portal/legal";
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { Button, EmptyState, ErrorNote, Field, Input, Select, Textarea, VisibilityBadge } from "@/components/portal/ui";

const KIND_MARK: Record<string, { label: string; className: string }> = {
  NOTE: { label: "Note", className: "bg-paper-tint text-ink-soft" },
  HEARING: { label: "Hearing", className: "bg-sky-50 text-sky-800" },
  ORDER: { label: "Order", className: "bg-gold/15 text-gold-deep" },
  FILING: { label: "Filing", className: "bg-emerald-50 text-emerald-800" },
  STATUS_CHANGE: { label: "Status", className: "bg-ink text-white" },
  DOCUMENT: { label: "Document", className: "bg-paper-tint text-ink-soft" },
};

/**
 * The case timeline. It is what keeps the two dashboards connected: a
 * lawyer's hearing entry, a status change or a client's upload all land here
 * and show on the other side the next time the page is opened.
 */
export function Timeline({
  caseReference,
  entries,
  user,
  onChange,
}: {
  caseReference: string;
  entries: TimelineEntry[];
  user: SessionUser;
  onChange: () => void;
}) {
  const staff = user.kind === "staff";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setError(null);
    try {
      await api(`/cases/${encodeURIComponent(caseReference)}/updates`, {
        method: "POST",
        body: {
          kind: data.get("kind") ?? "NOTE",
          title: data.get("title"),
          body: data.get("body"),
          eventDate: data.get("eventDate") || null,
          visibility: data.get("visibility") ?? "CLIENT",
        },
      });
      form.reset();
      onChange();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[1fr_22rem]">
      <div className="border-line lg:border-r">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-ink">Timeline</h2>
          <p className="text-sm text-slate">Hearings, orders, filings and messages, newest first.</p>
        </div>
        {entries.length === 0 ? (
          <EmptyState title="Nothing here yet" />
        ) : (
          <ol className="px-5 py-2">
            {entries.map((entry) => {
              const mark = KIND_MARK[entry.kind] ?? KIND_MARK.NOTE!;
              return (
                <li key={entry.id} className="relative border-l border-line py-3 pl-5">
                  <span className="absolute -left-[5px] top-5 h-2.5 w-2.5 rounded-full border-2 border-white bg-gold" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${mark.className}`}>{mark.label}</span>
                    <p className="font-semibold text-ink">{entry.title}</p>
                    {staff && entry.visibility === "INTERNAL" && <VisibilityBadge visibility="INTERNAL" />}
                  </div>
                  {entry.body && <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{entry.body}</p>}
                  <p className="mt-1 text-xs text-slate">
                    {entry.eventDate && <>{formatDate(entry.eventDate)} · </>}
                    {entry.authorUser?.name ?? entry.authorClient?.name ?? "System"} · logged {formatDateTime(entry.createdAt)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4 border-t border-line p-5 lg:border-t-0">
        <h3 className="font-serif text-base font-semibold text-ink">
          {staff ? "Add to the timeline" : "Send a note to your lawyers"}
        </h3>
        {staff && (
          <Field label="Type">
            <Select name="kind" defaultValue="NOTE" options={UPDATE_KINDS} />
          </Field>
        )}
        <Field label={staff ? "Title" : "Subject"} required>
          <Input name="title" required minLength={2} maxLength={200} placeholder={staff ? "e.g. Listed before Court 12; notice ordered" : "e.g. Received a notice from the bank"} />
        </Field>
        <Field label="Details">
          <Textarea name="body" rows={4} maxLength={5000} />
        </Field>
        {staff && (
          <>
            <Field label="Date of the event">
              <Input name="eventDate" type="date" />
            </Field>
            <Field label="Who can see it">
              <Select
                name="visibility"
                defaultValue="CLIENT"
                options={[
                  { value: "CLIENT", label: "Client and firm" },
                  { value: "INTERNAL", label: "Firm only" },
                ]}
              />
            </Field>
          </>
        )}
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving…" : staff ? "Add entry" : "Send note"}
        </Button>
      </form>
    </div>
  );
}
