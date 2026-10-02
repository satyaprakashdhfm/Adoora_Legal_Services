"use client";

import { useState } from "react";
import type { DocumentRecord, DocumentSection } from "@/lib/portal/api";
import { Button, ErrorNote, Modal } from "@/components/portal/ui";

/**
 * The pieces the Documents drive and a case's Documents tab share. Every case
 * has three folders:
 *
 *   Internal      the firm only
 *   Client        what the client sends, and what the firm shares with them
 *   From court    court orders (fetched automatically) and filed papers
 *
 * The client sees the last two. The firm can make its own folders inside
 * any of the three, and one file can sit in several places at once (say
 * Internal and From court). A place is "COURT" or "COURT/<folder id>".
 */

export type Section = DocumentSection;
export type Folder = { id: string; name: string; section: Section; visibility: "CLIENT" | "INTERNAL" };

/** In the order each side sees them. */
export const sectionsFor = (staff: boolean): Section[] => (staff ? ["INTERNAL", "CLIENT", "COURT"] : ["COURT", "CLIENT"]);

export function sectionLabel(section: Section) {
  return section === "INTERNAL" ? "Internal" : section === "COURT" ? "From court" : "Client";
}

export function sectionHint(section: Section, staff: boolean) {
  if (section === "INTERNAL") return "Firm only. The client never sees these";
  if (section === "COURT") return staff ? "Court orders and filed papers. The client sees these" : "Court orders and the papers filed in your case";
  return staff ? "What the client sends, and what the firm shares with them" : "What you send to the firm, and what it shares with you";
}

export const sectionTone = (section: Section) => (section === "INTERNAL" ? "slate" : section === "COURT" ? "ink" : "gold") as "slate" | "ink" | "gold";

const sectionOfPlace = (place: string) => place.split("/")[0] as Section;

/** Every place a document sits (older records: the one folder it was in). */
export function placesOf(doc: DocumentRecord): string[] {
  if (doc.places?.length) return doc.places;
  const section: Section = doc.section ?? (doc.visibility === "INTERNAL" ? "INTERNAL" : doc.fromCourt ? "COURT" : "CLIENT");
  return [doc.folderId ? `${section}/${doc.folderId}` : section];
}

/** Where a file came from, shown on its row. */
export function sourceOf(doc: DocumentRecord): { label: string; tone: string } {
  if (doc.fromCourt) return { label: "Court website", tone: "bg-sky-50 text-sky-800" };
  if (doc.uploadedByClientId || (doc.uploadedByClient && !doc.uploadedByUser)) return { label: "Sent by the client", tone: "bg-amber-50 text-amber-800" };
  return { label: "Added by the firm", tone: "bg-paper-tint text-ink-soft" };
}

export function SourceTag({ doc }: { doc: DocumentRecord }) {
  const source = sourceOf(doc);
  return <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${source.tone}`}>{source.label}</span>;
}

/**
 * Files in one place: a section's top level, or one of the firm's folders.
 * A place in a folder that no longer exists counts as the section's top.
 */
export function filesIn(documents: DocumentRecord[], section: Section, folder: Folder | null, folders: Folder[]) {
  return documents.filter((doc) =>
    placesOf(doc).some((place) => {
      const [placeSection, folderId] = place.split("/");
      if (placeSection !== section) return false;
      if (folder) return folderId === folder.id;
      return !folderId || !folders.some((f) => f.id === folderId);
    }),
  );
}

export function countSection(documents: DocumentRecord[], section: Section) {
  return documents.filter((doc) => placesOf(doc).some((place) => sectionOfPlace(place) === section)).length;
}

/** Every place in a case a file can go, grouped by section. */
export function placeOptions(folders: Folder[], sections: Section[]) {
  return sections.map((section) => ({
    section,
    label: sectionLabel(section),
    options: [
      { value: section, label: sectionLabel(section) },
      ...folders.filter((folder) => folder.section === section).map((folder) => ({ value: `${section}/${folder.id}`, label: folder.name })),
    ],
  }));
}

/** Tick one or more places. Folders the firm made sit beside their section. */
export function FolderChecklist({
  folders,
  sections,
  value,
  onChange,
}: {
  folders: Folder[];
  sections: Section[];
  value: string[];
  onChange: (places: string[]) => void;
}) {
  const toggle = (place: string) => onChange(value.includes(place) ? value.filter((p) => p !== place) : [...value, place]);
  return (
    <div className="space-y-3">
      {placeOptions(folders, sections).map((group) => (
        <fieldset key={group.section}>
          <legend className="text-xs font-semibold text-ink-soft">
            {group.label}
            <span className="ml-1.5 font-normal text-slate">{group.section === "INTERNAL" ? "· firm only" : "· the client sees it"}</span>
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {group.options.map((option) => {
              const checked = value.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition ${
                    checked ? "border-gold bg-gold/10 font-semibold text-ink" : "border-line-strong bg-white text-ink-soft hover:border-gold"
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggle(option.value)} className="h-4 w-4 accent-[var(--color-gold)]" />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

const FOLDER_ICON = "M2.5 5.5a1 1 0 011-1h4l1.5 1.5h7.5a1 1 0 011 1v8.5a1 1 0 01-1 1h-13a1 1 0 01-1-1z";

export function FolderTile({
  title,
  subtitle,
  count,
  onOpen,
  tone = "gold",
}: {
  title: string;
  subtitle?: string;
  count?: number;
  onOpen: () => void;
  tone?: "gold" | "ink" | "slate";
}) {
  const colour = tone === "ink" ? "text-ink" : tone === "slate" ? "text-slate" : "text-gold";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 rounded-xl border border-line bg-white p-4 text-left transition hover:border-gold hover:shadow-md hover:shadow-ink/5"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className={`mt-0.5 h-8 w-8 shrink-0 ${colour}`}>
        <path d={FOLDER_ICON} fill="currentColor" fillOpacity={0.18} stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" />
      </svg>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink group-hover:text-gold-deep">{title}</span>
        {subtitle && <span className="mt-0.5 block text-xs text-slate">{subtitle}</span>}
        {count !== undefined && (
          <span className="mt-1.5 block text-xs font-semibold text-ink-soft">
            {count === 0 ? "Empty" : `${count} file${count === 1 ? "" : "s"}`}
          </span>
        )}
      </span>
    </button>
  );
}

export function Breadcrumbs({ trail }: { trail: { label: string; onClick?: () => void }[] }) {
  return (
    <nav aria-label="Folder" className="flex flex-wrap items-center gap-1.5 text-sm">
      {trail.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-slate">/</span>}
          {crumb.onClick ? (
            <button type="button" onClick={crumb.onClick} className="font-semibold text-gold-deep hover:underline">
              {crumb.label}
            </button>
          ) : (
            <span className="font-semibold text-ink">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * "Move to" for the firm: tick every folder the file should be in (one or
 * several), then Save. Unticking a folder takes it out of that one.
 */
export function MoveButton({ doc, folders, onMove }: { doc: DocumentRecord; folders: Folder[]; onMove: (body: { places: string[] }) => Promise<void> }) {
  const [places, setPlaces] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!places?.length) return;
    setSaving(true);
    setError(null);
    try {
      await onMove({ places });
      setPlaces(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button tone="ghost" size="sm" onClick={() => setPlaces(placesOf(doc))}>
        Move to
      </Button>
      <Modal open={places !== null} onClose={() => setPlaces(null)} title={`Move ${doc.title}`}>
        {places && (
          <div className="space-y-5">
            <p className="text-sm text-ink-soft">Tick every folder this file should be in. It can be in more than one.</p>
            <FolderChecklist folders={folders} sections={sectionsFor(true)} value={places} onChange={setPlaces} />
            {places.length > 0 && places.every((place) => sectionOfPlace(place) === "INTERNAL") && (
              <p className="text-xs text-slate">Only in Internal: the client will not see this file.</p>
            )}
            <ErrorNote>{error}</ErrorNote>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void save()} disabled={!places.length || saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button tone="ghost" onClick={() => setPlaces(null)}>
                Cancel
              </Button>
              {!places.length && <span className="text-xs text-slate">Choose at least one folder.</span>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
