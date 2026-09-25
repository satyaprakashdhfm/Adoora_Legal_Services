"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, downloadUrl, type DocumentRecord, type Page } from "@/lib/portal/api";
import { DOCUMENT_CATEGORIES, labelFor } from "@/lib/portal/legal";
import { formatBytes, formatDate } from "@/lib/portal/format";
import { Badge, Button, Card, EmptyState, ErrorNote, Input, Select, Spinner, Table, Td, Th, VisibilityBadge } from "@/components/portal/ui";

/**
 * Every document the caller can see, across their cases. `compact` drops the
 * filters and paging (the overview's "Recent documents"); `refreshKey`
 * refetches when it changes, e.g. after an upload.
 */
export function DocumentList({
  basePath,
  staff,
  compact,
  limit,
  refreshKey,
  emptyAction,
}: {
  basePath: string;
  staff: boolean;
  compact?: boolean;
  limit?: number;
  refreshKey?: number;
  emptyAction?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [documents, setDocuments] = useState<DocumentRecord[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (limit) params.set("limit", String(limit));

    const timer = setTimeout(() => {
      api<Page<DocumentRecord>>(`/documents?${params}`, { signal: controller.signal })
        .then((page) => {
          setDocuments(page.data);
          setCursor(page.nextCursor);
        })
        .catch((cause: Error) => {
          if (cause.name !== "AbortError") setError(cause.message);
        });
    }, query ? 250 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category, limit, refreshKey]);

  async function loadMore() {
    if (!cursor) return;
    const params = new URLSearchParams({ cursor });
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    const page = await api<Page<DocumentRecord>>(`/documents?${params}`);
    setDocuments((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  return (
    <Card>
      {!compact && (
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_16rem]">
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by reference, title, file name or case" aria-label="Search documents" />
          <Select aria-label="Type" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All types" options={DOCUMENT_CATEGORIES} />
        </div>
      )}

      {error && <div className="p-4"><ErrorNote>{error}</ErrorNote></div>}

      {!documents ? (
        <Spinner />
      ) : documents.length === 0 ? (
        <EmptyState title={query || category ? "No matching documents" : "No documents yet"} action={query || category ? undefined : emptyAction}>
          {!query && !category && (staff ? "Documents uploaded to your cases appear here." : "Documents you upload, and those the firm shares with you, appear here.")}
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Document</Th>
              <Th>Case</Th>
              <Th>Type</Th>
              <Th>Uploaded</Th>
              <Th className="text-right">File</Th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const latest = doc.versions[0];
              return (
                <tr key={doc.id}>
                  <Td>
                    <p className="font-semibold">{doc.title}</p>
                    <p className="font-mono text-xs text-slate">{doc.reference}</p>
                    <div className="mt-1 flex gap-1.5">
                      {doc.currentVersion > 1 && <Badge tone="gold">v{doc.currentVersion}</Badge>}
                      {staff && <VisibilityBadge visibility={doc.visibility} />}
                    </div>
                  </Td>
                  <Td>
                    {doc.case && (
                      <Link href={`${basePath}/cases/${doc.case.reference}`} className="hover:text-gold-deep">
                        <span className="block max-w-[16rem] truncate">{doc.case.title}</span>
                        <span className="font-mono text-xs text-slate">{doc.case.reference}</span>
                      </Link>
                    )}
                  </Td>
                  <Td className="text-xs">{labelFor(DOCUMENT_CATEGORIES, doc.category)}</Td>
                  <Td className="text-xs">
                    {doc.uploadedByUser?.name ?? doc.uploadedByClient?.name ?? "—"}
                    <br />
                    <span className="text-slate">{formatDate(doc.createdAt)}</span>
                  </Td>
                  <Td className="text-right text-xs">
                    {latest && /^(application\/pdf|image\/(png|jpeg|webp))$/.test(latest.mimeType) && (
                      <a href={downloadUrl(doc.reference, { inline: true })} target="_blank" rel="noopener" className="mr-3 font-semibold text-gold-deep hover:underline">View</a>
                    )}
                    <a href={downloadUrl(doc.reference)} className="font-semibold text-gold-deep hover:underline">Download</a>
                    {latest && <p className="mt-0.5 text-slate">{formatBytes(latest.sizeBytes)}</p>}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {cursor && !compact && (
        <div className="border-t border-line p-4 text-center">
          <Button tone="secondary" size="sm" onClick={() => void loadMore()}>Load more</Button>
        </div>
      )}
    </Card>
  );
}
