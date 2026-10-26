"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ArticleRow, type ArticleStatus, type SeoReport } from "@/lib/portal/api";

import { ListToolbar } from "@/components/portal/list-toolbar";

const ARTICLE_SORT = [
  { value: "updated", label: "Recently edited" },
  { value: "published", label: "Recently published" },
  { value: "newest", label: "Newest created" },
  { value: "title", label: "Title, A to Z" },
] as const;
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { siteUrl } from "@/lib/site";
import { STATUS_LABEL } from "@/components/portal/article-editor";
import { HowItWorks, TrendingLeads, UrgentBanner, usePipeline, WriteNowDialog } from "@/components/portal/trending";
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorNote, PageTitle, Spinner, Table, Td, Th } from "@/components/portal/ui";

const TONE: Record<ArticleStatus, "gold" | "blue" | "green" | "grey"> = {
  DRAFT: "gold",
  REVIEW: "blue",
  PUBLISHED: "green",
  ARCHIVED: "grey",
};

const FILTERS: { value: ArticleStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "REVIEW", label: "In review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function AdminArticles() {
  const router = useRouter();
  const [rows, setRows] = useState<ArticleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ArticleStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("updated");
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"articles" | "trending">("articles");
  const [writing, setWriting] = useState(false);
  const pipeline = usePipeline();

  const load = useCallback(() => {
    api<{ data: ArticleRow[] }>("/admin/articles")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(load, [load]);

  /** Search Console's last 28 days for the published articles; null until it answers. */
  const [google, setGoogle] = useState<SeoReport | null>(null);
  useEffect(() => {
    api<SeoReport>("/admin/articles/search-console?days=28")
      .then(setGoogle)
      .catch(() => undefined);
  }, []);
  const googleByPath = useMemo(() => new Map((google?.pages ?? []).map((page) => [page.path, page])), [google]);

  async function create() {
    setCreating(true);
    try {
      const created = await api<{ id: string }>("/admin/articles", { method: "POST", body: { title: "Untitled article" } });
      router.push(`/admin/articles/${created.id}`);
    } catch (cause) {
      setError((cause as Error).message);
      setCreating(false);
    }
  }

  async function remove(row: ArticleRow) {
    if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`)) return;
    setError(null);
    try {
      await api(`/admin/articles/${row.id}`, { method: "DELETE" });
      setRows((current) => (current ?? []).filter((item) => item.id !== row.id));
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: rows?.length ?? 0 };
    for (const row of rows ?? []) result[row.status] = (result[row.status] ?? 0) + 1;
    return result;
  }, [rows]);

  const categories = [...new Set((rows ?? []).map((row) => row.category))].sort().map((value) => ({ value, label: value }));
  const shown = (rows ?? [])
    .filter(
      (row) =>
        (filter === "ALL" || row.status === filter) &&
        (!category || row.category === category) &&
        (!query.trim() ||
          `${row.title} ${row.focusKeyword ?? ""} ${row.keywords.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())),
    )
    .sort((a, b) =>
      sort === "published"
        ? (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
        : sort === "newest"
          ? b.createdAt.localeCompare(a.createdAt)
          : sort === "title"
            ? a.title.localeCompare(b.title)
            : b.updatedAt.localeCompare(a.updatedAt),
    );

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Articles"
        description="Insights and judgment write-ups for the website. Drafts stay private until published; published articles appear on the Insights page and in Google."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button tone="secondary" onClick={() => void create()} disabled={creating}>
              {creating ? "Creating…" : "Blank article"}
            </Button>
            <Button onClick={() => setWriting(true)}>Write now (AI)</Button>
          </div>
        }
      />

      <UrgentBanner count={pipeline?.urgent ?? 0} onOpen={() => setTab("trending")} />
      <HowItWorks pipeline={pipeline} />

      <div className="flex gap-1 border-b border-line">
        {(
          [
            ["articles", "Articles"],
            ["trending", `Trending judgments${pipeline?.urgent ? ` (${pipeline.urgent} urgent)` : ""}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === value ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <WriteNowDialog key={writing ? "open" : "closed"} open={writing} onClose={() => setWriting(false)} pipeline={pipeline} />

      {tab === "trending" ? (
        <TrendingLeads pipeline={pipeline} />
      ) : (
      <>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === option.value ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-line-strong"
              }`}
            >
              {option.label} <span className="opacity-60">{counts[option.value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        <ListToolbar
          search={{ value: query, onChange: setQuery, placeholder: "Search title or keyword" }}
          filters={[{ key: "category", label: "Category", value: category, options: categories, onChange: setCategory }]}
          sort={{ value: sort, options: ARTICLE_SORT, onChange: setSort }}
          count={rows ? `${shown.length} of ${rows.length} article${rows.length === 1 ? "" : "s"}` : undefined}
          onReset={() => {
            setQuery("");
            setCategory("");
            setFilter("ALL");
          }}
        />
        {google && (
          <p className="border-b border-line px-5 py-2.5 text-xs text-slate">
            {google.connected
              ? `Google's numbers are from Search Console, ${formatDate(google.from)} to ${formatDate(google.to)} (about two days behind), refreshed every half hour.`
              : `Google's numbers are not showing: ${google.problem}`}
          </p>
        )}
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No articles yet" action={<Button onClick={() => void create()}>Write the first article</Button>}>
            The Insights page shows the firm’s bundled articles until you publish your own here.
          </EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState title="Nothing matches" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Page</Th>
                <Th>Main search</Th>
                <Th>In Google</Th>
                <Th>Position</Th>
                <Th>Shown · Clicks</Th>
                <Th>Also targets</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const live = row.status === "PUBLISHED";
                const path = `/insights/${row.slug}`;
                const page = live ? googleByPath.get(path) : undefined;
                const queries = new Map((page?.queries ?? []).map((query) => [query.query, query]));
                const focus = row.focusKeyword?.trim().toLowerCase() ?? "";
                const targets = row.keywords.filter((keyword) => keyword.trim().toLowerCase() !== focus);
                const targeted = new Set([focus, ...targets.map((keyword) => keyword.trim().toLowerCase())]);
                const others = (page?.queries ?? []).filter((query) => !targeted.has(query.query)).slice(0, 3);
                return (
                  <tr key={row.id} className="align-top hover:bg-paper-warm/60">
                    <Td className="min-w-[16rem]">
                      <Link href={`/admin/articles/${row.id}`} className="font-semibold text-ink hover:text-gold-deep">
                        {row.title}
                      </Link>
                      {live ? (
                        <a href={`${siteUrl}${path}`} target="_blank" rel="noreferrer" className="mt-0.5 block break-all text-xs font-semibold text-gold-deep hover:underline">
                          {path} ↗
                        </a>
                      ) : (
                        <p className="mt-0.5 break-all text-xs text-slate">{path}</p>
                      )}
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate">
                        <Badge tone={TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                        {live && row.publishedAt ? `live since ${formatDate(row.publishedAt)}` : `edited ${formatDateTime(row.updatedAt)}`}
                      </p>
                      <p className="mt-1 text-xs text-slate">
                        {row.source === "PIPELINE" ? (
                          <span className="font-semibold text-sky-700">AI draft</span>
                        ) : (
                          <span className="font-semibold text-emerald-700">Written by us</span>
                        )}
                        {` · ${row.category}`}
                        {row.readingTime ? ` · ${row.readingTime}` : ""}
                      </p>
                    </Td>
                    <Td>
                      {row.focusKeyword ? <span className="font-semibold text-ink">{row.focusKeyword}</span> : <span className="text-xs text-slate">Not set</span>}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {!live ? (
                        <span className="text-xs text-slate">Not live</span>
                      ) : !page?.index ? (
                        <span className="text-xs text-slate">—</span>
                      ) : (
                        <>
                          <Badge tone={page.index.verdict === "PASS" ? "green" : "gold"}>{page.index.verdict === "PASS" ? "In Google" : "Not yet"}</Badge>
                          <p className="mt-1 text-xs text-slate">
                            {page.index.lastCrawl ? `Read by Google ${formatDate(page.index.lastCrawl)}` : "Not read by Google yet"}
                          </p>
                        </>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {page && page.position !== null ? (
                        <>
                          <span className={`font-semibold ${page.position <= 10 ? "text-emerald-700" : "text-ink"}`}>{rank(page.position)}</span>
                          <p className="mt-0.5 text-xs text-slate">
                            avg over {page.queries.length} search{page.queries.length === 1 ? "" : "es"}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-slate">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-sm">
                      {page ? (
                        <>
                          <span className="font-semibold text-ink">{page.impressions.toLocaleString("en-IN")}</span> shown ·{" "}
                          <span className="font-semibold text-ink">{page.clicks.toLocaleString("en-IN")}</span> clicks
                        </>
                      ) : (
                        <span className="text-xs text-slate">—</span>
                      )}
                    </Td>
                    <Td className="min-w-[14rem]">
                      {targets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {targets.map((keyword) => {
                            const seen = queries.get(keyword.trim().toLowerCase());
                            return (
                              <span key={keyword} className="rounded-full bg-paper-tint px-2.5 py-1 text-xs font-semibold text-ink-soft">
                                {keyword}
                                {seen && <span className={`ml-1.5 ${seen.position <= 10 ? "text-emerald-700" : "text-slate"}`}>{rank(seen.position)}</span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {others.length > 0 && (
                        <p className="mt-2 text-xs text-slate">
                          Google also shows it for: {others.map((query) => `${query.query} ${rank(query.position)}`).join(", ")}
                        </p>
                      )}
                      {!targets.length && !others.length && <span className="text-xs text-slate">—</span>}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <ButtonLink size="sm" tone="secondary" href={`/admin/articles/${row.id}`}>
                          Edit
                        </ButtonLink>
                        <Button size="sm" tone="danger" onClick={() => void remove(row)}>
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
      </>
      )}
    </div>
  );
}

/** A Google position, as Search Console shows it: one decimal. */
function rank(position: number) {
  return `#${position.toFixed(1)}`;
}
