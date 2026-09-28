"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/portal/api";
import { formatDateTime } from "@/lib/portal/format";
import { Badge, Button, Card, EmptyState, ErrorNote, Modal, Spinner } from "@/components/portal/ui";

export type Lead = {
  id: string;
  title: string;
  court: string | null;
  courtLevel: "SC" | "HC" | "OTHER";
  sources: { outlet: string; title: string; url: string; publishedAt: string }[];
  outlets: number;
  score: number;
  practices: string[];
  status: "NEW" | "URGENT" | "SHORTLISTED" | "DRAFTED" | "REJECTED";
  articleId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type Pipeline = {
  gemini: boolean;
  model: string;
  jobs: boolean;
  lastTrendingAt: string | null;
  draftsToday: number;
  dailyLimit: number;
  minScore: number;
  urgent: number;
};

export function usePipeline() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  useEffect(() => {
    api<Pipeline>("/admin/pipeline")
      .then(setPipeline)
      .catch(() => undefined);
  }, []);
  return pipeline;
}

/**
 * "Write now": a topic — typed, or taken from a trending lead — becomes an
 * AI draft (In review), and the editor opens on it.
 */
export function WriteNowDialog({
  open,
  onClose,
  lead,
  pipeline,
}: {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
  pipeline: Pipeline | null;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState(lead?.title ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function draft(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const article = await api<{ id: string }>("/admin/articles/draft", { method: "POST", body: { topic, leadId: lead?.id } });
      router.push(`/admin/articles/${article.id}`);
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Write now">
      <form onSubmit={draft} className="space-y-4">
        <p className="text-sm text-ink-soft">
          The AI researches the topic (it searches the web and reads the judgment where it can), writes a draft in the firm&apos;s style, and saves it as{" "}
          <span className="font-semibold">In review</span>. Nothing is published until you do.
        </p>
        {lead && (
          <div className="rounded-md bg-paper-warm px-3 py-2 text-xs text-ink-soft">
            From a trending lead · {lead.court ?? "court not named"} · {lead.outlets} outlet{lead.outlets === 1 ? "" : "s"}
          </div>
        )}
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Topic
          <textarea
            required
            minLength={8}
            maxLength={500}
            rows={3}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Supreme Court on anticipatory bail under the BNSS"
            className="mt-1.5 w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
        </label>
        {pipeline && !pipeline.gemini && <ErrorNote>AI drafting is not set up yet — add GEMINI_API_KEY to adoora-api on Railway.</ErrorNote>}
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={busy || (pipeline !== null && !pipeline.gemini)}>
          {busy ? "Researching and writing — about a minute…" : "Draft it"}
        </Button>
      </form>
    </Modal>
  );
}

/** The rules of the news reading and the AI drafts, in a few lines. */
export function HowItWorks({ pipeline }: { pipeline: Pipeline | null }) {
  const limit = pipeline?.dailyLimit ?? 3;
  const minScore = pipeline?.minScore ?? 6;
  const rows: [string, string][] = [
    ["Reading the news", "Every 3 hours we read the headlines and links — never the full text — from LiveLaw, Bar & Bench, Verdictum and Google News."],
    ["Trending score", "Higher when more outlets carry the same judgment, for the Supreme Court and High Courts, and for your practice areas and keywords. It fades over 48 hours."],
    ["Write today", "A judgment that 4 or more outlets report within 6 hours (or with a very high score) is flagged red."],
    ["Morning drafts", `From 06:30 IST the AI drafts up to ${limit} articles a day from the top trending judgments (score ${minScore} or more).`],
    ["Write now", "You give a topic, or pick a trending judgment; the AI searches the web, writes a draft in about a minute and lists its sources."],
    ["AI rules", "Facts only from its sources · names the court, case and date · never names victims, children or family-case parties · informs, never advertises (Bar Council rules)."],
    ["Publishing", "Every AI draft lands In review. Nothing goes on the website until a person checks it and presses Publish."],
  ];
  return (
    <details className="group rounded-xl border border-line bg-white">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink">
        How AI articles work <span className="font-normal text-slate">— the rules in brief</span>
      </summary>
      <dl className="grid gap-x-6 gap-y-2.5 border-t border-line px-4 py-3 text-sm sm:grid-cols-[9rem_1fr]">
        {rows.map(([term, text]) => (
          <div key={term} className="contents">
            <dt className="font-semibold text-ink">{term}</dt>
            <dd className="text-ink-soft">{text}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** The red "write today" strip, shown wherever a lead is urgent. */
export function UrgentBanner({ count, onOpen }: { count: number; onOpen: () => void }) {
  if (!count) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-900 transition hover:bg-red-100"
    >
      <span>
        <span className="font-semibold">Write today:</span> {count} judgment{count === 1 ? " is" : "s are"} trending hard across the legal press.
      </span>
      <span className="font-semibold underline underline-offset-2">See them →</span>
    </button>
  );
}

const LEVEL: Record<Lead["courtLevel"], { label: string; tone: "ink" | "blue" | "grey" }> = {
  SC: { label: "Supreme Court", tone: "ink" },
  HC: { label: "High Court", tone: "blue" },
  OTHER: { label: "Other", tone: "grey" },
};

/** Trending judgments: urgent first, then by score. */
export function TrendingLeads({ pipeline }: { pipeline: Pipeline | null }) {
  const router = useRouter();
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [writing, setWriting] = useState<Lead | null>(null);

  const load = useCallback(() => {
    api<{ data: Lead[] }>("/admin/leads")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);
  useEffect(load, [load]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      await api("/admin/leads/refresh", { method: "POST" });
      load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  async function mark(lead: Lead, status: "SHORTLISTED" | "REJECTED" | "NEW") {
    try {
      await api(`/admin/leads/${lead.id}`, { method: "PATCH", body: { status } });
      setRows((current) => (current ?? []).map((row) => (row.id === lead.id ? { ...row, status } : row)).filter((row) => row.status !== "REJECTED"));
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate">
        <p>
          Read from LiveLaw, Bar &amp; Bench, Verdictum and Google News every 3 hours
          {pipeline?.lastTrendingAt ? ` · last read ${formatDateTime(pipeline.lastTrendingAt)}` : ""}. Scored by how many outlets carry the story, the court,
          and your practice areas and keywords.
          {pipeline ? ` Morning drafts today: ${pipeline.draftsToday}/${pipeline.dailyLimit}.` : ""}
        </p>
        <Button size="sm" tone="secondary" onClick={() => void refresh()} disabled={refreshing}>
          {refreshing ? "Reading the feeds…" : "Read feeds now"}
        </Button>
      </div>
      <ErrorNote>{error}</ErrorNote>
      <Card>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing trending yet">The feeds are read every 3 hours; press “Read feeds now” to read them straight away.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((lead) => (
              <li key={lead.id} className={`px-5 py-4 ${lead.status === "URGENT" ? "bg-red-50/60" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {lead.status === "URGENT" && <Badge tone="red">Write today</Badge>}
                      {lead.status === "SHORTLISTED" && <Badge tone="gold">Shortlisted</Badge>}
                      {lead.status === "DRAFTED" && <Badge tone="green">Drafted</Badge>}
                      <Badge tone={LEVEL[lead.courtLevel].tone}>{lead.court ?? LEVEL[lead.courtLevel].label}</Badge>
                      <span className="text-xs text-slate">
                        {lead.outlets} outlet{lead.outlets === 1 ? "" : "s"} · score {lead.score} · first seen {formatDateTime(lead.firstSeenAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 font-semibold text-ink">{lead.title}</p>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-gold-deep">Sources ({lead.sources.length})</summary>
                      <ul className="mt-1.5 space-y-1">
                        {lead.sources.map((source) => (
                          <li key={source.url} className="text-xs">
                            <a href={source.url} target="_blank" rel="noreferrer" className="text-ink-soft hover:text-gold-deep">
                              <span className="font-semibold">{source.outlet}</span> — {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead.articleId ? (
                      <Button size="sm" tone="secondary" onClick={() => router.push(`/admin/articles/${lead.articleId}`)}>
                        Open draft
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setWriting(lead)}>
                        Write now
                      </Button>
                    )}
                    {lead.status !== "SHORTLISTED" && !lead.articleId && (
                      <Button size="sm" tone="ghost" onClick={() => void mark(lead, "SHORTLISTED")}>
                        Shortlist
                      </Button>
                    )}
                    {!lead.articleId && (
                      <Button size="sm" tone="ghost" onClick={() => void mark(lead, "REJECTED")}>
                        Not for us
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {writing && <WriteNowDialog key={writing.id} open onClose={() => setWriting(null)} lead={writing} pipeline={pipeline} />}
    </div>
  );
}
