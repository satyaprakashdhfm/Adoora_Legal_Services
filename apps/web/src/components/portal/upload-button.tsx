"use client";

import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { courtNumber } from "@/lib/portal/format";
import { UploadForm } from "@/components/portal/documents-panel";
import { NoCaseYet } from "@/components/portal/no-case-yet";
import { Button, EmptyState, Field, Modal, Select, Spinner } from "@/components/portal/ui";

/**
 * "Upload document" from anywhere in the dashboard, not only from inside a
 * case. Every document belongs to a case (that is what decides who can see
 * it), so the dialog asks which case it is for first. A client with no case
 * yet is told to contact the firm.
 *
 * The case is chosen afresh every time the dialog opens: the one the page is
 * showing (`caseReference`, e.g. the case folder open in the Documents
 * drive), else the only case if there is just one, else nothing, so the
 * person has to pick. It never carries over an earlier choice, which once
 * sent files to a case other than the one on screen.
 */
export function UploadButton({
  onUploaded,
  tone = "primary",
  caseReference = null,
}: {
  onUploaded?: () => void;
  tone?: "primary" | "secondary";
  /** The case the page is currently showing, if any. */
  caseReference?: string | null;
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
          caseReference && usable.some((c) => c.reference === caseReference)
            ? caseReference
            : usable.length === 1
              ? usable[0].reference
              : "",
        );
      })
      .catch(() => setCases([]));
  }, [open, caseReference]);

  /* Only ever upload to a case that is in the list on screen. */
  const target = cases?.find((c) => c.reference === reference) ?? null;

  function close() {
    setOpen(false);
    setDone(null);
    setCases(null);
    setReference("");
  }

  return (
    <>
      <Button tone={tone} onClick={() => setOpen(true)}>
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
              {done}. {client ? "Your lawyers can see it on the case now." : "It is on the case now."}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button tone="secondary" onClick={() => setDone(null)}>Upload another</Button>
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : !cases ? (
          <Spinner />
        ) : cases.length === 0 ? (
          client ? (
            <NoCaseYet />
          ) : (
            <EmptyState title="No open cases">Documents are uploaded to a case. You have no open cases assigned.</EmptyState>
          )
        ) : (
          <div className="space-y-5">
            <Field label={client ? "Which case is this for?" : "Case"} required>
              <Select
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Choose a case"
                promptOnly
                options={cases.map((c) => ({
                  value: c.reference,
                  label: [c.title, courtNumber(c), c.reference].filter(Boolean).join(" · "),
                }))}
              />
            </Field>
            {target ? (
              <UploadForm
                key={target.reference}
                action={`/api/cases/${encodeURIComponent(target.reference)}/documents`}
                staff={!client}
                onDone={() => {
                  setDone(`Added to ${target.title} (${target.reference})`);
                  onUploaded?.();
                }}
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
