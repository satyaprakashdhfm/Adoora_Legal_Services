"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type ArticleRow } from "@/lib/portal/api";
import { siteUrl } from "@/lib/site";
import { Badge, Card, CardHeader, EmptyState, ErrorNote, PageTitle, Spinner, Table, Td, Th } from "@/components/portal/ui";

/**
 * SEO & Analytics. Two halves:
 *
 *  - Keywords: what the firm's articles target, from the articles themselves
 *    — works today.
 *  - Search and traffic: Google Search Console and Analytics, which need the
 *    site live on its own domain first. Until then the cards say what each
 *    one will show and what is needed to connect it.
 */

type KeywordRow = {
  keyword: string;
  focus: ArticleRow[];
  target: ArticleRow[];
  published: number;
};

function Tile({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-slate">{note}</p>}
    </div>
  );
}

function Pending({ title, children, needs }: { title: string; children: React.ReactNode; needs: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-paper-warm/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">{title}</p>
        <Badge tone="gold">After launch</Badge>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{children}</p>
      <p className="mt-3 text-xs text-slate">
        <span className="font-semibold text-ink-soft">Needs:</span> {needs}
      </p>
    </div>
  );
}

export default function SeoAnalytics() {
  const [rows, setRows] = useState<ArticleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: ArticleRow[] }>("/admin/articles")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);

  const keywords = useMemo(() => {
    const map = new Map<string, KeywordRow>();
    const entry = (keyword: string) => {
      const key = keyword.trim().toLowerCase();
      if (!map.has(key)) map.set(key, { keyword: keyword.trim(), focus: [], target: [], published: 0 });
      return map.get(key)!;
    };
    for (const row of rows ?? []) {
      if (row.status === "ARCHIVED") continue;
      const seen = new Set<string>();
      if (row.focusKeyword) {
        entry(row.focusKeyword).focus.push(row);
        seen.add(row.focusKeyword.trim().toLowerCase());
      }
      for (const keyword of row.keywords) {
        if (seen.has(keyword.trim().toLowerCase())) continue;
        entry(keyword).target.push(row);
        seen.add(keyword.trim().toLowerCase());
      }
      for (const key of seen) if (row.status === "PUBLISHED") map.get(key)!.published++;
    }
    return [...map.values()].sort((a, b) => b.focus.length + b.target.length - (a.focus.length + a.target.length) || a.keyword.localeCompare(b.keyword));
  }, [rows]);

  const published = rows?.filter((row) => row.status === "PUBLISHED") ?? [];
  const noKeyword = (rows ?? []).filter((row) => row.status !== "ARCHIVED" && !row.focusKeyword);
  /** Two articles chasing the same main search compete with each other. */
  const clashes = keywords.filter((row) => row.focus.length > 1);
  const onRailway = siteUrl.includes("railway.app") || siteUrl.includes("localhost");

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow="Website"
        title="SEO & Analytics"
        description="The searches the firm's articles target, and — once the site is live on its domain — how people find it."
      />
      <ErrorNote>{error}</ErrorNote>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-ink">Search and traffic</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Pending title="Google Search Console" needs="the site on its own domain (production), and the domain verified in Search Console — a DNS TXT record.">
            Which searches the site appears for, clicks, impressions and average position — per article and per keyword.
          </Pending>
          <Pending title="Google Analytics 4" needs="a GA4 property and its Measurement ID (G-…) added to the website, after the cookie banner's analytics consent.">
            Visitors, where they come from, which articles they read and how long for, and which lead to an enquiry.
          </Pending>
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-ink">Sitemap</p>
              <Badge tone="green">Ready</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Lists every page and published article, updated as articles are published. Submit it in Search Console after launch.
            </p>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-gold-deep underline underline-offset-2">
              {siteUrl}/sitemap.xml
            </a>
          </div>
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-ink">Site address</p>
              <Badge tone={onRailway ? "gold" : "green"}>{onRailway ? "Preview" : "Live"}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {onRailway
                ? "This is the preview address. Articles are indexed under the real domain once it goes live."
                : "Canonical links, the sitemap and article schema all point here."}
            </p>
            <p className="mt-3 break-all text-xs text-slate">{siteUrl}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold text-ink">Keywords</h2>
        {!rows ? (
          <Spinner />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <Tile label="Keywords targeted" value={keywords.length} note="Across drafts and published articles." />
              <Tile label="Published articles" value={published.length} />
              <Tile label="Without a focus keyword" value={noKeyword.length} note={noKeyword.length ? "Set one in the editor's SEO panel." : undefined} />
              <Tile label="Keyword clashes" value={clashes.length} note="Two articles with the same focus keyword compete in Google." />
            </div>

            <Card>
              <CardHeader title="Keyword coverage" description="Each keyword, and the articles that target it — as the main (focus) keyword or as another target." />
              {keywords.length === 0 ? (
                <EmptyState title="No keywords yet">Add a focus keyword and target keywords in each article’s SEO panel.</EmptyState>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Keyword</Th>
                      <Th>Focus of</Th>
                      <Th>Also targeted by</Th>
                      <Th>Live</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((row) => (
                      <tr key={row.keyword}>
                        <Td>
                          <span className="font-semibold text-ink">{row.keyword}</span>
                          {row.focus.length > 1 && (
                            <span className="ml-2">
                              <Badge tone="red">Clash</Badge>
                            </span>
                          )}
                        </Td>
                        <Td>
                          <ArticleLinks rows={row.focus} />
                        </Td>
                        <Td>
                          <ArticleLinks rows={row.target} />
                        </Td>
                        <Td className="text-sm">{row.published ? <Badge tone="green">{row.published}</Badge> : <span className="text-xs text-slate">not yet</span>}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </>
        )}
      </section>
    </div>
  );
}

function ArticleLinks({ rows }: { rows: ArticleRow[] }) {
  if (!rows.length) return <span className="text-xs text-slate">—</span>;
  return (
    <ul className="space-y-0.5">
      {rows.map((row) => (
        <li key={row.id} className="text-xs">
          <Link href={`/admin/articles/${row.id}`} className="text-ink-soft hover:text-gold-deep">
            {row.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
