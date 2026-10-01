"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/portal/api";
import { formatDate } from "@/lib/portal/format";
import { Button, ErrorNote, Input, Spinner } from "@/components/portal/ui";
import { DocMarkdown, headingsOf } from "@/components/portal/doc-markdown";
import { markTerms, searchDocs, searchTerms } from "@/components/portal/doc-search";

type DocPage = {
  id: string;
  title: string;
  body: string;
  position: number;
  updatedAt: string;
  updatedByName: string | null;
};

/** The chapter open, kept in the address (#c-<id>) so a link opens it. */
function chapterFromHash() {
  if (typeof window === "undefined") return null;
  const match = /^#c-([0-9a-f-]{36})/.exec(window.location.hash);
  return match ? match[1] : null;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth={1.6} />
      <path d="M12.5 12.5L17 17" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

/** Text with the searched words picked out. */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {markTerms(text, terms).map((part, i) =>
        part.match ? (
          <mark key={i} className="rounded-sm bg-gold/25 text-ink">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M13.5 3.5l3 3L7 16H4v-3z M11.5 5.5l3 3" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Admin console → Documentation: the firm's guide to the system, kept here
 * so it stays current instead of drifting in a Word file. A chapter list on
 * the left (the open chapter shows its headings), the chapter on the right,
 * and an Edit button for owners and admins.
 */
export function DocsWorkspace() {
  const [pages, setPages] = useState<DocPage[] | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(chapterFromHash);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    api<{ pages: DocPage[]; canEdit: boolean }>("/admin/docs")
      .then((result) => {
        setPages(result.pages);
        setCanEdit(result.canEdit);
      })
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(load, [load]);

  const current = pages?.find((p) => p.id === selected) ?? pages?.[0] ?? null;
  const index = current && pages ? pages.indexOf(current) : -1;

  function open(id: string, heading?: string) {
    if (editing && !window.confirm("Leave this chapter without saving your changes?")) return;
    setEditing(false);
    setSelected(id);
    window.history.replaceState(null, "", `#c-${id}`);
    requestAnimationFrame(() => {
      if (heading) document.getElementById(heading)?.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function addChapter() {
    if (editing && !window.confirm("Leave this chapter without saving your changes?")) return;
    try {
      const { page } = await api<{ page: DocPage }>("/admin/docs", { method: "POST", body: { title: "New chapter", body: "" } });
      setPages((list) => [...(list ?? []), page]);
      setSelected(page.id);
      window.history.replaceState(null, "", `#c-${page.id}`);
      setEditing(true);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  async function move(direction: -1 | 1) {
    if (!pages || index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    setPages(next);
    try {
      await api("/admin/docs/order", { method: "POST", body: { ids: next.map((p) => p.id) } });
    } catch (cause) {
      setError((cause as Error).message);
      void load();
    }
  }

  if (error && !pages) return <ErrorNote>{error}</ErrorNote>;
  if (!pages) return <Spinner label="Loading the documentation" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-8">
      <Sidebar pages={pages} current={current} canEdit={canEdit} onOpen={open} onAdd={() => void addChapter()} />

      <div className="min-w-0">
        <ErrorNote>{error}</ErrorNote>
        {!current ? (
          <div className="rounded-xl border border-line bg-white px-6 py-14 text-center">
            <p className="font-serif text-lg font-semibold text-ink">No chapters yet</p>
            {canEdit && (
              <Button className="mt-5" onClick={() => void addChapter()}>
                Write the first chapter
              </Button>
            )}
          </div>
        ) : editing ? (
          <Editor
            key={current.id}
            page={current}
            isFirst={index === 0}
            isLast={index === pages.length - 1}
            onMove={(direction) => void move(direction)}
            onCancel={() => setEditing(false)}
            onSaved={(page) => {
              setPages((list) => list?.map((p) => (p.id === page.id ? page : p)) ?? null);
              setEditing(false);
            }}
            onDeleted={() => {
              const rest = pages.filter((p) => p.id !== current.id);
              setPages(rest);
              setEditing(false);
              setSelected(rest[Math.max(0, index - 1)]?.id ?? null);
            }}
          />
        ) : (
          <article className="rounded-xl border border-line bg-white px-5 py-6 shadow-[0_1px_2px_rgba(11,24,52,0.04)] sm:px-8 sm:py-8 lg:px-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow text-gold-deep">
                  Chapter {index + 1} of {pages.length}
                </p>
                <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{current.title}</h1>
                <p className="mt-1.5 text-xs text-slate">
                  Last edited {formatDate(current.updatedAt)}
                  {current.updatedByName && ` by ${current.updatedByName}`}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-gold hover:text-gold-deep"
                >
                  <PencilIcon />
                  Edit
                </button>
              )}
            </div>

            <div className="mt-8">
              {current.body.trim() ? (
                <DocMarkdown body={current.body} />
              ) : (
                <p className="text-sm text-slate">This chapter is empty.{canEdit && " Press Edit to write it."}</p>
              )}
            </div>

            <nav aria-label="Chapters" className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
              {index > 0 ? (
                <button type="button" onClick={() => open(pages[index - 1].id)} className="rounded-lg border border-line px-4 py-3 text-left transition hover:border-gold">
                  <span className="block text-xs text-slate">← Previous</span>
                  <span className="mt-0.5 block font-semibold text-ink">{pages[index - 1].title}</span>
                </button>
              ) : (
                <span />
              )}
              {index < pages.length - 1 && (
                <button type="button" onClick={() => open(pages[index + 1].id)} className="rounded-lg border border-line px-4 py-3 text-right transition hover:border-gold">
                  <span className="block text-xs text-slate">Next →</span>
                  <span className="mt-0.5 block font-semibold text-ink">{pages[index + 1].title}</span>
                </button>
              )}
            </nav>
          </article>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  pages,
  current,
  canEdit,
  onOpen,
  onAdd,
}: {
  pages: DocPage[];
  current: DocPage | null;
  canEdit: boolean;
  onOpen: (id: string, heading?: string) => void;
  onAdd: () => void;
}) {
  const headings = useMemo(() => (current ? headingsOf(current.body) : []), [current]);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const terms = useMemo(() => searchTerms(deferred), [deferred]);
  const results = useMemo(() => searchDocs(pages, deferred), [pages, deferred]);
  const searching = terms.length > 0;

  return (
    <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1">
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="font-serif text-lg font-semibold text-ink">Documentation</p>
        <p className="mt-0.5 text-xs text-slate">
          {pages.length} chapter{pages.length === 1 ? "" : "s"}
        </p>

        <label className="relative mt-3 block">
          <span className="sr-only">Search the documentation</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search, e.g. deactivate"
            className="w-full rounded-md border border-line-strong bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-slate focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
        </label>

        {searching ? (
          <div className="mt-4" aria-live="polite">
            <p className="px-0.5 text-xs text-slate">
              {results.length
                ? `${results.length} chapter${results.length === 1 ? " mentions" : "s mention"} “${deferred.trim()}”`
                : `No chapter mentions “${deferred.trim()}”. Try another word, or fewer words.`}
            </p>
            <ol className="mt-2 space-y-3">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(result.id)}
                    className={`flex w-full gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-semibold text-ink transition hover:bg-paper-warm ${
                      result.id === current?.id ? "bg-paper-warm" : ""
                    }`}
                  >
                    <span className="w-5 shrink-0 tabular-nums text-gold-deep">{result.number}.</span>
                    <span className="min-w-0">
                      <Marked text={result.title} terms={terms} />
                    </span>
                  </button>
                  {result.hits.length > 0 && (
                    <ul className="ml-[1.15rem] mt-1 space-y-0.5 border-l border-line pl-2">
                      {result.hits.slice(0, 3).map((hit, k) => (
                        <li key={k}>
                          <button
                            type="button"
                            onClick={() => onOpen(result.id, hit.heading?.id)}
                            className="block w-full rounded px-2 py-1.5 text-left transition hover:bg-paper-warm"
                          >
                            {hit.heading && hit.heading.text !== hit.text && <span className="block text-[0.6875rem] font-semibold text-slate">{hit.heading.text}</span>}
                            <span className="block text-[0.8125rem] leading-snug text-ink-soft">
                              <Marked text={hit.text} terms={terms} />
                            </span>
                          </button>
                        </li>
                      ))}
                      {result.hits.length > 3 && <li className="px-2 py-1 text-xs text-slate">and {result.hits.length - 3} more in this chapter</li>}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <>
            {/* Phones: a chapter picker instead of the long list. */}
                <select
              aria-label="Chapter"
              value={current?.id ?? ""}
              onChange={(e) => onOpen(e.target.value)}
              className="mt-3 w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink lg:hidden"
            >
              {pages.map((page, i) => (
                <option key={page.id} value={page.id}>
                  {i + 1}. {page.title}
                </option>
              ))}
            </select>

            <ol className="mt-4 space-y-0.5 max-lg:hidden">
              {pages.map((page, i) => {
                const active = page.id === current?.id;
                return (
                  <li key={page.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(page.id)}
                      aria-current={active ? "page" : undefined}
                      className={`flex w-full gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${
                        active ? "bg-paper-warm font-semibold text-ink" : "text-ink-soft hover:bg-paper-warm hover:text-ink"
                      }`}
                    >
                      <span className={`w-5 shrink-0 tabular-nums ${active ? "text-gold-deep" : "text-slate"}`}>{i + 1}.</span>
                      <span className="min-w-0">{page.title}</span>
                    </button>
                    {active && headings.length > 0 && (
                      <ul className="mb-2 ml-[1.15rem] mt-1 space-y-0.5 border-l border-line pl-3">
                        {headings.map((heading, k) => (
                          <li key={`${heading.id}-${k}`}>
                            <button
                              type="button"
                              onClick={() => onOpen(page.id, heading.id)}
                              className={`block w-full rounded px-2 py-1 text-left transition hover:bg-paper-warm hover:text-ink ${
                                heading.level === 3 ? "pl-4 text-xs text-slate" : "text-[0.8125rem] text-ink-soft"
                              }`}
                            >
                              {heading.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {canEdit && (
          <button type="button" onClick={onAdd} className="mt-4 w-full rounded-md border border-dashed border-line-strong px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-gold hover:text-gold-deep">
            + New chapter
          </button>
        )}
      </div>
    </aside>
  );
}

const SNIPPETS: { label: string; before: string; after?: string; sample: string }[] = [
  { label: "Heading", before: "\n## ", sample: "Heading" },
  { label: "Sub-heading", before: "\n### ", sample: "Sub-heading" },
  { label: "Bold", before: "**", after: "**", sample: "bold text" },
  { label: "Bullets", before: "\n- ", sample: "First point\n- Second point" },
  { label: "Steps", before: "\n1. ", sample: "First step\n2. Second step" },
  { label: "Note", before: "\n> ", sample: "Something worth knowing." },
  { label: "Table", before: "\n| Column | Column |\n| --- | --- |\n| ", after: " | |\n", sample: "Value" },
];

function Editor({
  page,
  isFirst,
  isLast,
  onMove,
  onCancel,
  onSaved,
  onDeleted,
}: {
  page: DocPage;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onCancel: () => void;
  onSaved: (page: DocPage) => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = title !== page.title || body !== page.body;

  // A warning before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function insert(before: string, after = "", sample = "") {
    const el = area.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const chosen = body.slice(start, end) || sample;
    const next = body.slice(0, start) + before + chosen + after + body.slice(end);
    setBody(next);
    setTab("write");
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + chosen.length);
    });
  }

  async function addPicture(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const { id } = await api<{ id: string }>("/admin/docs/images", { method: "POST", body: form });
      insert(`\n![`, `](docimg:${id})\n`, "Describe the picture");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const { page: saved } = await api<{ page: DocPage }>(`/admin/docs/${page.id}`, {
        method: "PUT",
        body: { title, body, expectedUpdatedAt: page.updatedAt },
      });
      onSaved(saved);
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the chapter “${page.title}”? This cannot be undone.`)) return;
    try {
      await api(`/admin/docs/${page.id}`, { method: "DELETE" });
      onDeleted();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <section className="rounded-xl border border-gold/50 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow text-gold-deep">Editing</p>
        <div className="flex gap-2">
          <Button tone="secondary" size="sm" disabled={isFirst} onClick={() => onMove(-1)}>
            Move up
          </Button>
          <Button tone="secondary" size="sm" disabled={isLast} onClick={() => onMove(1)}>
            Move down
          </Button>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">Chapter title</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="mt-1.5 font-serif text-lg font-semibold" />
      </label>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex gap-1">
          {(["write", "preview"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`border-b-2 px-3 pb-2 text-sm font-semibold transition ${tab === value ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"}`}
            >
              {value === "write" ? "Write" : "Preview"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 pb-2">
          {SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => insert(snippet.before, snippet.after, snippet.sample)}
              className="rounded border border-line px-2 py-1 text-xs font-semibold text-ink-soft transition hover:border-gold hover:text-gold-deep"
            >
              {snippet.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="rounded border border-gold/60 bg-gold/10 px-2 py-1 text-xs font-semibold text-gold-deep transition hover:bg-gold/20 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Picture"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void addPicture(file);
            }}
          />
        </div>
      </div>

      {tab === "write" ? (
        <>
          <textarea
            ref={area}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck
            aria-label="Chapter text"
            className="mt-4 block min-h-[60vh] w-full resize-y rounded-md border border-line-strong bg-paper-warm/40 px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-ink focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
          <p className="mt-2 text-xs text-slate">
            <code>## Heading</code> and <code>### Sub-heading</code> appear in the chapter list on the left. <code>**bold**</code>, <code>- bullet</code>,{" "}
            <code>1. step</code>, <code>&gt; note</code>. Pictures are added with the Picture button; the text in the square brackets is their caption.
          </p>
        </>
      ) : (
        <div className="mt-6 min-h-[40vh]">{body.trim() ? <DocMarkdown body={body} /> : <p className="text-sm text-slate">Nothing to preview yet.</p>}</div>
      )}

      <div className="mt-6 space-y-3">
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void save()} disabled={saving || !title.trim() || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            tone="ghost"
            onClick={() => {
              if (!dirty || window.confirm("Discard your changes?")) onCancel();
            }}
          >
            Cancel
          </Button>
          <Button tone="danger" size="sm" className="ml-auto" onClick={() => void remove()}>
            Delete chapter
          </Button>
        </div>
      </div>
    </section>
  );
}
