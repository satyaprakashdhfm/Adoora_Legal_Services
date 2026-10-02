"use client";

import { useEffect, useRef, useState } from "react";
import { AREA_HEADER, api, ApiError, currentArea, downloadUrl, type DocumentRecord, type SessionUser } from "@/lib/portal/api";
import { ACCEPTED_UPLOADS, DOCUMENT_CATEGORIES, labelFor } from "@/lib/portal/legal";
import { formatBytes, formatDate } from "@/lib/portal/format";
import { Breadcrumbs, FolderTile, MoveSelect, SourceTag, countSection, filesIn, sectionHint, sectionLabel, sectionTone, sectionsFor, type Folder, type Section } from "@/components/portal/document-folders";
import { CaseUpload } from "@/components/portal/upload-button";
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  SuccessNote,
  Textarea,
} from "@/components/portal/ui";

const MAX_MB = 25;

/**
 * Upload with progress. fetch() cannot report upload progress, and on a
 * 20 MB scan over mobile data a silent button for a minute reads as broken.
 */
function uploadWithProgress(url: string, body: FormData, onProgress: (fraction: number) => void) {
  return new Promise<unknown>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.setRequestHeader(AREA_HEADER, currentArea());
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let payload: { message?: string } | null = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON error page from a proxy.
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(payload);
      else reject(new ApiError(xhr.status, payload?.message ?? "The upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new ApiError(0, "The upload was interrupted. Please check your connection and try again."));
    xhr.send(body);
  });
}

export function UploadForm({
  action,
  newVersionOf,
  onDone,
  fixedSection,
  folderId,
}: {
  action: string;
  newVersionOf?: string;
  onDone: () => void;
  /** Which of the case's three folders it goes in (chosen before this form). */
  fixedSection?: Section;
  /** A folder the firm made inside the case; the upload is filed in it. */
  folderId?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Files can be up to ${MAX_MB} MB. Please split or compress larger scans.`);
      return;
    }

    const body = new FormData(event.currentTarget);
    body.set("file", file);
    setError(null);
    setProgress(0);

    try {
      await uploadWithProgress(action, body, setProgress);
      onDone();
    } catch (cause) {
      setError((cause as Error).message);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const dropped = event.dataTransfer.files[0];
          if (dropped) setFile(dropped);
        }}
        className="rounded-lg border-2 border-dashed border-line-strong bg-paper-warm px-4 py-6 text-center"
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_UPLOADS}
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <p className="text-sm text-ink">
            <strong>{file.name}</strong> <span className="text-slate">· {formatBytes(file.size)}</span>
          </p>
        ) : (
          <p className="text-sm text-slate">Drag a file here, or</p>
        )}
        <Button tone="secondary" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
          {file ? "Choose a different file" : "Choose a file"}
        </Button>
        <p className="mt-2 text-xs text-slate">PDF, Word, Excel, images and text · up to {MAX_MB} MB</p>
      </div>

      {!newVersionOf && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" hint="Defaults to the file name.">
            <Input name="title" maxLength={200} />
          </Field>
          <Field label="Type of document">
            <Select name="category" defaultValue="OTHER" options={DOCUMENT_CATEGORIES} />
          </Field>
          <Field label="Note" className="sm:col-span-2">
            <Textarea name="description" rows={2} maxLength={2000} />
          </Field>
          {fixedSection && <input type="hidden" name="section" value={fixedSection} />}
          {folderId && <input type="hidden" name="folderId" value={folderId} />}
        </div>
      )}

      <ErrorNote>{error}</ErrorNote>

      {progress !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-paper-tint" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-gold transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}

      <Button type="submit" disabled={progress !== null}>
        {progress !== null
          ? progress < 1
            ? `Uploading… ${Math.round(progress * 100)}%`
            : "Encrypting and saving…"
          : newVersionOf
            ? "Upload new version"
            : "Upload document"}
      </Button>
    </form>
  );
}

/**
 * A case's documents, in the same folders as the Documents drive:
 *
 *   Documents
 *   ├── Internal       firm only
 *   ├── From client    what the client sends, and what the firm shares
 *   └── From court     court orders and filed papers
 *       (each with any folders the firm made inside it)
 *
 * Clients see From court and their own Client files (From client).
 */
export function DocumentsPanel({
  caseReference,
  documents,
  user,
  canEdit,
  canManage,
  onChange,
}: {
  caseReference: string;
  documents: (DocumentRecord & { uploadedByClientId?: string | null })[];
  user: SessionUser;
  canEdit: boolean;
  canManage: boolean;
  onChange: () => void;
}) {
  const staff = user.kind === "staff";
  const [side, setSide] = useState<Section | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionOf, setVersionOf] = useState<DocumentRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [folderVersion, setFolderVersion] = useState(0);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    api<{ data: Folder[] }>(`/cases/${encodeURIComponent(caseReference)}/folders`, { signal: controller.signal })
      .then((result) => setFolders(result.data))
      .catch((cause: Error) => cause.name !== "AbortError" && setError(cause.message));
    return () => controller.abort();
  }, [caseReference, folderVersion]);

  const [naming, setNaming] = useState<{ mode: "new" | "rename"; name: string } | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);
  const folderBase = `/cases/${encodeURIComponent(caseReference)}/folders`;

  async function act(promise: Promise<unknown>, message: string) {
    setError(null);
    try {
      await promise;
      setNotice(message);
      onChange();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  async function saveFolder(event: React.FormEvent) {
    event.preventDefault();
    if (!side || !naming) return;
    setFolderError(null);
    try {
      if (naming.mode === "new") {
        await api<Folder>(folderBase, { method: "POST", body: { name: naming.name, section: side } });
      } else if (folder) {
        setFolder(await api<Folder>(`${folderBase}/${folder.id}`, { method: "PATCH", body: { name: naming.name } }));
      }
      setNaming(null);
      setFolderVersion((n) => n + 1);
    } catch (cause) {
      setFolderError((cause as Error).message);
    }
  }

  async function deleteFolder() {
    if (!folder) return;
    if (!window.confirm(`Delete the folder “${folder.name}”? Its files are kept and move up to ${sectionLabel(folder.section, staff)}.`)) return;
    try {
      await api(`${folderBase}/${folder.id}`, { method: "DELETE" });
      setFolder(null);
      setFolderVersion((n) => n + 1);
      onChange();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const open = (next: Section | null, inFolder: Folder | null = null) => {
    setSide(next);
    setFolder(inFolder);
    setNotice(null);
  };

  const trail = [
    side ? { label: "Documents", onClick: () => open(null) } : { label: "Documents" },
    ...(side ? [folder ? { label: sectionLabel(side, staff), onClick: () => open(side) } : { label: sectionLabel(side, staff) }] : []),
    ...(folder ? [{ label: folder.name }] : []),
  ];

  const here = side && folders ? filesIn(documents, side, folder, folders) : [];
  const subfolders = side && !folder ? (folders ?? []).filter((f) => f.section === side) : [];
  // Clients upload into Client files only.
  const mayUpload = staff || !side || side === "CLIENT";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <Breadcrumbs trail={trail} />
          <p className="mt-1 text-xs text-slate">
            {staff
              ? "Encrypted at rest. Every download is recorded in the audit log."
              : "Files you upload are encrypted and seen only by you and the lawyers on this case."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            {side && canEdit && folder && (
              <>
                <Button size="sm" tone="ghost" onClick={() => setNaming({ mode: "rename", name: folder.name })}>
                  Rename
                </Button>
                <Button size="sm" tone="ghost" onClick={() => void deleteFolder()}>
                  Delete folder
                </Button>
              </>
            )}
            {side && canEdit && !folder && (
              <Button size="sm" tone="secondary" onClick={() => setNaming({ mode: "new", name: "" })}>
                New folder
              </Button>
            )}
            {mayUpload && <Button size="sm" onClick={() => setUploadOpen(true)}>Upload</Button>}
          </div>
      </div>

      <div className="space-y-3 px-5 pt-4 empty:hidden">
        <SuccessNote>{notice}</SuccessNote>
        <ErrorNote>{error}</ErrorNote>
      </div>

      {!side && (
        <div className={`grid gap-3 p-5 sm:grid-cols-2 ${staff ? "lg:grid-cols-3" : ""}`}>
          {sectionsFor(staff).map((s) => (
            <FolderTile
              key={s}
              title={sectionLabel(s, staff)}
              subtitle={sectionHint(s, staff)}
              count={countSection(documents, s)}
              tone={sectionTone(s)}
              onOpen={() => open(s)}
            />
          ))}
        </div>
      )}

      {side && subfolders.length > 0 && (
        <div className="grid gap-3 border-b border-line p-5 sm:grid-cols-2 xl:grid-cols-3">
          {subfolders.map((f) => (
            <FolderTile
              key={f.id}
              title={f.name}
              count={documents.filter((doc) => doc.folderId === f.id).length}
              tone={sectionTone(side)}
              onOpen={() => open(side, f)}
            />
          ))}
        </div>
      )}

      {side && here.length === 0 && (
        <EmptyState title={subfolders.length ? "No loose files here" : "No files here yet"}>
          {side === "INTERNAL"
            ? "Working papers the client should not see."
            : side === "COURT"
              ? staff
                ? "Order PDFs from the court's website land here, and papers as filed."
                : "Court orders and the papers filed in your case appear here."
              : staff
                ? "The client's uploads, and anything the firm shares with them."
                : "Upload the papers you have: notices, agreements, identity documents."}
        </EmptyState>
      )}

      {side && here.length > 0 && (
        <ul className="divide-y divide-line">
          {here.map((doc) => {
            const latest = doc.versions[0];
            const mayVersion = canEdit || (user.kind === "client" && doc.uploadedByClientId === user.id);
            const previewable = latest && /^(application\/pdf|image\/(png|jpeg|webp))$/.test(latest.mimeType);

            return (
              <li key={doc.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{doc.title}</p>
                    {doc.currentVersion > 1 && <Badge tone="gold">v{doc.currentVersion}</Badge>}
                    <SourceTag doc={doc} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate">{doc.reference}</p>
                  <p className="mt-1 text-xs text-slate">
                    {labelFor(DOCUMENT_CATEGORIES, doc.category)}
                    {latest && <> · {latest.filename} · {formatBytes(latest.sizeBytes)}</>}
                    {" · "}
                    {doc.uploadedByUser?.name ?? doc.uploadedByClient?.name ?? (doc.fromCourt ? "Court website" : "—")}, {formatDate(doc.createdAt)}
                  </p>
                  {doc.description && <p className="mt-1.5 text-sm text-ink-soft">{doc.description}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {previewable && (
                    <a href={downloadUrl(doc.reference, { inline: true })} target="_blank" rel="noopener" className="text-xs font-semibold text-gold-deep hover:underline">
                      View
                    </a>
                  )}
                  <a href={downloadUrl(doc.reference)} className="text-xs font-semibold text-gold-deep hover:underline">
                    Download
                  </a>
                  {mayVersion && (
                    <Button tone="ghost" size="sm" onClick={() => setVersionOf(doc)}>
                      New version
                    </Button>
                  )}
                  {canEdit && folders && (
                    <MoveSelect
                      doc={doc}
                      folders={folders}
                      onMove={(body) => void act(api(`/documents/${doc.reference}`, { method: "PATCH", body }), `${doc.reference} moved.`)}
                    />
                  )}
                  {canManage && (
                    <Button
                      tone="danger"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Remove ${doc.reference} from the case? The stored file is kept for the record.`)) {
                          void act(api(`/documents/${doc.reference}`, { method: "DELETE" }), `${doc.reference} removed.`);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload a document">
        {uploadOpen && (
          <CaseUpload
            caseReference={caseReference}
            staff={staff}
            initial={side ? { section: side, folderId: folder?.id } : undefined}
            onDone={() => {
              setUploadOpen(false);
              setNotice("Document uploaded.");
              onChange();
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(versionOf)} onClose={() => setVersionOf(null)} title={`New version of ${versionOf?.title ?? ""}`}>
        {versionOf && (
          <>
            <p className="mb-4 text-sm text-slate">
              The current version stays available — nothing is overwritten.
            </p>
            <UploadForm
              action={`/api/documents/${encodeURIComponent(versionOf.reference)}/versions`}
              newVersionOf={versionOf.reference}
              onDone={() => {
                setVersionOf(null);
                setNotice("New version uploaded.");
                onChange();
              }}
            />
          </>
        )}
      </Modal>

      <Modal open={naming !== null} onClose={() => setNaming(null)} title={naming?.mode === "rename" ? "Rename folder" : "New folder"}>
        {naming && (
          <form onSubmit={saveFolder} className="space-y-4">
            {side && naming.mode === "new" && (
              <p className="text-sm text-ink-soft">
                Inside <span className="font-semibold">{sectionLabel(side, staff)}</span>
                {side === "INTERNAL" ? ". The client never sees it." : ". The client can see it and its files."}
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
    </div>
  );
}
