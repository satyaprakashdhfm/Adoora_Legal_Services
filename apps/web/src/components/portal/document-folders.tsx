import type { DocumentRecord, DocumentSection } from "@/lib/portal/api";

/**
 * The pieces the Documents drive and a case's Documents tab share. Every case
 * has three folders:
 *
 *   Internal       the firm only
 *   From client    what the client sends, and what the firm shares with them
 *   From court     court orders (fetched automatically) and filed papers
 *
 * The client sees the last two, as "From court" and "Client files". The firm
 * can make its own folders inside any of the three.
 */

export type Section = DocumentSection;
export type Folder = { id: string; name: string; section: Section; visibility: "CLIENT" | "INTERNAL" };

/** In the order each side sees them. */
export const sectionsFor = (staff: boolean): Section[] => (staff ? ["INTERNAL", "CLIENT", "COURT"] : ["COURT", "CLIENT"]);

export function sectionLabel(section: Section, staff: boolean) {
  if (section === "INTERNAL") return "Internal";
  if (section === "COURT") return "From court";
  return staff ? "From client" : "Client files";
}

export function sectionHint(section: Section, staff: boolean) {
  if (section === "INTERNAL") return "Firm only. The client never sees these";
  if (section === "COURT") return staff ? "Court orders and filed papers. The client sees these" : "Court orders and the papers filed in your case";
  return staff ? "What the client sends, and what the firm shares with them" : "What you send to the firm, and what it shares with you";
}

export const sectionTone = (section: Section) => (section === "INTERNAL" ? "slate" : section === "COURT" ? "ink" : "gold") as "slate" | "ink" | "gold";

/** The section a document sits in (older records without one: from its visibility). */
export function sectionOf(doc: DocumentRecord): Section {
  if (doc.section) return doc.section;
  if (doc.visibility === "INTERNAL") return "INTERNAL";
  return doc.fromCourt ? "COURT" : "CLIENT";
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

/** Files in one place: a section's top level, or one of the firm's folders. */
export function filesIn(documents: DocumentRecord[], section: Section, folder: Folder | null, folders: Folder[]) {
  return documents.filter((doc) => {
    if (sectionOf(doc) !== section) return false;
    if (folder) return doc.folderId === folder.id;
    return !doc.folderId || !folders.some((f) => f.id === doc.folderId);
  });
}

export function countSection(documents: DocumentRecord[], section: Section) {
  return documents.filter((doc) => sectionOf(doc) === section).length;
}

/**
 * Every place in a case a file can go, as `section:X` or `folder:<id>`, for
 * the upload dialog's Folder box and the Move to box.
 */
export function placeOptions(folders: Folder[], staff: boolean, sections: Section[] = sectionsFor(staff)) {
  return sections.map((section) => ({
    section,
    label: sectionLabel(section, staff),
    options: [
      { value: `section:${section}`, label: sectionLabel(section, staff) },
      ...folders
        .filter((folder) => folder.section === section)
        .map((folder) => ({ value: `folder:${folder.id}`, label: `${sectionLabel(section, staff)} / ${folder.name}` })),
    ],
  }));
}

/** `section:X` or `folder:<id>` back to where it is. */
export function parsePlace(value: string, folders: Folder[]): { section: Section; folderId?: string } | null {
  const [kind, id] = value.split(":");
  if (kind === "section" && (id === "INTERNAL" || id === "CLIENT" || id === "COURT")) return { section: id };
  const folder = kind === "folder" ? folders.find((f) => f.id === id) : undefined;
  return folder ? { section: folder.section, folderId: folder.id } : null;
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

/** "Move to" for staff: the top of any of the three, or any of the case's folders. */
export function MoveSelect({ doc, folders, onMove }: { doc: DocumentRecord; folders: Folder[]; onMove: (body: { folderId: string | null; section?: Section }) => void }) {
  const here = doc.folderId && folders.some((f) => f.id === doc.folderId) ? `folder:${doc.folderId}` : `section:${sectionOf(doc)}`;
  return (
    <select
      aria-label="Move to"
      value={here}
      onChange={(event) => {
        const place = parsePlace(event.target.value, folders);
        if (place) onMove(place.folderId ? { folderId: place.folderId } : { folderId: null, section: place.section });
      }}
      className="max-w-[12rem] rounded-md border border-line bg-white px-2 py-1 text-xs font-normal text-ink-soft"
    >
      {placeOptions(folders, true).map((group) => (
        <optgroup key={group.section} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
