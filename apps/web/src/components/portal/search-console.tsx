"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type ArticleRow, type SeoReport } from "@/lib/portal/api";
import { siteUrl } from "@/lib/site";
import { Badge, Button, Card, CardHeader, EmptyState, Spinner, Table, Td, Th } from "@/components/portal/ui";

/**
 * Google Search Console on the SEO page: for each published article, whether
 * Google has it, its average position, and how often it was shown and
 * clicked, with the searches it was shown for. The API reads Google and
 * caches for half an hour (integrations/search-console.ts).
 */

const RANGES = [7, 28, 90] as const;

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const count = (n: number) => n.toLocaleString("en-IN");
const position = (n: number) => `#${n < 10 ? n.toFixed(1) : Math.round(n)}`;
/** Top-ten positions are on Google's first page. */
const positionTone = (n: number | null) => (n !== null && n <= 10 ? "text-emerald-700" : "text-ink");

function IndexBadge({ index }: { index: SeoReport["pages"][number]["index"] }) {
  if (!index) return <Badge tone="grey">Not checked</Badge>;
  const inGoogle = index.verdict === "PASS";
  return (
    <div>
      <Badge tone={inGoogle ? "green" : index.verdict === "FAIL" ? "red" : "gold"}>{inGoogle ? "In Google" : "Not in Google yet"}</Badge>
      <p className="mt-1 text-[0.7rem] text-slate">
        {index.lastCrawl ? `Read by Google ${day(index.lastCrawl)}` : index.coverage || "Not read by Google yet"}
      </p>
    </div>
  );
}

export function SearchConsole({ articles }: { articles: ArticleRow[] | null }) {
  const [days, setDays] = useState<number>(28);
  const [report, setReport] = useState<SeoReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = useCallback(
    (range: number, fresh: boolean) =>
      api<SeoReport>(`/admin/articles/search-console?days=${range}${fresh ? "&fresh=1" : ""}`)
        .then((result) => {
          setReport(result);
          setError(null);
        })
        .catch((cause: Error) => setError(cause.message)),
    [],
  );

  useEffect(() => {
    void fetchReport(days, false);
  }, [days, fetchReport]);

  const refresh = () => {
    setRefreshing(true);
    void fetchReport(days, true).finally(() => setRefreshing(false));
  };
  /** A range picked but not loaded yet. */
  const loading = refreshing || (report !== null && report.days !== days);

  const bySlug = new Map((articles ?? []).map((article) => [`/insights/${article.slug}`, article]));

  return (
    <Card>
      <CardHeader
        title="Articles and how they are doing in Google"
        description={
          report?.connected
            ? `Each article is written for one main search, plus a few close ones. Shown, clicks and position are for ${day(report.from)} to ${day(report.to)}. Google's numbers run about two days behind.`
            : "Shown, clicks and position for each published article, from Google Search Console."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((range) => (
              <Button key={range} size="sm" tone={range === days ? "primary" : "secondary"} onClick={() => setDays(range)}>
                {range} days
              </Button>
            ))}
            <Button size="sm" tone="secondary" disabled={loading} onClick={refresh}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </div>
        }
      />

      {error ? (
        <p className="p-5 text-sm text-red-700">{error}</p>
      ) : !report ? (
        <Spinner />
      ) : !report.connected ? (
        <div className="p-5">
          <div className="rounded-xl border border-dashed border-line-strong bg-paper-warm/50 p-4">
            <div className="flex items-center gap-3">
              <p className="font-semibold text-ink">Google Search Console is not connected</p>
              <Badge tone="gold">Setup needed</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{report.problem}</p>
          </div>
        </div>
      ) : (
        <>
          {report.totals && (
            <div className="grid grid-cols-3 gap-3 p-5">
              <Total label="Shown in Google" value={count(report.totals.impressions)} />
              <Total label="Clicks" value={count(report.totals.clicks)} />
              <Total label="Average position" value={report.totals.position ? position(report.totals.position) : "—"} />
              <p className="col-span-3 text-xs text-slate">These three cover the whole site, not only the articles.</p>
            </div>
          )}
          {report.problem && <p className="px-5 pb-3 pt-3 text-xs text-red-700">{report.problem}</p>}
          {report.pages.length === 0 ? (
            <EmptyState title="No published articles yet">Numbers appear here for each article once it is published.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Article</Th>
                  <Th>Main search</Th>
                  <Th>In Google</Th>
                  <Th>Position</Th>
                  <Th>Shown · Clicks</Th>
                  <Th>Also targets</Th>
                </tr>
              </thead>
              <tbody>
                {report.pages.map((page) => {
                  const article = bySlug.get(page.path);
                  const queries = new Map(page.queries.map((query) => [query.query, query]));
                  const focus = article?.focusKeyword ? queries.get(article.focusKeyword.trim().toLowerCase()) : undefined;
                  const targets = (article?.keywords ?? []).filter((keyword) => keyword.trim().toLowerCase() !== article?.focusKeyword?.trim().toLowerCase());
                  const targeted = new Set([article?.focusKeyword ?? "", ...targets].map((keyword) => keyword.trim().toLowerCase()));
                  const others = page.queries.filter((query) => !targeted.has(query.query)).slice(0, 3);
                  return (
                    <tr key={page.path}>
                      <Td>
                        {article ? (
                          <Link href={`/admin/articles/${article.id}`} className="font-semibold text-ink hover:text-gold-deep">
                            {article.title}
                          </Link>
                        ) : (
                          <span className="font-semibold text-ink">{page.path}</span>
                        )}
                        <a href={`${siteUrl}${page.path}`} target="_blank" rel="noreferrer" className="mt-0.5 block break-all text-xs font-semibold text-gold-deep underline-offset-2 hover:underline">
                          {page.path} ↗
                        </a>
                        {article?.publishedAt && <p className="mt-0.5 text-[0.7rem] text-slate">Live since {day(article.publishedAt)}</p>}
                      </Td>
                      <Td>
                        {article?.focusKeyword ? (
                          <>
                            <span className="font-semibold text-ink">{article.focusKeyword}</span>
                            <p className="mt-0.5 text-[0.7rem] text-slate">
                              {focus ? `${position(focus.position)} for this search · ${count(focus.impressions)} shown` : "Not shown for it yet"}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate">Not set</span>
                        )}
                      </Td>
                      <Td>
                        <IndexBadge index={page.index} />
                      </Td>
                      <Td>
                        {page.position === null ? (
                          <span className="text-xs text-slate">Not shown yet</span>
                        ) : (
                          <>
                            <span className={`font-semibold ${positionTone(page.position)}`}>{position(page.position)}</span>
                            <p className="mt-0.5 text-[0.7rem] text-slate">over {page.queries.length} searches</p>
                          </>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <span className="font-semibold text-ink">{count(page.impressions)}</span> shown · <span className="font-semibold text-ink">{count(page.clicks)}</span> clicks
                      </Td>
                      <Td>
                        {targets.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {targets.map((keyword) => {
                              const seen = queries.get(keyword.trim().toLowerCase());
                              return (
                                <span key={keyword} className="rounded-full bg-paper-tint px-2.5 py-1 text-xs font-semibold text-ink-soft">
                                  {keyword}
                                  {seen && <span className={`ml-1.5 ${positionTone(seen.position)}`}>{position(seen.position)}</span>}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {others.length > 0 && (
                          <p className="mt-2 text-[0.7rem] text-slate">
                            Google also shows it for: {others.map((query) => `${query.query} ${position(query.position)}`).join(", ")}
                          </p>
                        )}
                        {!targets.length && !others.length && <span className="text-xs text-slate">—</span>}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </>
      )}
    </Card>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
