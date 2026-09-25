"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Page } from "@/lib/portal/api";
import { formatDateTime } from "@/lib/portal/format";
import { Button, Card, EmptyState, ErrorNote, Field, Input, Modal, PageTitle, Select, Spinner, Table, Td, Textarea, Th } from "@/components/portal/ui";

type Enquiry = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  matterType: string;
  description: string;
  status: string;
  assignedTo: string | null;
  internalNote: string | null;
  createdAt: string;
};

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "CONFLICT_CHECK", label: "Conflict check" },
  { value: "ENGAGED", label: "Engaged" },
  { value: "DECLINED", label: "Declined" },
  { value: "CLOSED", label: "Closed" },
];

export default function AdminEnquiries() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [open, setOpen] = useState<Enquiry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Page<Enquiry>>(`/admin/enquiries?limit=50${status ? `&status=${status}` : ""}`)
      .then((page) => {
        setRows(page.data);
        setCursor(page.nextCursor);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [status]);

  useEffect(load, [load]);

  async function more() {
    if (!cursor) return;
    const page = await api<Page<Enquiry>>(`/admin/enquiries?limit=50&cursor=${cursor}${status ? `&status=${status}` : ""}`);
    setRows((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!open) return;
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try {
      await api(`/admin/enquiries/${open.id}`, { method: "PATCH", body: data });
      setOpen(null);
      load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Website enquiries"
        description="From the contact form on the public website, sent by people who are not clients yet. Questions from signed-in clients are under Client queries. An enquiry is not a client: run the conflicts check before engaging, then open a case and add the client."
      />
      <Card>
        <div className="border-b border-line p-4 sm:max-w-xs">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUSES} />
        </div>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No enquiries" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Received</Th>
                <Th>From</Th>
                <Th>Type of case</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td className="text-xs">
                    <span className="font-mono text-gold-deep">{row.reference}</span>
                    <br />
                    {formatDateTime(row.createdAt)}
                  </Td>
                  <Td className="text-xs">
                    <p className="text-sm font-semibold">{row.name}</p>
                    {row.email}<br />{row.phone}
                  </Td>
                  <Td>
                    <p className="text-sm">{row.matterType}</p>
                    <p className="line-clamp-2 max-w-md text-xs text-slate">{row.description}</p>
                  </Td>
                  <Td className="text-xs">
                    {STATUSES.find((s) => s.value === row.status)?.label}
                    {row.assignedTo && <p className="text-slate">→ {row.assignedTo}</p>}
                  </Td>
                  <Td className="text-right">
                    <Button tone="secondary" size="sm" onClick={() => setOpen(row)}>Open</Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {cursor && (
          <div className="border-t border-line p-4 text-center">
            <Button tone="secondary" size="sm" onClick={() => void more()}>Load more</Button>
          </div>
        )}
      </Card>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.reference} — ${open.name}` : ""} wide>
        {open && (
          <form onSubmit={save} className="space-y-4">
            <div className="rounded-lg bg-paper-warm p-4 text-sm">
              <p className="text-xs text-slate">{open.email} · {open.phone} · {open.matterType}</p>
              <p className="mt-2 whitespace-pre-line text-ink">{open.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                <Select name="status" defaultValue={open.status} options={STATUSES} />
              </Field>
              <Field label="Assigned to">
                <Input name="assignedTo" defaultValue={open.assignedTo ?? ""} />
              </Field>
            </div>
            <Field label="Internal note" hint="Never shown to the enquirer.">
              <Textarea name="internalNote" defaultValue={open.internalNote ?? ""} rows={4} />
            </Field>
            <Button type="submit">Save</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
