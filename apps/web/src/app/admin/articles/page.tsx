"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ArticleRow, type ArticleStatus, type SeoReport } from "@/lib/portal/api";

type SeoPage = SeoReport["pages"][number];
import { ListToolbar } from "@/components/portal/list-toolbar";
import { SeoPanel } from "@/components/portal/seo-panel";

const ARTICLE_SORT = [
  { value: "updated", label: "Recently edited" },
  { value: "published", label: "Recently published" },
  { value: "newest", label: "Newest created" },
  { value: "title", label: "Title, A to Z" },
] as const;
import { formatDate, formatDateTime } from "@/lib/portal/format";
import { STATUS_LABEL } from "@/components/portal/article-editor";
import { HowItWorks, TrendingLeads, UrgentBanner, usePipeline, WriteNowDialog } from "@/components/portal/trending";
import { Badge, Button, Card, EmptyState, ErrorNote, PageTitle, Spinner, Table, Td, Th } from "@/components/portal/ui";

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
  const [tab, setTab] = useState<"articles" | "trending" | "seo">("articles");
  const [writing, setWriting] = useState(false);
  const pipeline = usePipeline();

  const load = useCallback(() => {
    api<{ data: ArticleRow[] }>("/admin/articles")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(load, [load]);

  /** Google's numbers for the published articles; null until loaded or when Search Console is not connected. */
  const [google, setGoogle] = useState<Map<string, SeoPage> | null>(null);
  useEffect(() => {
    api<SeoReport>("/admin/articles/search-console?days=28")
      .then((report) => report.connected && setGoogle(new Map(report.pages.map((page) => [page.path, page]))))
      .catch(() => undefined);
  }, []);

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
            ["seo", "SEO & Google"],
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
      ) : tab === "seo" ? (
        <SeoPanel rows={rows} />
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
                <Th>Article</Th>
                <Th>Keywords</Th>
                <Th>Status</Th>
                {google && <Th>In Google · 28 days</Th>}
                <Th>Updated</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="hover:bg-paper-warm/60">
                  <Td>
                    <Link href={`/admin/articles/${row.id}`} className="font-semibold text-ink hover:text-gold-deep">
                      {row.title}
                    </Link>
                    <p className="text-xs text-slate">
                      {row.category}
                      {row.readingTime ? ` · ${row.readingTime}` : ""}
                      {row.source === "PIPELINE" ? " · from pipeline" : ""}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {row.focusKeyword && <Badge tone="ink">{row.focusKeyword}</Badge>}
                      {row.keywords
                        .filter((k) => k !== row.focusKeyword)
                        .slice(0, 3)
                        .map((k) => (
                          <Badge key={k}>{k}</Badge>
                        ))}
                      {!row.focusKeyword && row.keywords.length === 0 && <span className="text-xs text-slate">—</span>}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    {row.publishedAt ? (
                      <p className="mt-1 text-xs text-slate">{formatDate(row.publishedAt)}</p>
                    ) : (
                      row.source === "PIPELINE" && <p className="mt-1 whitespace-nowrap text-xs text-slate">AI draft · {formatDateTime(row.createdAt)}</p>
                    )}
                  </Td>
                  {google && (
                    <Td>
                      <GoogleCell page={row.status === "PUBLISHED" ? google.get(`/insights/${row.slug}`) : undefined} published={row.status === "PUBLISHED"} />
                    </Td>
                  )}
                  <Td className="whitespace-nowrap text-xs text-slate">{formatDateTime(row.updatedAt)}</Td>
                  <Td className="text-right">
                    <Button size="sm" tone="danger" onClick={() => void remove(row)}>
                      Delete
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      </>
      )}
    </div>
  );
}

/** One article's line from Search Console: indexed or not, position, shown and clicks. */
function GoogleCell({ page, published }: { page: SeoPage | undefined; published: boolean }) {
  if (!published) return <span className="text-xs text-slate">After publishing</span>;
  if (!page) return <span className="text-xs text-slate">No numbers yet</span>;
  const indexed = page.index?.verdict === "PASS";
  return (
    <div className="whitespace-nowrap text-xs">
      <Badge tone={indexed ? "green" : page.index ? "gold" : "grey"}>{indexed ? "In Google" : page.index ? "Not in Google yet" : "Not checked"}</Badge>
      {page.position === null ? (
        <p className="mt-1 text-slate">Not shown in searches yet</p>
      ) : (
        <p className="mt-1 text-slate">
          <span className={`font-semibold ${page.position <= 10 ? "text-emerald-700" : "text-ink"}`}>
            #{page.position < 10 ? page.position.toFixed(1) : Math.round(page.position)}
          </span>{" "}
          · <span className="font-semibold text-ink">{page.impressions.toLocaleString("en-IN")}</span> shown ·{" "}
          <span className="font-semibold text-ink">{page.clicks.toLocaleString("en-IN")}</span> clicks
        </p>
      )}
    </div>
  );
}
