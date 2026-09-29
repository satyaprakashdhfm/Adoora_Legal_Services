"use client";

/* eslint-disable @next/next/no-img-element -- console images come from the API's private admin route */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  articleImageUrl,
  refreshWebsite,
  type ArticleBlock,
  type ArticleDetail,
  type ArticleStatus,
  type LawyerProfile,
} from "@/lib/portal/api";
import { analyse, DESCRIPTION_RANGE, TITLE_RANGE } from "@/lib/portal/seo";
import { formatDateTime } from "@/lib/portal/format";
import { practiceAreas } from "@/content/practice-areas";
import { industries } from "@/content/industries";
import { insightCategories, type Block } from "@/content/insights";
import { ArticleBody } from "@/components/article-body";
import { CoverGenerator } from "@/components/portal/cover-generator";
import { Badge, Button, ErrorNote, Field, Input, Select, Textarea } from "@/components/portal/ui";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type Keyed = { key: number; block: ArticleBlock };

type Draft = {
  title: string;
  summary: string;
  slug: string;
  category: string;
  authorSlug: string;
  metaTitle: string;
  focusKeyword: string;
  keywords: string[];
  keyTakeaways: string;
  practices: string[];
  industries: string[];
  coverImageId: string | null;
  blocks: Keyed[];
};

let nextKey = 1;
const keyed = (block: ArticleBlock): Keyed => ({ key: nextKey++, block });

function toDraft(article: ArticleDetail): Draft {
  return {
    title: article.title,
    summary: article.summary,
    slug: article.slug,
    category: article.category,
    authorSlug: article.authorSlug ?? "",
    metaTitle: article.metaTitle ?? "",
    focusKeyword: article.focusKeyword ?? "",
    keywords: article.keywords,
    keyTakeaways: article.keyTakeaways.join("\n"),
    practices: article.practices,
    industries: article.industries,
    coverImageId: article.coverImageId,
    blocks: article.body.map(keyed),
  };
}

/** Empty blocks are left out of the save — a heading with no text is not a heading. */
function cleanBlocks(blocks: Keyed[]): ArticleBlock[] {
  return blocks
    .map(({ block }) => block)
    .map((block) => ("items" in block ? { ...block, items: block.items.map((item) => item.trim()).filter(Boolean) } : block))
    .filter((block) => ("text" in block ? block.text.trim() : "items" in block ? block.items.length : true)) as ArticleBlock[];
}

function payload(draft: Draft, status?: ArticleStatus) {
  return {
    title: draft.title,
    summary: draft.summary,
    slug: draft.slug || null,
    category: draft.category,
    authorSlug: draft.authorSlug || null,
    metaTitle: draft.metaTitle || null,
    focusKeyword: draft.focusKeyword || null,
    keywords: draft.keywords,
    keyTakeaways: draft.keyTakeaways.split("\n"),
    practices: draft.practices,
    industries: draft.industries,
    coverImageId: draft.coverImageId,
    body: cleanBlocks(draft.blocks),
    ...(status ? { status } : {}),
  };
}

const BLOCK_TYPES: { type: ArticleBlock["type"]; label: string; icon: string }[] = [
  { type: "p", label: "Paragraph", icon: "¶" },
  { type: "h2", label: "Heading", icon: "H2" },
  { type: "h3", label: "Subheading", icon: "H3" },
  { type: "ul", label: "Bullets", icon: "•" },
  { type: "ol", label: "Numbered", icon: "1." },
  { type: "quote", label: "Quote", icon: "❝" },
  { type: "image", label: "Image", icon: "▣" },
];

const LABEL: Record<ArticleBlock["type"], string> = Object.fromEntries(BLOCK_TYPES.map((t) => [t.type, t.label])) as Record<ArticleBlock["type"], string>;

function emptyBlock(type: Exclude<ArticleBlock["type"], "image">): ArticleBlock {
  return type === "ul" || type === "ol" ? { type, items: [""] } : { type, text: "" };
}

/** Changing a block's type keeps its words. */
function convert(block: ArticleBlock, type: Exclude<ArticleBlock["type"], "image">): ArticleBlock {
  const words = "text" in block ? block.text : "items" in block ? block.items.join("\n") : block.caption ?? "";
  return type === "ul" || type === "ol" ? { type, items: words.split("\n") } : { type, text: words.replace(/\n+/g, " ") };
}

const STATUS_TONE: Record<ArticleStatus, "gold" | "blue" | "green" | "grey"> = {
  DRAFT: "gold",
  REVIEW: "blue",
  PUBLISHED: "green",
  ARCHIVED: "grey",
};
export const STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "In review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

/** A textarea that grows with its text, so a paragraph reads as a paragraph. */
function GrowingText({
  value,
  onChange,
  className = "",
  placeholder,
  ...rest
}: { value: string; onChange: (value: string) => void; className?: string; placeholder?: string; "aria-label"?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-slate-light ${className}`}
      {...rest}
    />
  );
}

function KeywordInput({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])].slice(0, 20));
    setText("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((keyword) => (
          <span key={keyword} className="inline-flex items-center gap-1 rounded-full bg-paper-tint px-2.5 py-1 text-xs text-ink">
            {keyword}
            <button type="button" onClick={() => onChange(value.filter((k) => k !== keyword))} className="text-slate hover:text-red-700" aria-label={`Remove ${keyword}`}>
              ×
            </button>
          </span>
        ))}
      </div>
      <Input
        className="mt-2"
        value={text}
        placeholder="Type a keyword, press Enter"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

function CheckList({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-line p-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink hover:bg-paper-warm">
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={(event) =>
              onChange(event.target.checked ? [...value, option.value] : value.filter((v) => v !== option.value))
            }
            className="accent-[var(--color-gold-deep)]"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/**
 * A side-panel section. The panels work as an accordion: all start closed,
 * and opening one closes whichever was open, so the column stays short.
 */
function Panel({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  /** A one-line status shown on the closed header, e.g. the SEO score. */
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink"
      >
        <span>{title}</span>
        <span className="flex items-center gap-2 text-xs font-normal text-slate">
          {summary}
          <span className={`transition ${open ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
        </span>
      </button>
      {open && <div className="space-y-4 border-t border-line px-4 py-4">{children}</div>}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 80 ? "#15803d" : score >= 50 ? "#b45309" : "#b91c1c";
  const circumference = 2 * Math.PI * 22;
  return (
    <svg viewBox="0 0 52 52" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle cx="26" cy="26" r="22" fill="none" stroke="var(--color-line)" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r="22"
        fill="none"
        stroke={tone}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill={tone}>
        {score}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The editor
// ---------------------------------------------------------------------------

export function ArticleEditor({ article, onReload }: { article: ArticleDetail; onReload: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(article));
  const [saved, setSaved] = useState(() => JSON.stringify(payload(toDraft(article))));
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  /** The one open side-panel section, or none. */
  const [panel, setPanel] = useState<string | null>(() => (article.coverImageId ? null : "cover"));
  const toggle = (name: string) => setPanel((current) => (current === name ? null : name));
  const [profiles, setProfiles] = useState<LawyerProfile[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  /** Where the next uploaded image goes: after this block index, or the cover. */
  const imageTarget = useRef<number>(-1);

  const dirty = JSON.stringify(payload(draft)) !== saved;
  const status = article.status;

  useEffect(() => {
    api<{ data: LawyerProfile[] }>("/admin/profiles")
      .then((result) => setProfiles(result.data))
      .catch(() => undefined);
  }, []);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setBlock = (key: number, block: ArticleBlock) =>
    setDraft((current) => ({ ...current, blocks: current.blocks.map((entry) => (entry.key === key ? { key, block } : entry)) }));
  const insertAt = (index: number, block: ArticleBlock) =>
    setDraft((current) => {
      const blocks = [...current.blocks];
      blocks.splice(index, 0, keyed(block));
      return { ...current, blocks };
    });
  const move = (index: number, by: -1 | 1) =>
    setDraft((current) => {
      const blocks = [...current.blocks];
      const target = index + by;
      if (target < 0 || target >= blocks.length) return current;
      [blocks[index], blocks[target]] = [blocks[target]!, blocks[index]!];
      return { ...current, blocks };
    });
  const remove = (index: number) => setDraft((current) => ({ ...current, blocks: current.blocks.filter((_, i) => i !== index) }));

  const seo = useMemo(
    () =>
      analyse({
        title: draft.title,
        metaTitle: draft.metaTitle,
        summary: draft.summary,
        slug: draft.slug,
        focusKeyword: draft.focusKeyword,
        keywords: draft.keywords,
        body: cleanBlocks(draft.blocks),
        hasCover: Boolean(draft.coverImageId),
        hasAuthor: Boolean(draft.authorSlug),
      }),
    [draft],
  );

  async function save(nextStatus?: ArticleStatus) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const body = payload(draft, nextStatus);
      const result = await api<{ slug: string; status: ArticleStatus }>(`/admin/articles/${article.id}`, { method: "PATCH", body });
      setDraft((current) => ({ ...current, slug: result.slug }));
      setSaved(JSON.stringify(payload({ ...draft, slug: result.slug })));
      if (result.status === "PUBLISHED" || status === "PUBLISHED") await refreshWebsite(["website-articles"]);
      setNotice(
        nextStatus === "PUBLISHED" && status !== "PUBLISHED"
          ? "Published — it is live on the Insights page."
          : nextStatus === "REVIEW"
            ? "Sent for review."
            : nextStatus === "DRAFT" && status === "PUBLISHED"
              ? "Unpublished — it is no longer on the website."
              : "Saved.",
      );
      if (nextStatus && nextStatus !== status) onReload();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Ctrl/Cmd+S saves.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const result = await api<{ id: string }>(`/admin/articles/${article.id}/images`, { method: "POST", body: form });
      if (imageTarget.current === -2) set("coverImageId", result.id);
      else insertAt(imageTarget.current + 1, { type: "image", imageId: result.id, alt: "" });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function removeArticle() {
    if (!window.confirm(`Delete “${draft.title}”? This cannot be undone.`)) return;
    try {
      await api(`/admin/articles/${article.id}`, { method: "DELETE" });
      if (status === "PUBLISHED") await refreshWebsite(["website-articles"]);
      router.push("/admin/articles");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  function addBar(at: number, compact = false) {
    return (
      <div className={`flex flex-wrap items-center gap-1 ${compact ? "opacity-0 transition group-hover/add:opacity-100 focus-within:opacity-100" : ""}`}>
        {!compact && <span className="mr-1 text-xs font-semibold text-slate">Add</span>}
        {BLOCK_TYPES.map((option) => (
          <button
            key={option.type}
            type="button"
            title={option.label}
            onClick={() => {
              if (option.type === "image") {
                imageTarget.current = at - 1;
                imageInput.current?.click();
              } else insertAt(at, emptyBlock(option.type));
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-gold hover:text-gold-deep"
          >
            <span className="font-mono text-[0.7rem] text-gold-deep">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  const previewBlocks: Block[] = cleanBlocks(draft.blocks).map((block) =>
    block.type === "image" ? { type: "image", src: articleImageUrl(article.id, block.imageId), alt: block.alt, caption: block.caption } : block,
  );
  const author = profiles.find((profile) => profile.slug === draft.authorSlug);
  const seoTitle = draft.metaTitle || draft.title;

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/articles" className="text-sm text-slate hover:text-ink">
            ← Articles
          </Link>
          <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
          {article.source === "PIPELINE" && <Badge tone="blue">From pipeline</Badge>}
          <span className="hidden text-xs text-slate sm:inline">
            {saving ? "Saving…" : dirty ? "Unsaved changes" : `Saved · ${formatDateTime(article.updatedAt)}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-line bg-white p-0.5">
            {(["write", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === m ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
              >
                {m === "write" ? "Write" : "Preview"}
              </button>
            ))}
          </div>
          <Button size="sm" tone="secondary" onClick={() => void save()} disabled={saving || !dirty}>
            Save
          </Button>
          {status !== "REVIEW" && status !== "PUBLISHED" && (
            <Button size="sm" tone="secondary" onClick={() => void save("REVIEW")} disabled={saving}>
              Send for review
            </Button>
          )}
          {status === "PUBLISHED" ? (
            <>
              <Button size="sm" tone="ghost" onClick={() => void save("DRAFT")} disabled={saving}>
                Unpublish
              </Button>
              <a href={`/insights/${draft.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-gold-deep underline underline-offset-2">
                View live
              </a>
            </>
          ) : (
            <Button size="sm" onClick={() => void save("PUBLISHED")} disabled={saving}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <ErrorNote>{error}</ErrorNote>
        {article.source === "PIPELINE" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
            <span className="font-semibold">Written by AI — a lawyer must check it before publishing.</span> Verify the facts, the citation and the date
            against the sources in the side panel.
            {Array.isArray(article.sourceMeta?.checks) &&
              (article.sourceMeta.checks as string[]).map((check) => (
                <span key={check} className="mt-1 block font-semibold">
                  ⚠ {check}
                </span>
              ))}
          </div>
        )}
        {notice && !error && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">{notice}</p>}
      </div>

      <input
        ref={imageInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <input
        ref={coverInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            imageTarget.current = -2;
            void upload(file);
          }
        }}
      />

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---------------- Writing / preview ---------------- */}
        {mode === "write" ? (
          <div className="rounded-xl border border-line bg-white px-5 py-8 sm:px-10 lg:px-14">
            <div className="mx-auto max-w-3xl">
              <p className="eyebrow text-gold-deep">{draft.category}</p>
              <GrowingText
                aria-label="Title"
                value={draft.title}
                onChange={(value) => set("title", value.replace(/\n/g, " "))}
                placeholder="Article title"
                className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl"
              />
              <div className="mt-5 border-l-2 border-gold pl-5">
                <GrowingText
                  aria-label="Summary"
                  value={draft.summary}
                  onChange={(value) => set("summary", value.replace(/\n/g, " "))}
                  placeholder="Summary — one or two sentences. Shown under the title, on the card, and as the Google description."
                  className="font-serif text-lg leading-relaxed text-ink"
                />
              </div>

              <div className="mt-8 space-y-1">
                {draft.blocks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-sm text-slate">
                    Start writing: add a paragraph, a heading or an image.
                  </div>
                )}
                {draft.blocks.map(({ key, block }, index) => (
                  <div key={key}>
                    <div className="group relative rounded-lg border border-transparent px-3 py-2 transition hover:border-line focus-within:border-gold/40 focus-within:bg-paper-warm/40">
                      {/* Block tools */}
                      <div className="absolute -top-3 right-2 z-10 hidden items-center gap-0.5 rounded-md border border-line bg-white px-1 py-0.5 shadow-sm group-focus-within:flex group-hover:flex">
                        <span className="px-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate">{LABEL[block.type]}</span>
                        {block.type !== "image" && (
                          <select
                            aria-label="Change block type"
                            value={block.type}
                            onChange={(event) => setBlock(key, convert(block, event.target.value as Exclude<ArticleBlock["type"], "image">))}
                            className="rounded border-0 bg-transparent py-0.5 text-xs text-ink-soft"
                          >
                            {BLOCK_TYPES.filter((t) => t.type !== "image").map((t) => (
                              <option key={t.type} value={t.type}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        )}
                        <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="px-1.5 text-sm text-slate hover:text-ink disabled:opacity-30" aria-label="Move up">↑</button>
                        <button type="button" onClick={() => move(index, 1)} disabled={index === draft.blocks.length - 1} className="px-1.5 text-sm text-slate hover:text-ink disabled:opacity-30" aria-label="Move down">↓</button>
                        <button type="button" onClick={() => remove(index)} className="px-1.5 text-sm text-slate hover:text-red-700" aria-label="Remove block">✕</button>
                      </div>

                      {block.type === "p" && (
                        <GrowingText aria-label="Paragraph" value={block.text} onChange={(text) => setBlock(key, { ...block, text })} placeholder="Write a paragraph…" className="font-serif text-[1.02rem] leading-[1.75] text-ink-soft" />
                      )}
                      {block.type === "h2" && (
                        <GrowingText aria-label="Heading" value={block.text} onChange={(text) => setBlock(key, { ...block, text: text.replace(/\n/g, " ") })} placeholder="Heading" className="font-serif text-2xl font-semibold tracking-tight text-ink" />
                      )}
                      {block.type === "h3" && (
                        <GrowingText aria-label="Subheading" value={block.text} onChange={(text) => setBlock(key, { ...block, text: text.replace(/\n/g, " ") })} placeholder="Subheading" className="font-serif text-lg font-semibold tracking-tight text-ink" />
                      )}
                      {block.type === "quote" && (
                        <div className="border-l-2 border-gold pl-5">
                          <GrowingText aria-label="Quote" value={block.text} onChange={(text) => setBlock(key, { ...block, text })} placeholder="A quotation — e.g. a line from the judgment" className="font-serif text-xl leading-relaxed text-ink" />
                        </div>
                      )}
                      {(block.type === "ul" || block.type === "ol") && (
                        <div className="flex gap-3">
                          <span className="pt-0.5 font-mono text-sm text-gold-deep">{block.type === "ul" ? "•" : "1."}</span>
                          <GrowingText
                            aria-label="List items, one per line"
                            value={block.items.join("\n")}
                            onChange={(text) => setBlock(key, { ...block, items: text.split("\n") })}
                            placeholder="One item per line"
                            className="font-serif text-[1.02rem] leading-[1.75] text-ink-soft"
                          />
                        </div>
                      )}
                      {block.type === "image" && (
                        <figure>
                          <img src={articleImageUrl(article.id, block.imageId)} alt={block.alt} className="w-full rounded-lg border border-line" />
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <Input value={block.alt} placeholder="Describe the image (for Google and screen readers) *" onChange={(event) => setBlock(key, { ...block, alt: event.target.value })} />
                            <Input value={block.caption ?? ""} placeholder="Caption (optional)" onChange={(event) => setBlock(key, { ...block, caption: event.target.value || undefined })} />
                          </div>
                        </figure>
                      )}
                    </div>
                    {/* Insert between blocks */}
                    <div className="group/add flex min-h-6 items-center justify-center py-0.5">
                      {addBar(index + 1, true)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-line bg-paper-warm px-3 py-3">
                {addBar(draft.blocks.length)}
                {uploading && <p className="mt-2 text-xs text-slate">Uploading image…</p>}
              </div>
              <p className="mt-3 text-xs text-slate">
                {seo.words} words · Ctrl+S saves · the “Please note” legal notice is added to every article automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-paper">
            {/* As on the website: the cover beside the title. */}
            <div className={`bg-paper-tint px-6 py-10 sm:px-12 ${draft.coverImageId ? "grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]" : ""}`}>
              <div>
                <p className="eyebrow text-gold-deep">{draft.category}</p>
                <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{draft.title}</h1>
                <p className="mt-5 text-sm text-slate">
                  {author ? `By ${author.name}, ${author.designation} · ` : ""}
                  {article.publishedAt ? formatDateTime(article.publishedAt) : "Not yet published"} · {Math.max(1, Math.round(seo.words / 200))} min read
                </p>
              </div>
              {draft.coverImageId && (
                <img src={articleImageUrl(article.id, draft.coverImageId)} alt="" className="aspect-[16/9] w-full rounded-xl border border-line object-cover shadow-lg shadow-ink/10" />
              )}
            </div>
            <div className="mx-auto max-w-3xl px-6 py-10 sm:px-12">
              <p className="border-l-2 border-gold pl-6 text-lg leading-relaxed text-ink">{draft.summary}</p>
              <div className="prose-adoora mt-10 max-w-none">
                <ArticleBody blocks={previewBlocks} />
              </div>
              <aside className="mt-12 rounded-xl border border-line bg-paper-warm p-6">
                <h2 className="eyebrow text-gold-deep">Please note</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  This article is for general information only… (the standard notice is added on the website).
                </p>
              </aside>
            </div>
          </div>
        )}

        {/* ---------------- Side panel ---------------- */}
        <aside className="space-y-3 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto">
          <button
            type="button"
            onClick={() => void removeArticle()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Delete article
          </button>

          <Panel
            title="SEO"
            open={panel === "seo"}
            onToggle={() => toggle("seo")}
            summary={
              <span className={`rounded-full px-2 py-0.5 font-semibold ${seo.score >= 80 ? "bg-emerald-50 text-emerald-800" : seo.score >= 50 ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"}`}>
                {seo.score}/100
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <ScoreRing score={seo.score} />
              <div className="text-sm">
                <p className="font-semibold text-ink">{seo.score >= 80 ? "Good" : seo.score >= 50 ? "Needs work" : "Weak"}</p>
                <p className="text-xs text-slate">Advisory — it does not stop you publishing.</p>
              </div>
            </div>

            <Field label="Focus keyword" hint="The one search this piece should rank for, e.g. “anticipatory bail Telangana”.">
              <Input value={draft.focusKeyword} onChange={(event) => set("focusKeyword", event.target.value)} />
            </Field>
            <Field label="Other target keywords" hint="Related searches. Shown in SEO & Analytics.">
              <KeywordInput value={draft.keywords} onChange={(value) => set("keywords", value)} />
            </Field>

            <ul className="space-y-1.5">
              {seo.checks.map((check) => (
                <li key={check.label} className="flex gap-2 text-xs">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${check.state === "good" ? "bg-emerald-600" : check.state === "warn" ? "bg-amber-500" : "bg-red-600"}`}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-semibold text-ink">{check.label}</span>
                    {check.detail && <span className="block text-slate">{check.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Google preview</p>
              <div className="mt-2 rounded-lg border border-line bg-white p-3 font-sans">
                <p className="truncate text-xs text-[#4d5156]">adooralegalservices.com › insights › {draft.slug || "…"}</p>
                <p className="mt-0.5 line-clamp-1 text-base text-[#1a0dab]">{seoTitle || "Article title"}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#4d5156]">{draft.summary || "The summary appears here."}</p>
              </div>
            </div>

            <Field label={`SEO title (${(draft.metaTitle || draft.title).length}/${TITLE_RANGE[1]})`} hint="Optional — a shorter title for Google, if the headline is long.">
              <Input value={draft.metaTitle} maxLength={120} onChange={(event) => set("metaTitle", event.target.value)} placeholder={draft.title} />
            </Field>
            <p className="text-xs text-slate">
              Summary: {draft.summary.length}/{DESCRIPTION_RANGE[1]} characters — edit it under the title.
            </p>
          </Panel>

          {/* The picture on the Insights cards, beside the title on the
              article, and in link previews. Upload one, or have Gemini draw
              one from the article — only on a click, with the cost shown. */}
          <Panel
            title="Cover image"
            open={panel === "cover"}
            onToggle={() => toggle("cover")}
            summary={draft.coverImageId ? "Set" : <span className="font-semibold text-amber-700">Missing</span>}
          >
            {draft.coverImageId ? (
              <div>
                <img src={articleImageUrl(article.id, draft.coverImageId)} alt="" className="aspect-[16/9] w-full rounded-lg border border-line object-cover" />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" tone="secondary" onClick={() => coverInput.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading…" : "Upload a different one"}
                  </Button>
                  <Button size="sm" tone="ghost" onClick={() => set("coverImageId", null)}>Remove</Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate">Shown on the Insights cards, beside the title on the article, and when the link is shared. 16:9 works best.</p>
                <Button size="sm" tone="secondary" className="mt-2" onClick={() => coverInput.current?.click()} disabled={uploading}>
                  {uploading ? "Uploading…" : "Upload an image"}
                </Button>
              </div>
            )}
            <CoverGenerator
              articleId={article.id}
              brief={() => {
                const blocks = cleanBlocks(draft.blocks);
                return {
                  title: draft.title,
                  summary: draft.summary,
                  category: draft.category,
                  practices: draft.practices,
                  headings: blocks.flatMap((block) => (block.type === "h2" ? [block.text] : [])),
                  excerpt: blocks
                    .flatMap((block) => (block.type === "p" ? [block.text] : []))
                    .slice(0, 3)
                    .join("\n\n"),
                };
              }}
              onCreated={(imageId) => set("coverImageId", imageId)}
            />
          </Panel>

          <Panel title="Publishing" open={panel === "publishing"} onToggle={() => toggle("publishing")} summary={draft.category}>
            <Field label="Category">
              <Select value={draft.category} onChange={(event) => set("category", event.target.value)} options={insightCategories.map((c) => ({ value: c, label: c }))} />
            </Field>
            <Field label="Author" hint="From Lawyer profiles.">
              <Select
                value={draft.authorSlug}
                onChange={(event) => set("authorSlug", event.target.value)}
                placeholder="The firm"
                options={profiles.map((profile) => ({ value: profile.slug, label: `${profile.name} — ${profile.designation}` }))}
              />
            </Field>
            <Field label="Web address" hint={`/insights/${draft.slug || "…"}`}>
              <Input value={draft.slug} onChange={(event) => set("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))} />
            </Field>
          </Panel>

          <Panel
            title="Filed under"
            open={panel === "filed"}
            onToggle={() => toggle("filed")}
            summary={draft.practices.length + draft.industries.length ? `${draft.practices.length + draft.industries.length} selected` : undefined}
          >
            <Field label="Practice areas">
              <CheckList options={practiceAreas.map((a) => ({ value: a.slug, label: a.name }))} value={draft.practices} onChange={(value) => set("practices", value)} />
            </Field>
            <Field label="Sectors">
              <CheckList options={industries.map((i) => ({ value: i.slug, label: i.name }))} value={draft.industries} onChange={(value) => set("industries", value)} />
            </Field>
            <Field label="Key takeaways" hint="One per line. Optional.">
              <Textarea rows={4} value={draft.keyTakeaways} onChange={(event) => set("keyTakeaways", event.target.value)} />
            </Field>
          </Panel>

          {article.sourceMeta && (
            <Panel title="AI draft: sources" open={panel === "source"} onToggle={() => toggle("source")} summary="check before publishing">
              <dl className="space-y-2.5 text-xs">
                {Object.entries(article.sourceMeta)
                  .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-semibold capitalize text-ink-soft">{k.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className="break-words text-slate">
                        {Array.isArray(v) ? (
                          <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                            {v.map((item, i) => {
                              const line = String(item);
                              const url = line.match(/https?:\/\/\S+/)?.[0];
                              return (
                                <li key={i}>
                                  {url ? (
                                    <a href={url} target="_blank" rel="noreferrer" className="hover:text-gold-deep">
                                      {line}
                                    </a>
                                  ) : (
                                    line
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          String(v)
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            </Panel>
          )}

        </aside>
      </div>
    </div>
  );
}
