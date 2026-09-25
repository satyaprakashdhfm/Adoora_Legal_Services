"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { CASE_STATUSES, COURT_LEVELS, labelFor } from "@/lib/portal/legal";
import { courtNumber, daysUntil, formatDate } from "@/lib/portal/format";
import { Button, Card, EmptyState, ErrorNote, Input, Select, Spinner, StatusBadge } from "@/components/portal/ui";

/** Searchable case list. `staff` adds the client column and court filter. */
export function CaseList({
  basePath,
  staff,
  emptyAction,
  limit,
  compact,
}: {
  basePath: string;
  staff: boolean;
  emptyAction?: React.ReactNode;
  limit?: number;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [court, setCourt] = useState("");
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (court) params.set("courtLevel", court);
    if (limit) params.set("limit", String(limit));

    // Debounce typing in the search box.
    const timer = setTimeout(() => {
      api<Page<CaseSummary>>(`/cases?${params}`, { signal: controller.signal })
        .then((page) => {
          setCases(page.data);
          setCursor(page.nextCursor);
          setError(null);
        })
        .catch((cause: Error) => {
          if (cause.name !== "AbortError") setError(cause.message);
        });
    }, query ? 250 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, status, court, limit]);

  async function loadMore() {
    if (!cursor) return;
    const params = new URLSearchParams({ cursor });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (court) params.set("courtLevel", court);
    const page = await api<Page<CaseSummary>>(`/cases?${params}`);
    setCases((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  return (
    <Card>
      {!compact && (
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_11rem] lg:grid-cols-[1fr_11rem_15rem]">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={staff ? "Search reference, title, case no., CNR, party or client" : "Search your cases"}
            aria-label="Search cases"
          />
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={CASE_STATUSES} />
          {staff && (
            <Select aria-label="Forum" value={court} onChange={(e) => setCourt(e.target.value)} placeholder="All forums" options={COURT_LEVELS} className="max-sm:col-span-full" />
          )}
        </div>
      )}

      {error && <div className="p-4"><ErrorNote>{error}</ErrorNote></div>}

      {!cases ? (
        <Spinner />
      ) : cases.length === 0 ? (
        <EmptyState title={query || status || court ? "No matching cases" : "No cases yet"} action={emptyAction}>
          {!staff && !query && !status && "When the firm opens a case for you, or you add one here, it appears in this list."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {cases.map((item) => {
            const number = courtNumber(item);
            const days = daysUntil(item.nextHearingDate);
            const lead = item.assignments.find((a) => a.role === "LEAD") ?? item.assignments[0];

            return (
              <li key={item.id}>
                <Link
                  href={`${basePath}/cases/${item.reference}`}
                  className="grid gap-x-6 gap-y-2 px-5 py-4 transition hover:bg-paper-warm md:grid-cols-[minmax(0,1fr)_9rem_10rem]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gold-deep">{item.reference}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 truncate font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate">
                      {[number, item.courtName ?? labelFor(COURT_LEVELS, item.courtLevel), item.bench].filter(Boolean).join(" · ")}
                    </p>
                    {staff && item.clients && item.clients.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-ink-soft">Client: {item.clients.map((c) => c.client.name).join(", ")}</p>
                    )}
                  </div>

                  <div className="text-xs">
                    <p className="portal-label font-semibold uppercase tracking-wide text-slate">Next hearing</p>
                    <p className={`mt-1 text-sm ${days !== null && days >= 0 && days <= 7 ? "font-semibold text-gold-deep" : "text-ink"}`}>
                      {item.nextHearingDate ? formatDate(item.nextHearingDate) : "—"}
                    </p>
                  </div>

                  <div className="text-xs">
                    <p className="portal-label font-semibold uppercase tracking-wide text-slate">{lead ? "Lead" : "Team"}</p>
                    <p className="mt-1 truncate text-sm text-ink">{lead?.user.name ?? (staff ? "Unassigned" : "Being assigned")}</p>
                    <p className="text-slate">{item._count.documents} document{item._count.documents === 1 ? "" : "s"}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {cursor && !compact && (
        <div className="border-t border-line p-4 text-center">
          <Button tone="secondary" size="sm" onClick={() => void loadMore()}>Load more</Button>
        </div>
      )}
    </Card>
  );
}
