"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type ArticleRow, type ArticleStatus } from "@/lib/portal/api";
import { formatDate } from "@/lib/portal/format";
import { STATUS_LABEL } from "@/components/portal/article-editor";
import { TrendingLeads, UrgentBanner, usePipeline, WriteNowDialog } from "@/components/portal/trending";
import { Badge, Button, Card, EmptyState, ErrorNote, Input, PageTitle, Spinner, Table, Td, Th } from "@/components/portal/ui";

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

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: rows?.length ?? 0 };
    for (const row of rows ?? []) result[row.status] = (result[row.status] ?? 0) + 1;
    return result;
  }, [rows]);

  const shown = (rows ?? []).filter(
    (row) =>
      (filter === "ALL" || row.status === filter) &&
      (!query.trim() ||
        `${row.title} ${row.focusKeyword ?? ""} ${row.keywords.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())),
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
        <Input className="max-w-xs" placeholder="Search title or keyword" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <Card>
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
                <Th>Updated</Th>
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
                    {row.publishedAt && <p className="mt-1 text-xs text-slate">{formatDate(row.publishedAt)}</p>}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-slate">{formatDate(row.updatedAt)}</Td>
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
