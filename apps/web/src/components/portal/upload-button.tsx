"use client";

import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { courtNumber } from "@/lib/portal/format";
import { UploadForm } from "@/components/portal/documents-panel";
import { NoCaseYet } from "@/components/portal/no-case-yet";
import { parsePlace, placeOptions, type Folder, type Section } from "@/components/portal/document-folders";
import { Button, EmptyState, ErrorNote, Field, Modal, Select, Spinner } from "@/components/portal/ui";

/** Where the Documents page is looking, so an upload starts there. */
export type Place = { caseReference: string | null; team?: boolean; section?: Section; folderId?: string };

/** The firm-wide Internal folder, in the case box. */
const FIRM_WIDE = "__firm";

/**
 * Upload into one of a case's folders: the person always chooses the folder
 * (Internal, From client, From court, or one the firm made inside them).
 * Clients can upload only into Client files. `initial` preselects where the
 * person is; it never guesses otherwise.
 */
export function CaseUpload({
  caseReference,
  staff,
  initial,
  onDone,
}: {
  caseReference: string;
  staff: boolean;
  initial?: { section?: Section; folderId?: string };
  onDone: () => void;
}) {
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState(() =>
    initial?.folderId ? `folder:${initial.folderId}` : initial?.section && (staff || initial.section === "CLIENT") ? `section:${initial.section}` : staff ? "" : "section:CLIENT",
  );

  useEffect(() => {
    const controller = new AbortController();
    api<{ data: Folder[] }>(`/cases/${encodeURIComponent(caseReference)}/folders`, { signal: controller.signal })
      .then((result) => setFolders(result.data))
      .catch((cause: Error) => cause.name !== "AbortError" && setError(cause.message));
    return () => controller.abort();
  }, [caseReference]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!folders) return <Spinner />;

  const options = placeOptions(folders, staff, staff ? undefined : ["CLIENT"]).flatMap((group) => group.options);
  const chosen = parsePlace(place, folders);

  return (
    <div className="space-y-5">
      <Field label="Folder" required hint={staff ? "Internal is firm only. The client sees From client and From court." : undefined}>
        <Select value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Choose a folder" promptOnly options={options} />
      </Field>
      {chosen ? (
        <UploadForm
          key={place}
          action={`/api/cases/${encodeURIComponent(caseReference)}/documents`}
          fixedSection={chosen.section}
          folderId={chosen.folderId}
          onDone={onDone}
        />
      ) : (
        <p className="text-sm text-slate">Choose the folder this document goes in.</p>
      )}
    </div>
  );
}

/**
 * "Upload document" on the Documents page. Every document belongs to a case
 * (that is what decides who can see it), or for the firm to the firm-wide
 * Internal folder, so the dialog asks which case, then which folder.
 *
 * It starts on the case and folder the page is showing (`place`), else the
 * only case if there is just one. It never carries over an earlier choice,
 * which once sent files to a case other than the one on screen.
 */
export function UploadButton({
  onUploaded,
  place = null,
}: {
  onUploaded?: () => void;
  /** Where the page is currently looking, if anywhere. */
  place?: Place | null;
}) {
  const user = useUser();
  const client = user.kind === "client";
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [reference, setReference] = useState("");
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api<Page<CaseSummary>>("/cases?limit=100")
      .then((page) => {
        // Closed matters are not somewhere new papers should go.
        const usable = page.data.filter((c) => !["CLOSED", "WITHDRAWN"].includes(c.status));
        setCases(usable);
        setReference(
          place?.team && !client
            ? FIRM_WIDE
            : place?.caseReference && usable.some((c) => c.reference === place.caseReference)
              ? place.caseReference
              : usable.length === 1
                ? usable[0].reference
                : "",
        );
      })
      .catch(() => setCases([]));
  }, [open, place, client]);

  /* Only ever upload to a case that is in the list on screen. */
  const target = cases?.find((c) => c.reference === reference) ?? null;

  function close() {
    setOpen(false);
    setDone(null);
    setCases(null);
    setReference("");
  }

  const finished = (where: string) => {
    setDone(where);
    onUploaded?.();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
          <path d="M8 11V2.5M4.5 6 8 2.5 11.5 6M2.5 11v2.5h11V11" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Upload document
      </Button>

      <Modal open={open} onClose={close} title="Upload a document">
        {done ? (
          <div className="py-4 text-center">
            <p className="font-serif text-lg font-semibold text-ink">Uploaded</p>
            <p className="mt-1 text-sm text-slate">
              {done}. {client ? "Your lawyers can see it on the case now." : ""}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button tone="secondary" onClick={() => setDone(null)}>Upload another</Button>
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : !cases ? (
          <Spinner />
        ) : cases.length === 0 && client ? (
          <NoCaseYet />
        ) : (
          <div className="space-y-5">
            {cases.length === 0 && <EmptyState title="No open cases">You have no open cases assigned. You can still upload to the firm-wide Internal folder.</EmptyState>}
            <Field label={client ? "Which case is this for?" : "Case"} required>
              <Select
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Choose a case"
                promptOnly
                options={[
                  ...(client ? [] : [{ value: FIRM_WIDE, label: "Internal: the whole firm (templates, precedents, forms)" }]),
                  ...cases.map((c) => ({
                    value: c.reference,
                    label: [c.title, courtNumber(c), c.reference].filter(Boolean).join(" · "),
                  })),
                ]}
              />
            </Field>
            {reference === FIRM_WIDE ? (
              <UploadForm action="/api/documents/team" onDone={() => finished("Added to the firm-wide Internal folder")} />
            ) : target ? (
              <CaseUpload
                key={target.reference}
                caseReference={target.reference}
                staff={!client}
                initial={place?.caseReference === target.reference ? { section: place.section, folderId: place.folderId } : undefined}
                onDone={() => finished(`Added to ${target.title} (${target.reference})`)}
              />
            ) : (
              <p className="text-sm text-slate">Choose the case this document belongs to.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
