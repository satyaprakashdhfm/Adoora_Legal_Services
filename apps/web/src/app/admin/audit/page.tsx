"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Page } from "@/lib/portal/api";
import { formatDateTime } from "@/lib/portal/format";
import { Badge, Button, Card, EmptyState, ErrorNote, PageTitle, Select, Spinner, Table, Td, Th } from "@/components/portal/ui";

type Entry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
  actorClient: { name: string; email: string } | null;
};

const FILTERS = [
  { value: "document.download", label: "Document downloads" },
  { value: "document", label: "All document activity" },
  { value: "case", label: "Case activity" },
  { value: "auth", label: "Sign-ins and sign-outs" },
  { value: "user", label: "Staff changes" },
  { value: "client", label: "Client changes" },
  { value: "enquiry", label: "Enquiries" },
];

/** Summarise the metadata without dumping JSON at the reader. */
function describe(entry: Entry): string {
  const meta = entry.metadata ?? {};
  const parts = [meta.reference, meta.case, meta.version ? `v${meta.version}` : null, meta.method].filter(Boolean);
  return parts.join(" · ");
}

export default function AdminAudit() {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Page<Entry>>(`/admin/audit?limit=100${filter ? `&action=${filter}` : ""}`)
      .then((page) => {
        setRows(page.data);
        setCursor(page.nextCursor);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [filter]);

  useEffect(load, [load]);

  async function more() {
    if (!cursor) return;
    const page = await api<Page<Entry>>(`/admin/audit?limit=100&cursor=${cursor}${filter ? `&action=${filter}` : ""}`);
    setRows((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Audit log"
        title="Who did what, and when"
        description="Append-only. Every sign-in, case change, upload and document download — by staff and by clients — is recorded here."
      />
      <Card>
        <div className="border-b border-line p-4 sm:max-w-xs">
          <Select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="All activity" options={FILTERS} />
        </div>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing recorded" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Action</Th>
                <Th>Detail</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const who = row.actor ?? row.actorClient;
                return (
                  <tr key={row.id}>
                    <Td className="whitespace-nowrap text-xs">{formatDateTime(row.createdAt)}</Td>
                    <Td className="text-xs">
                      {who ? (
                        <>
                          <p className="text-sm font-semibold">{who.name}</p>
                          <p className="text-slate">{who.email}</p>
                          <Badge tone={row.actor ? "blue" : "gold"}>{row.actor ? "Staff" : "Client"}</Badge>
                        </>
                      ) : (
                        <span className="text-slate">System</span>
                      )}
                    </Td>
                    <Td className="font-mono text-xs">{row.action}</Td>
                    <Td className="text-xs">{describe(row) || <span className="text-slate">{row.entityType}</span>}</Td>
                    <Td className="font-mono text-xs text-slate">{row.ipAddress ?? "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {cursor && (
          <div className="border-t border-line p-4 text-center">
            <Button tone="secondary" size="sm" onClick={() => void more()}>Load more</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
