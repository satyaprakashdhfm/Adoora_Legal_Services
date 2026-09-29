import type { DocumentRecord } from "@/lib/portal/api";

/**
 * The pieces the Documents drive and a case's Documents tab share: every case
 * has two folders, "Case files" (the client sees them) and "Internal" (the
 * firm only), and the firm can make its own folders inside either.
 */

export type Side = "CLIENT" | "INTERNAL";
export type Folder = { id: string; name: string; visibility: Side };

export const SIDES: Side[] = ["CLIENT", "INTERNAL"];

export const SIDE_LABEL: Record<Side, string> = { CLIENT: "Case files", INTERNAL: "Internal" };

export function sideHint(side: Side, staff: boolean) {
  if (side === "INTERNAL") return "Firm only — the client does not see these";
  return staff ? "Shared with the client: court orders, their uploads, the firm's files" : "Court orders, your uploads and what the firm shares with you";
}

/** Where a file came from, shown on its row. */
export function sourceOf(doc: DocumentRecord): { label: string; tone: string } {
  if (doc.fromCourt) return { label: "From the court", tone: "bg-sky-50 text-sky-800" };
  if (doc.uploadedByClientId || (doc.uploadedByClient && !doc.uploadedByUser)) return { label: "From the client", tone: "bg-amber-50 text-amber-800" };
  return { label: "From the firm", tone: "bg-paper-tint text-ink-soft" };
}

export function SourceTag({ doc }: { doc: DocumentRecord }) {
  const source = sourceOf(doc);
  return <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${source.tone}`}>{source.label}</span>;
}

/** Files in one place: a side's top level, or one of the firm's folders. */
export function filesIn(documents: DocumentRecord[], side: Side, folder: Folder | null, folders: Folder[]) {
  return documents.filter((doc) => {
    if ((doc.visibility === "INTERNAL" ? "INTERNAL" : "CLIENT") !== side) return false;
    if (folder) return doc.folderId === folder.id;
    return !doc.folderId || !folders.some((f) => f.id === doc.folderId);
  });
}

export function countSide(documents: DocumentRecord[], side: Side) {
  return documents.filter((doc) => (doc.visibility === "INTERNAL" ? "INTERNAL" : "CLIENT") === side).length;
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
        {subtitle && <span className="mt-0.5 block truncate text-xs text-slate">{subtitle}</span>}
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

/** "Move to" for staff: either side's top, or any of the case's folders. */
export function MoveSelect({ doc, folders, onMove }: { doc: DocumentRecord; folders: Folder[]; onMove: (body: { folderId: string | null; visibility?: Side }) => void }) {
  const here = doc.folderId && folders.some((f) => f.id === doc.folderId) ? `folder:${doc.folderId}` : `side:${doc.visibility}`;
  return (
    <select
      aria-label="Move to"
      value={here}
      onChange={(event) => {
        const [kind, value] = event.target.value.split(":");
        onMove(kind === "folder" ? { folderId: value } : { folderId: null, visibility: value as Side });
      }}
      className="max-w-[11rem] rounded-md border border-line bg-white px-2 py-1 text-xs font-normal text-ink-soft"
    >
      {SIDES.map((side) => (
        <optgroup key={side} label={SIDE_LABEL[side]}>
          <option value={`side:${side}`}>{SIDE_LABEL[side]}</option>
          {folders
            .filter((folder) => folder.visibility === side)
            .map((folder) => (
              <option key={folder.id} value={`folder:${folder.id}`}>
                {SIDE_LABEL[side]} / {folder.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
