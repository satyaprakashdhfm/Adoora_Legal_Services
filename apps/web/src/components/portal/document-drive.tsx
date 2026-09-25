"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, downloadUrl, type CaseSummary, type DocumentRecord, type Page } from "@/lib/portal/api";
import { DOCUMENT_CATEGORIES, labelFor } from "@/lib/portal/legal";
import { courtNumber, formatBytes, formatDate } from "@/lib/portal/format";
import { UploadForm } from "@/components/portal/documents-panel";
import { Button, Card, EmptyState, ErrorNote, Input, Modal, Spinner, StatusBadge } from "@/components/portal/ui";

/**
 * Documents as a drive: folders, not one long list.
 *
 *   Documents
 *   ├── Team shared            staff only — templates, precedents, forms
 *   └── <one folder per case>
 *       ├── From the client    what the client uploaded
 *       ├── Shared with client what the firm filed for the client to see
 *       └── Internal           the firm's working papers (staff only)
 *
 * The folders are views over each document's uploader and visibility, so
 * the admin console, a lawyer's dashboard and the client's dashboard all
 * read the same files — an upload from any of them appears in the others.
 * Uploading inside a folder files the document there.
 */

type FolderId = "client" | "firm" | "internal";
type Location = { kind: "root" } | { kind: "team" } | { kind: "case"; case: CaseSummary; folder?: FolderId };

const FOLDER_ICON = "M2.5 5.5a1 1 0 011-1h4l1.5 1.5h7.5a1 1 0 011 1v8.5a1 1 0 01-1 1h-13a1 1 0 01-1-1z";

function folderLabel(folder: FolderId, staff: boolean) {
  if (folder === "client") return staff ? "From the client" : "My uploads";
  if (folder === "firm") return staff ? "Shared with client" : "From the firm";
  return "Internal — team only";
}

function folderHint(folder: FolderId, staff: boolean) {
  if (folder === "client") return staff ? "Uploaded by the client" : "Documents you have sent to the firm";
  if (folder === "firm") return staff ? "Filed by the firm, visible to the client" : "Documents your lawyers have shared with you";
  return "Working papers the client does not see";
}

function folderOf(doc: DocumentRecord): FolderId {
  if (doc.uploadedByClientId || (doc.uploadedByClient && !doc.uploadedByUser)) return "client";
  return doc.visibility === "INTERNAL" ? "internal" : "firm";
}

function FolderTile({
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

/** A file-type badge from the extension: PDF, DOC, XLS, IMG, TXT. */
function FileIcon({ filename }: { filename?: string }) {
  const ext = filename?.split(".").pop()?.toLowerCase() ?? "";
  const kind = ext === "pdf" ? "PDF" : /^docx?$/.test(ext) ? "DOC" : /^xlsx?$|^csv$/.test(ext) ? "XLS" : /^(png|jpe?g|webp|gif|heic)$/.test(ext) ? "IMG" : "TXT";
  const colour = kind === "PDF" ? "bg-red-50 text-red-700" : kind === "DOC" ? "bg-sky-50 text-sky-700" : kind === "XLS" ? "bg-emerald-50 text-emerald-700" : kind === "IMG" ? "bg-amber-50 text-amber-700" : "bg-paper-tint text-ink-soft";
  return <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[0.6rem] font-bold tracking-wide ${colour}`}>{kind}</span>;
}

function FileList({ documents, staff }: { documents: DocumentRecord[]; staff: boolean }) {
  if (documents.length === 0) {
    return <EmptyState title="This folder is empty" />;
  }
  return (
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
              <p className="truncate text-xs text-slate">
                {[
                  labelFor(DOCUMENT_CATEGORIES, doc.category),
                  doc.uploadedByUser?.name ?? doc.uploadedByClient?.name,
                  formatDate(doc.createdAt),
                  latest && formatBytes(latest.sizeBytes),
                  staff ? doc.reference : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-xs font-semibold">
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
  );
}

function Breadcrumbs({ trail }: { trail: { label: string; onClick?: () => void }[] }) {
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

export function DocumentDrive({ basePath, staff }: { basePath: string; staff: boolean }) {
  const [location, setLocation] = useState<Location>({ kind: "root" });
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

  const byFolder = useMemo(() => {
    const groups: Record<FolderId, DocumentRecord[]> = { client: [], firm: [], internal: [] };
    for (const doc of files ?? []) groups[folderOf(doc)].push(doc);
    return groups;
  }, [files]);

  const folders: FolderId[] = staff ? ["client", "firm", "internal"] : ["firm", "client"];
  const goRoot = () => setLocation({ kind: "root" });

  // Where an upload goes, from where you are.
  const upload =
    location.kind === "team"
      ? { action: "/api/documents/team", visibility: "INTERNAL" as const, label: "Team shared" }
      : location.kind === "case" && location.folder && (staff ? location.folder !== "client" : location.folder === "client")
        ? {
            action: `/api/cases/${encodeURIComponent(location.case.reference)}/documents`,
            visibility: location.folder === "internal" ? ("INTERNAL" as const) : ("CLIENT" as const),
            label: folderLabel(location.folder, staff),
          }
        : null;

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
                    location.folder
                      ? { label: location.case.reference, onClick: () => setLocation({ kind: "case", case: location.case }) }
                      : { label: location.case.reference },
                    ...(location.folder ? [{ label: folderLabel(location.folder, staff) }] : []),
                  ]
          }
        />
        <div className="flex items-center gap-2">
          {location.kind === "case" && (
            <Link href={`${basePath}/cases/${location.case.reference}`} className="text-xs font-semibold text-slate hover:text-ink">
              Open case →
            </Link>
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
            placeholder={staff ? "Find a case folder by reference, title, case number, CNR, party or client" : "Find a matter"}
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
                  onOpen={() => setLocation({ kind: "case", case: c })}
                />
              ))}
              {cases.length === 0 && (
                <p className="text-sm text-slate sm:col-span-2">{query ? "No matching case." : staff ? "No cases yet." : "No matters yet."}</p>
              )}
            </div>
          )}
        </div>
      )}

      {location.kind === "case" && !location.folder && (
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={location.case.status} />
            <span className="font-semibold text-ink">{location.case.title}</span>
          </div>
          {!files ? (
            <Spinner />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {folders.map((folder) => (
                <FolderTile
                  key={folder}
                  title={folderLabel(folder, staff)}
                  subtitle={folderHint(folder, staff)}
                  count={byFolder[folder].length}
                  tone={folder === "internal" ? "slate" : "gold"}
                  onOpen={() => setLocation({ kind: "case", case: location.case, folder })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {location.kind === "case" && location.folder && (files ? <FileList documents={byFolder[location.folder]} staff={staff} /> : <Spinner />)}
      {location.kind === "team" && (files ? <FileList documents={files} staff={staff} /> : <Spinner />)}

      <Modal open={uploading} onClose={() => setUploading(false)} title={upload ? `Upload to ${upload.label}` : "Upload"}>
        {uploading && upload && (
          <UploadForm
            action={upload.action}
            staff={staff}
            fixedVisibility={upload.visibility}
            onDone={() => {
              setUploading(false);
              refresh();
            }}
          />
        )}
      </Modal>
    </Card>
  );
}
