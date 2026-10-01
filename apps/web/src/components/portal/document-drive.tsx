"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, downloadUrl, type CaseSummary, type DocumentRecord, type Page } from "@/lib/portal/api";
import { DOCUMENT_CATEGORIES, labelFor } from "@/lib/portal/legal";
import { courtNumber, formatBytes, formatDate } from "@/lib/portal/format";
import { UploadForm } from "@/components/portal/documents-panel";
import { Breadcrumbs, FolderTile, MoveSelect, SIDE_LABEL, SIDES, SourceTag, sideHint, type Folder, type Side } from "@/components/portal/document-folders";
import { Button, Card, EmptyState, ErrorNote, Input, Modal, Spinner, StatusBadge } from "@/components/portal/ui";

/**
 * Documents as a drive: folders, not one long list.
 *
 *   Documents
 *   ├── Team shared              staff only — templates, precedents, forms
 *   └── <one folder per case>
 *       ├── Case files           everything the client sees: court orders,
 *       │   └── <firm folders>   their own uploads, what the firm shares
 *       └── Internal             the firm's working papers
 *           └── <firm folders>
 *
 * The two sides are the documents' visibility, so the admin console, a
 * lawyer's dashboard and the client's dashboard all read the same files.
 * The firm can make folders inside either side; a file moved into one takes
 * that side's visibility. Clients see only Case files. Each file is tagged
 * with where it came from: the court, the client or the firm.
 */

type Location =
  | { kind: "root" }
  | { kind: "team" }
  | { kind: "case"; case: CaseSummary; side?: Side; folder?: Folder };

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

  async function move(doc: DocumentRecord, body: { folderId: string | null; visibility?: Side }) {
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
  onCaseChange,
}: {
  basePath: string;
  staff: boolean;
  /** Told which case folder is open (null outside one), so the page's own
      "Upload document" button starts on that case. */
  onCaseChange?: (reference: string | null) => void;
}) {
  const [location, setLocation] = useState<Location>({ kind: "root" });
  const openCaseReference = location.kind === "case" ? location.case.reference : null;
  useEffect(() => {
    onCaseChange?.(openCaseReference);
  }, [openCaseReference, onCaseChange]);
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

  const bySide = useMemo(() => {
    const groups: Record<Side, DocumentRecord[]> = { CLIENT: [], INTERNAL: [] };
    for (const doc of files ?? []) groups[doc.visibility === "INTERNAL" ? "INTERNAL" : "CLIENT"].push(doc);
    return groups;
  }, [files]);

  const goRoot = () => setLocation({ kind: "root" });
  // A client has one side only, so a case opens straight into it.
  const openCase = (c: CaseSummary) => setLocation(staff ? { kind: "case", case: c } : { kind: "case", case: c, side: "CLIENT" });

  const [naming, setNaming] = useState<{ mode: "new" | "rename"; name: string } | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  async function saveFolder(event: React.FormEvent) {
    event.preventDefault();
    if (location.kind !== "case" || !location.side || !naming) return;
    setFolderError(null);
    const base = `/cases/${encodeURIComponent(location.case.reference)}/folders`;
    try {
      if (naming.mode === "new") {
        await api<Folder>(base, { method: "POST", body: { name: naming.name, visibility: location.side } });
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
    if (!window.confirm(`Delete the folder “${location.folder.name}”? Its files are kept and move up to ${SIDE_LABEL[location.folder.visibility]}.`)) return;
    try {
      await api(`/cases/${encodeURIComponent(location.case.reference)}/folders/${location.folder.id}`, { method: "DELETE" });
      setLocation({ kind: "case", case: location.case, side: location.folder.visibility });
      refresh();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  // Where an upload goes, from where you are. Clients upload into Case files only.
  const upload =
    location.kind === "team"
      ? { action: "/api/documents/team", visibility: "INTERNAL" as const, label: "Team shared", folderId: undefined }
      : location.kind === "case" && location.side && (staff || location.side === "CLIENT")
        ? {
            action: `/api/cases/${encodeURIComponent(location.case.reference)}/documents`,
            visibility: location.side,
            label: location.folder?.name ?? SIDE_LABEL[location.side],
            folderId: location.folder?.id,
          }
        : null;

  const shownFiles =
    location.kind === "case" && location.side
      ? bySide[location.side].filter((doc) => (location.folder ? doc.folderId === location.folder.id : !doc.folderId || !caseFolders?.some((f) => f.id === doc.folderId)))
      : [];

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <Breadcrumbs
          trail={
            location.kind === "root"
              ? [{ label: "Documents" }]
              : location.kind === "team"
                ? [{ label: "Documents", onClick: goRoot }, { label: "Team shared" }]
                : [
                    { label: "Documents", onClick: goRoot },
                    location.side && staff
                      ? { label: location.case.reference, onClick: () => setLocation({ kind: "case", case: location.case }) }
                      : { label: location.case.reference },
                    ...(location.side && staff
                      ? [
                          location.folder
                            ? { label: SIDE_LABEL[location.side], onClick: () => setLocation({ kind: "case", case: location.case, side: location.side }) }
                            : { label: SIDE_LABEL[location.side] },
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
          {upload && <Button size="sm" onClick={() => setUploading(true)}>Upload here</Button>}
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {staff && !query && (
                <FolderTile
                  title="Team shared"
                  subtitle="Templates, precedents and forms for the whole firm"
                  count={teamCount ?? undefined}
                  tone="ink"
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
            <div className="grid gap-3 sm:grid-cols-2">
              {SIDES.map((side) => (
                <FolderTile
                  key={side}
                  title={SIDE_LABEL[side]}
                  subtitle={sideHint(side, staff)}
                  count={bySide[side].length}
                  tone={side === "INTERNAL" ? "slate" : "gold"}
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
            {!location.folder && caseFolders.some((f) => f.visibility === location.side) && (
              <div className="grid gap-3 border-b border-line p-5 sm:grid-cols-2 xl:grid-cols-3">
                {caseFolders
                  .filter((folder) => folder.visibility === location.side)
                  .map((folder) => (
                    <FolderTile
                      key={folder.id}
                      title={folder.name}
                      count={bySide[location.side!].filter((doc) => doc.folderId === folder.id).length}
                      tone={location.side === "INTERNAL" ? "slate" : "gold"}
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

      <Modal open={uploading} onClose={() => setUploading(false)} title={upload ? `Upload to ${upload.label}` : "Upload"}>
        {uploading && upload && (
          <UploadForm
            action={upload.action}
            staff={staff}
            fixedVisibility={upload.visibility}
            folderId={upload.folderId}
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
                Inside <span className="font-semibold">{SIDE_LABEL[location.side]}</span>
                {location.side === "CLIENT" ? " — the client can see it and its files." : " — the client never sees it."}
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
