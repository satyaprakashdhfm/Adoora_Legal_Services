"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { CASE_STATUSES, COURT_LEVELS, labelFor } from "@/lib/portal/legal";
import { courtNumber, daysUntil, formatDate, hearingCountdown } from "@/lib/portal/format";
import { Button, Card, EmptyState, ErrorNote, Spinner, StatusBadge } from "@/components/portal/ui";
import { ListToolbar } from "@/components/portal/list-toolbar";

const HEARING_FILTER = [
  { value: "week", label: "Within 7 days" },
  { value: "month", label: "Within 30 days" },
  { value: "none", label: "None listed" },
] as const;

const CASE_SORT = [
  { value: "updated", label: "Recently updated" },
  { value: "next-hearing", label: "Next hearing, soonest" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title, A to Z" },
] as const;

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
  const [hearing, setHearing] = useState("");
  const [sort, setSort] = useState("updated");
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (court) params.set("courtLevel", court);
    if (hearing) params.set("hearing", hearing);
    if (sort !== "updated") params.set("sort", sort);
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
  }, [query, status, court, hearing, sort, limit]);

  async function loadMore() {
    if (!cursor) return;
    const params = new URLSearchParams({ cursor });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (court) params.set("courtLevel", court);
    if (hearing) params.set("hearing", hearing);
    if (sort !== "updated") params.set("sort", sort);
    const page = await api<Page<CaseSummary>>(`/cases?${params}`);
    setCases((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  return (
    <Card>
      {!compact && (
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            placeholder: staff ? "Search reference, title, case no., CNR, party or client" : "Search your cases",
          }}
          filters={[
            { key: "status", label: "Status", value: status, options: CASE_STATUSES, onChange: setStatus },
            ...(staff ? [{ key: "court", label: "Forum", value: court, options: COURT_LEVELS, onChange: setCourt }] : []),
            { key: "hearing", label: "Next hearing", value: hearing, options: HEARING_FILTER, onChange: setHearing },
          ]}
          sort={{ value: sort, options: CASE_SORT, onChange: setSort }}
          count={cases ? `${cases.length}${cursor ? "+" : ""} case${cases.length === 1 ? "" : "s"}` : undefined}
          onReset={() => {
            setQuery("");
            setStatus("");
            setCourt("");
            setHearing("");
          }}
        />
      )}

      {error && <div className="p-4"><ErrorNote>{error}</ErrorNote></div>}

      {!cases ? (
        <Spinner />
      ) : cases.length === 0 ? (
        <EmptyState title={query || status || court || hearing ? "No matching cases" : "No cases yet"} action={emptyAction}>
          {!staff && !query && !status && !emptyAction && "When the firm links a case to your account, it appears in this list."}
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
                  className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 transition hover:bg-paper-warm sm:px-5 md:grid-cols-[minmax(0,1fr)_9rem_10rem] md:gap-x-6 md:gap-y-2"
                >
                  <div className="col-span-2 min-w-0 md:col-span-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gold-deep">{item.reference}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 font-semibold text-ink md:line-clamp-1">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate">
                      {[number, item.courtName ?? labelFor(COURT_LEVELS, item.courtLevel), item.bench].filter(Boolean).join(" · ")}
                    </p>
                    {staff && item.clients && item.clients.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-ink-soft">Client: {item.clients.map((c) => c.client.name).join(", ")}</p>
                    )}
                  </div>

                  <div className="min-w-0 text-xs">
                    <p className="portal-label font-semibold uppercase tracking-wide text-slate">Next hearing</p>
                    {item.nextHearingDate && days !== null && days >= 0 ? (
                      <>
                        <p
                          className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-sm font-semibold ${
                            days <= 7 ? "bg-gold text-ink-deep" : "bg-gold/15 text-gold-deep ring-1 ring-gold/30"
                          }`}
                        >
                          {formatDate(item.nextHearingDate)}
                        </p>
                        <p className="mt-0.5 text-slate">{hearingCountdown(days)}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-ink">{item.nextHearingDate ? formatDate(item.nextHearingDate) : "—"}</p>
                    )}
                  </div>

                  <div className="min-w-0 text-xs">
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
