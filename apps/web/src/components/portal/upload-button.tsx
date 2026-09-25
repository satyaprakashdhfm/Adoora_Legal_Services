"use client";

import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { courtNumber } from "@/lib/portal/format";
import { UploadForm } from "@/components/portal/documents-panel";
import { NewCaseButton } from "@/components/portal/new-case-dialog";
import { Button, EmptyState, Field, Modal, Select, Spinner } from "@/components/portal/ui";

/**
 * "Upload document" from anywhere in the dashboard, not only from inside a
 * case. Every document belongs to a case — that is what decides who can see
 * it — so the dialog asks which matter it is for first. A client with no
 * matter yet is sent to open one.
 */
export function UploadButton({
  onUploaded,
  tone = "primary",
}: {
  onUploaded?: () => void;
  tone?: "primary" | "secondary";
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
        setReference((current) => current || usable[0]?.reference || "");
      })
      .catch(() => setCases([]));
  }, [open]);

  function close() {
    setOpen(false);
    setDone(null);
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
              {done}. {client ? "Your lawyers can see it on the matter now." : "It is on the case now."}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button tone="secondary" onClick={() => setDone(null)}>Upload another</Button>
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : !cases ? (
          <Spinner />
        ) : cases.length === 0 ? (
          <EmptyState
            title={client ? "Open a matter first" : "No open cases"}
            action={client ? <NewCaseButton /> : undefined}
          >
            {client
              ? "Documents are kept with the matter they belong to, so only the lawyers on that matter can see them. Tell us briefly what it is about, then upload."
              : "Documents are uploaded to a case. You have no open cases assigned."}
          </EmptyState>
        ) : (
          <div className="space-y-5">
            <Field label={client ? "Which matter is this for?" : "Case"} required>
              <Select
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                options={cases.map((c) => ({
                  value: c.reference,
                  label: [c.title, courtNumber(c), c.reference].filter(Boolean).join(" · "),
                }))}
              />
            </Field>
            {reference && (
              <UploadForm
                key={reference}
                action={`/api/cases/${encodeURIComponent(reference)}/documents`}
                staff={!client}
                onDone={() => {
                  setDone(`Added to ${cases.find((c) => c.reference === reference)?.title ?? reference}`);
                  onUploaded?.();
                }}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
