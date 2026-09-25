"use client";

import { useRef, useState } from "react";
import { api, ApiError, downloadUrl, type DocumentRecord, type SessionUser } from "@/lib/portal/api";
import { ACCEPTED_UPLOADS, DOCUMENT_CATEGORIES, labelFor } from "@/lib/portal/legal";
import { formatBytes, formatDate } from "@/lib/portal/format";
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
  VisibilityBadge,
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
  staff,
  newVersionOf,
  onDone,
}: {
  action: string;
  staff: boolean;
  newVersionOf?: string;
  onDone: () => void;
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
          {staff && (
            <Field label="Who can see it" className="sm:col-span-2">
              <Select
                name="visibility"
                defaultValue="CLIENT"
                options={[
                  { value: "CLIENT", label: "Shared with the client" },
                  { value: "INTERNAL", label: "Internal — firm only" },
                ]}
              />
            </Field>
          )}
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

/** A case's documents: list, upload, versions, sharing. */
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionOf, setVersionOf] = useState<DocumentRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const staff = user.kind === "staff";

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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">Documents</h2>
          <p className="text-sm text-slate">
            {staff
              ? "Encrypted at rest. Every download is recorded in the audit log."
              : "Files you upload are encrypted and seen only by you and the lawyers on this matter."}
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>Upload document</Button>
      </div>

      <div className="space-y-3 px-5 pt-4 empty:hidden">
        <SuccessNote>{notice}</SuccessNote>
        <ErrorNote>{error}</ErrorNote>
      </div>

      {documents.length === 0 ? (
        <EmptyState title="No documents yet">
          {staff ? "Upload pleadings, orders and correspondence here." : "Upload the papers you have — notices, agreements, court orders, identity documents."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {documents.map((doc) => {
            const latest = doc.versions[0];
            const mayVersion = canEdit || (user.kind === "client" && doc.uploadedByClientId === user.id);
            const previewable = latest && /^(application\/pdf|image\/(png|jpeg|webp))$/.test(latest.mimeType);

            return (
              <li key={doc.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{doc.title}</p>
                    {doc.currentVersion > 1 && <Badge tone="gold">v{doc.currentVersion}</Badge>}
                    {staff && <VisibilityBadge visibility={doc.visibility} />}
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate">{doc.reference}</p>
                  <p className="mt-1 text-xs text-slate">
                    {labelFor(DOCUMENT_CATEGORIES, doc.category)}
                    {latest && <> · {latest.filename} · {formatBytes(latest.sizeBytes)}</>}
                    {" · "}
                    {doc.uploadedByUser?.name ?? doc.uploadedByClient?.name ?? "—"}, {formatDate(doc.createdAt)}
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
                  {canEdit && (
                    <Button
                      tone="ghost"
                      size="sm"
                      onClick={() =>
                        void act(
                          api(`/documents/${doc.reference}`, {
                            method: "PATCH",
                            body: { visibility: doc.visibility === "CLIENT" ? "INTERNAL" : "CLIENT" },
                          }),
                          doc.visibility === "CLIENT" ? `${doc.reference} is now internal.` : `${doc.reference} is now shared with the client.`,
                        )
                      }
                    >
                      {doc.visibility === "CLIENT" ? "Make internal" : "Share with client"}
                    </Button>
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
        <UploadForm
          action={`/api/cases/${encodeURIComponent(caseReference)}/documents`}
          staff={staff}
          onDone={() => {
            setUploadOpen(false);
            setNotice("Document uploaded.");
            onChange();
          }}
        />
      </Modal>

      <Modal open={Boolean(versionOf)} onClose={() => setVersionOf(null)} title={`New version of ${versionOf?.title ?? ""}`}>
        {versionOf && (
          <>
            <p className="mb-4 text-sm text-slate">
              The current version stays available — nothing is overwritten.
            </p>
            <UploadForm
              action={`/api/documents/${encodeURIComponent(versionOf.reference)}/versions`}
              staff={staff}
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
    </div>
  );
}
