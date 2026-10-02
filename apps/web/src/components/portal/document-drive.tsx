"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, downloadUrl, type CaseSummary, type DocumentRecord, type Page } from "@/lib/portal/api";
import { DOCUMENT_CATEGORIES, labelFor } from "@/lib/portal/legal";
import { courtNumber, formatBytes, formatDate } from "@/lib/portal/format";
import { Breadcrumbs, FolderTile, MoveSelect, SourceTag, countSection, filesIn, sectionHint, sectionLabel, sectionTone, sectionsFor, type Folder, type Section } from "@/components/portal/document-folders";
import { CaseUpload, type Place } from "@/components/portal/upload-button";
import { UploadForm } from "@/components/portal/documents-panel";
import { Button, Card, EmptyState, ErrorNote, Input, Modal, Spinner, StatusBadge } from "@/components/portal/ui";

/**
 * Documents as a drive: folders, not one long list.
 *
 *   Documents
 *   ├── Internal                 staff only: the whole firm's templates,
 *   │                            precedents and forms
 *   └── <one folder per case>
 *       ├── Internal             the firm's working papers
 *       ├── From client          what the client sends, what the firm shares
 *       └── From court           court orders and filed papers
 *           (each with any folders the firm made inside it)
 *
 * The admin console, a lawyer's dashboard and the client's dashboard all
 * read the same files. Clients see From court and their Client files. A
 * file moved into a folder takes that folder's section. Each file is tagged
 * with where it came from: the court's website, the client or the firm.
 */

type Location =
  | { kind: "root" }
  | { kind: "team" }
  | { kind: "case"; case: CaseSummary; side?: Section; folder?: Folder };

/** A file-type badge from the extension: PDF, DOC, XLS, IMG, TXT. */
function FileIcon({ filename }: { filename?: string }) {
  const ext = filename?.split(".").pop()?.toLowerCase() ?? "";
  const kind = ext === "pdf" ? "PDF" : /^docx?$/.test(ext) ? "DOC" : /^xlsx?$|^csv$/.test(ext) ? "XLS" : /^(png|jpe?g|webp|gif|heic)$/.test(ext) ? "IMG" : "TXT";
  const colour = kind === "PDF" ? "bg-red-50 text-red-700" : kind === "DOC" ? "bg-sky-50 text-sky-700" : kind === "XLS" ? "bg-emerald-50 text-emerald-700" : kind === "IMG" ? "bg-amber-50 text-amber-700" : "bg-paper-tint text-ink-soft";
  return <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[0.6rem] font-bold tracking-wide ${colour}`}>{kind}</span>;
}

function FileList({
  documents,
  staff,
  folders,
  onMoved,
}: {
  documents: DocumentRecord[];
  staff: boolean;
  folders?: Folder[];
  onMoved?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  if (documents.length === 0) {
    return <EmptyState title="No files here yet" />;
  }

  async function move(doc: DocumentRecord, body: { folderId: string | null; section?: Section }) {
    setError(null);
    try {
      await api(`/documents/${encodeURIComponent(doc.reference)}`, { method: "PATCH", body });
      onMoved?.();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <>
      {error && <div className="px-5 pt-3"><ErrorNote>{error}</ErrorNote></div>}
      <ul className="divide-y divide-line">
        {documents.map((doc) => {
          const latest = doc.versions[0];
          const viewable = latest && /^(application\/pdf|image\/(png|jpeg|webp))$/.test(latest.mimeType);
          return (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <FileIcon filename={latest?.filename} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {doc.title}
                  {doc.currentVersion > 1 && <span className="ml-2 text-xs font-normal text-gold-deep">v{doc.currentVersion}</span>}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate">
                  <SourceTag doc={doc} />
                  <span className="truncate">
                    {[
                      labelFor(DOCUMENT_CATEGORIES, doc.category),
                      doc.uploadedByUser?.name ?? doc.uploadedByClient?.name,
                      formatDate(doc.createdAt),
                      latest && formatBytes(latest.sizeBytes),
                      staff ? doc.reference : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
                {staff && folders && <MoveSelect doc={doc} folders={folders} onMove={(body) => void move(doc, body)} />}
                {viewable && (
                  <a href={downloadUrl(doc.reference, { inline: true })} target="_blank" rel="noopener" className="text-gold-deep hover:underline">
                    View
                  </a>
                )}
                <a href={downloadUrl(doc.reference)} className="text-gold-deep hover:underline">Download</a>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function DocumentDrive({
  basePath,
  staff,
  onPlaceChange,
}: {
  basePath: string;
  staff: boolean;
  /** Told where the drive is (case, section, folder), so the page's own
      "Upload document" button starts there. */
  onPlaceChange?: (place: Place | null) => void;
}) {
  const [location, setLocation] = useState<Location>({ kind: "root" });
  const openCaseReference = location.kind === "case" ? location.case.reference : null;
  const openSection = location.kind === "case" ? location.side : undefined;
  const openFolderId = location.kind === "case" ? location.folder?.id : undefined;
  const inTeam = location.kind === "team";
  useEffect(() => {
    onPlaceChange?.(
      inTeam ? { caseReference: null, team: true } : openCaseReference ? { caseReference: openCaseReference, section: openSection, folderId: openFolderId } : null,
    );
  }, [inTeam, openCaseReference, openSection, openFolderId, onPlaceChange]);
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [teamCount, setTeamCount] = useState<number | null>(null);
  /* Files, keyed by the folder they were loaded for, so moving to another
     folder shows a spinner rather than the previous folder's files. */
  const [loaded, setLoaded] = useState<{ key: string; files: DocumentRecord[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((n) => n + 1);

  // The root: every case as a folder, plus the team folder for staff.
  useEffect(() => {
    if (location.kind !== "root") return;
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "100" });
    if (query.trim()) params.set("q", query.trim());
    const timer = setTimeout(() => {
      api<Page<CaseSummary>>(`/cases?${params}`, { signal: controller.signal })
        .then((page) => setCases(page.data))
        .catch((cause: Error) => cause.name !== "AbortError" && setError(cause.message));
      if (staff) {
        api<Page<DocumentRecord>>("/documents?team=1&limit=100", { signal: controller.signal })
          .then((page) => setTeamCount(page.data.length))
          .catch(() => undefined);
      }
    }, query ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [location.kind, query, staff, version]);

  // Inside a case or the team folder: its files. Subfolders of a case share
  // one list, split by `byFolder` below.
  const sourceKey =
    location.kind === "team" ? "team" : location.kind === "case" ? `case:${location.case.reference}` : null;

  useEffect(() => {
    if (!sourceKey) return;
    const controller = new AbortController();
    const path =
      sourceKey === "team"
        ? "/documents?team=1&limit=100"
        : `/documents?case=${encodeURIComponent(sourceKey.slice(5))}&limit=100`;
    api<Page<DocumentRecord>>(path, { signal: controller.signal })
      .then((page) => setLoaded({ key: `${sourceKey}#${version}`, files: page.data }))
      .catch((cause: Error) => cause.name !== "AbortError" && setError(cause.message));
    return () => controller.abort();
  }, [sourceKey, version]);

  const files = loaded && loaded.key === `${sourceKey}#${version}` ? loaded.files : null;

  // The case's own folders, for the case being looked at.
  const caseRef = location.kind === "case" ? location.case.reference : null;
  const [folders, setFolders] = useState<{ key: string; list: Folder[] } | null>(null);
  useEffect(() => {
    if (!caseRef) return;
    const controller = new AbortController();
    api<{ data: Folder[] }>(`/cases/${encodeURIComponent(caseRef)}/folders`, { signal: controller.signal })
      .then((result) => setFolders({ key: `${caseRef}#${version}`, list: result.data }))
      .catch((cause: Error) => cause.name !== "AbortError" && setError(cause.message));
    return () => controller.abort();
  }, [caseRef, version]);
  const caseFolders = folders && folders.key === `${caseRef}#${version}` ? folders.list : null;

  const goRoot = () => setLocation({ kind: "root" });
  const openCase = (c: CaseSummary) => setLocation({ kind: "case", case: c });

  const [naming, setNaming] = useState<{ mode: "new" | "rename"; name: string } | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  async function saveFolder(event: React.FormEvent) {
    event.preventDefault();
    if (location.kind !== "case" || !location.side || !naming) return;
    setFolderError(null);
    const base = `/cases/${encodeURIComponent(location.case.reference)}/folders`;
    try {
      if (naming.mode === "new") {
        await api<Folder>(base, { method: "POST", body: { name: naming.name, section: location.side } });
      } else if (location.folder) {
        const renamed = await api<Folder>(`${base}/${location.folder.id}`, { method: "PATCH", body: { name: naming.name } });
        setLocation({ ...location, folder: renamed });
      }
      setNaming(null);
      refresh();
    } catch (cause) {
      setFolderError((cause as Error).message);
    }
  }

  async function deleteFolder() {
    if (location.kind !== "case" || !location.folder) return;
    if (!window.confirm(`Delete the folder “${location.folder.name}”? Its files are kept and move up to ${sectionLabel(location.folder.section, staff)}.`)) return;
    try {
      await api(`/cases/${encodeURIComponent(location.case.reference)}/folders/${location.folder.id}`, { method: "DELETE" });
      setLocation({ kind: "case", case: location.case, side: location.folder.section });
      refresh();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  // Uploading from inside a case asks which folder, starting on the one open.
  // Clients upload into Client files only.
  const mayUpload = location.kind === "team" || (location.kind === "case" && (staff || !location.side || location.side === "CLIENT"));

  const shownFiles = location.kind === "case" && location.side && caseFolders ? filesIn(files ?? [], location.side, location.folder ?? null, caseFolders) : [];

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <Breadcrumbs
          trail={
            location.kind === "root"
              ? [{ label: "Documents" }]
              : location.kind === "team"
                ? [{ label: "Documents", onClick: goRoot }, { label: "Internal" }]
                : [
                    { label: "Documents", onClick: goRoot },
                    location.side
                      ? { label: location.case.reference, onClick: () => setLocation({ kind: "case", case: location.case }) }
                      : { label: location.case.reference },
                    ...(location.side
                      ? [
                          location.folder
                            ? { label: sectionLabel(location.side, staff), onClick: () => setLocation({ kind: "case", case: location.case, side: location.side }) }
                            : { label: sectionLabel(location.side, staff) },
                        ]
                      : []),
                    ...(location.folder ? [{ label: location.folder.name }] : []),
                  ]
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          {location.kind === "case" && (
            <Link href={`${basePath}/cases/${location.case.reference}`} className="text-xs font-semibold text-slate hover:text-ink">
              Open case →
            </Link>
          )}
          {staff && location.kind === "case" && location.side && location.folder && (
            <>
              <Button size="sm" tone="ghost" onClick={() => setNaming({ mode: "rename", name: location.folder!.name })}>
                Rename
              </Button>
              <Button size="sm" tone="ghost" onClick={() => void deleteFolder()}>
                Delete folder
              </Button>
            </>
          )}
          {staff && location.kind === "case" && location.side && !location.folder && (
            <Button size="sm" tone="secondary" onClick={() => setNaming({ mode: "new", name: "" })}>
              New folder
            </Button>
          )}
          {mayUpload && <Button size="sm" onClick={() => setUploading(true)}>Upload</Button>}
        </div>
      </div>

      {error && <div className="p-4"><ErrorNote>{error}</ErrorNote></div>}

      {location.kind === "root" && (
        <div className="space-y-5 p-5">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={staff ? "Find a case folder by reference, title, case number, CNR, party or client" : "Find a case"}
            aria-label="Search folders"
          />
          {!cases ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {staff && !query && (
                <FolderTile
                  title="Internal"
                  subtitle="The whole firm's templates, precedents and forms. Firm only"
                  count={teamCount ?? undefined}
                  tone="slate"
                  onOpen={() => setLocation({ kind: "team" })}
                />
              )}
              {cases.map((c) => (
                <FolderTile
                  key={c.id}
                  title={c.title}
                  subtitle={[c.reference, courtNumber(c)].filter(Boolean).join(" · ")}
                  count={c._count.documents}
                  onOpen={() => openCase(c)}
                />
              ))}
              {cases.length === 0 && <p className="text-sm text-slate sm:col-span-2">{query ? "No matching case." : "No cases yet."}</p>}
            </div>
          )}
        </div>
      )}

      {location.kind === "case" && !location.side && (
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={location.case.status} />
            <span className="font-semibold text-ink">{location.case.title}</span>
          </div>
          {!files ? (
            <Spinner />
          ) : (
            <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${staff ? "lg:grid-cols-3" : ""}`}>
              {sectionsFor(staff).map((side) => (
                <FolderTile
                  key={side}
                  title={sectionLabel(side, staff)}
                  subtitle={sectionHint(side, staff)}
                  count={countSection(files, side)}
                  tone={sectionTone(side)}
                  onOpen={() => setLocation({ kind: "case", case: location.case, side })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {location.kind === "case" && location.side && (
        !files || !caseFolders ? (
          <Spinner />
        ) : (
          <>
            {!location.folder && caseFolders.some((f) => f.section === location.side) && (
              <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                {caseFolders
                  .filter((folder) => folder.section === location.side)
                  .map((folder) => (
                    <FolderTile
                      key={folder.id}
                      title={folder.name}
                      count={files.filter((doc) => doc.folderId === folder.id).length}
                      tone={sectionTone(location.side!)}
                      onOpen={() => setLocation({ kind: "case", case: location.case, side: location.side, folder })}
                    />
                  ))}
              </div>
            )}
            <FileList documents={shownFiles} staff={staff} folders={staff ? caseFolders : undefined} onMoved={refresh} />
          </>
        )
      )}
      {location.kind === "team" && (files ? <FileList documents={files} staff={staff} /> : <Spinner />)}

      <Modal open={uploading} onClose={() => setUploading(false)} title={location.kind === "team" ? "Upload to Internal (the whole firm)" : "Upload a document"}>
        {uploading && location.kind === "team" && (
          <UploadForm
            action="/api/documents/team"
            onDone={() => {
              setUploading(false);
              refresh();
            }}
          />
        )}
        {uploading && location.kind === "case" && (
          <CaseUpload
            caseReference={location.case.reference}
            staff={staff}
            initial={location.side ? { section: location.side, folderId: location.folder?.id } : undefined}
            onDone={() => {
              setUploading(false);
              refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={naming !== null} onClose={() => setNaming(null)} title={naming?.mode === "rename" ? "Rename folder" : "New folder"}>
        {naming && (
          <form onSubmit={saveFolder} className="space-y-4">
            {location.kind === "case" && location.side && naming.mode === "new" && (
              <p className="text-sm text-ink-soft">
                Inside <span className="font-semibold">{sectionLabel(location.side, staff)}</span>
                {location.side === "INTERNAL" ? ". The client never sees it." : ". The client can see it and its files."}
              </p>
            )}
            <Input autoFocus maxLength={80} value={naming.name} onChange={(e) => setNaming({ ...naming, name: e.target.value })} placeholder="e.g. Pleadings, Evidence, Correspondence" />
            <ErrorNote>{folderError}</ErrorNote>
            <Button type="submit" disabled={!naming.name.trim()}>
              {naming.mode === "rename" ? "Rename" : "Create folder"}
            </Button>
          </form>
        )}
      </Modal>
    </Card>
  );
}
