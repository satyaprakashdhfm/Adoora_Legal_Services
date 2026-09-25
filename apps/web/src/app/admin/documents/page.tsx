"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { courtNumber, formatDate } from "@/lib/portal/format";
import { DocumentList } from "@/components/portal/document-list";
import { Button, Card, EmptyState, ErrorNote, Input, PageTitle, Spinner, StatusBadge } from "@/components/portal/ui";

/**
 * Documents, filed by case: one row per case that has any, and a case opens
 * to show its own documents — rather than one long list of every file in
 * the firm. References run per case: ALS-2026-K7Q3X9-D004 is the fourth
 * document on that case.
 */
export default function AdminDocuments() {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "100" });
    if (query.trim()) params.set("q", query.trim());
    const timer = setTimeout(() => {
      api<Page<CaseSummary>>(`/cases?${params}`, { signal: controller.signal })
        .then((page) => {
          setCases(page.data);
          setCursor(page.nextCursor);
        })
        .catch((cause: Error) => cause.name !== "AbortError" && setError(cause.message));
    }, query ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  async function loadMore() {
    if (!cursor) return;
    const params = new URLSearchParams({ limit: "100", cursor });
    if (query.trim()) params.set("q", query.trim());
    const page = await api<Page<CaseSummary>>(`/cases?${params}`);
    setCases((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  const withDocuments = (cases ?? []).filter((c) => c._count.documents > 0);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Documents"
        title="Documents by case"
        description="Open a case to see its documents, internal ones included."
      />

      <Card>
        <div className="border-b border-line p-4">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a case by reference, title, case number, CNR, party or client"
            aria-label="Search cases"
          />
        </div>
        {error && <div className="p-4"><ErrorNote>{error}</ErrorNote></div>}

        {!cases ? (
          <Spinner />
        ) : withDocuments.length === 0 ? (
          <EmptyState title={query ? "No matching case has documents" : "No documents yet"}>
            {!query && "Documents uploaded to a case appear here, under that case."}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {withDocuments.map((c) => {
              const expanded = open === c.reference;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : c.reference)}
                    aria-expanded={expanded}
                    className={`grid w-full gap-2 px-5 py-4 text-left transition hover:bg-paper-warm sm:grid-cols-[1fr_auto] sm:items-center ${expanded ? "bg-paper-warm" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-gold-deep">{c.reference}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-ink">{c.title}</p>
                      <p className="truncate text-xs text-slate">
                        {[courtNumber(c), c.courtName, `Updated ${formatDate(c.updatedAt)}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="rounded-full bg-paper-tint px-3 py-1 text-xs font-semibold text-ink">
                        {c._count.documents} document{c._count.documents === 1 ? "" : "s"}
                      </span>
                      <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 text-slate transition ${expanded ? "rotate-180" : ""}`}>
                        <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </button>

                  {expanded && (
                    <div className="space-y-3 border-t border-line bg-paper-warm px-3 pb-5 pt-3 sm:px-5">
                      <DocumentList basePath="/admin" staff caseReference={c.reference} limit={100} />
                      <Link href={`/admin/cases/${c.reference}`} className="inline-block text-sm font-semibold text-gold-deep hover:underline">
                        Open the case to upload or manage documents →
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {cursor && (
          <div className="border-t border-line p-4 text-center">
            <Button tone="secondary" size="sm" onClick={() => void loadMore()}>Load more cases</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
