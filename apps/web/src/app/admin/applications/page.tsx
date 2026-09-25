"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Page } from "@/lib/portal/api";
import { formatDateTime } from "@/lib/portal/format";
import { Button, Card, EmptyState, ErrorNote, Field, Modal, PageTitle, Select, Spinner, Table, Td, Textarea, Th } from "@/components/portal/ui";

type Application = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  experience: string;
  enrolment: string | null;
  message: string;
  status: string;
  internalNote: string | null;
  createdAt: string;
};

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export default function AdminApplications() {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Application[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [open, setOpen] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Page<Application>>(`/admin/applications?limit=50${status ? `&status=${status}` : ""}`)
      .then((page) => {
        setRows(page.data);
        setCursor(page.nextCursor);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [status]);

  useEffect(load, [load]);

  async function more() {
    if (!cursor) return;
    const page = await api<Page<Application>>(`/admin/applications?limit=50&cursor=${cursor}${status ? `&status=${status}` : ""}`);
    setRows((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!open) return;
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try {
      await api(`/admin/applications/${open.id}`, { method: "PATCH", body: data });
      setOpen(null);
      load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Careers" title="Applications" description="From the careers page. Candidates email their CV quoting the reference." />
      <Card>
        <div className="border-b border-line p-4 sm:max-w-xs">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUSES} />
        </div>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No applications" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Received</Th>
                <Th>Candidate</Th>
                <Th>Role</Th>
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
                  <Td className="text-sm">
                    {row.role}
                    <p className="text-xs text-slate">{row.experience}{row.enrolment ? ` · ${row.enrolment}` : ""}</p>
                  </Td>
                  <Td className="text-xs">{STATUSES.find((s) => s.value === row.status)?.label}</Td>
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
              <p className="text-xs text-slate">{open.role} · {open.experience} · {open.email} · {open.phone}</p>
              <p className="mt-2 whitespace-pre-line text-ink">{open.message}</p>
            </div>
            <Field label="Status">
              <Select name="status" defaultValue={open.status} options={STATUSES} />
            </Field>
            <Field label="Internal note">
              <Textarea name="internalNote" defaultValue={open.internalNote ?? ""} rows={4} />
            </Field>
            <Button type="submit">Save</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
