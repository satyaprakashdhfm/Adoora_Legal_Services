"use client";

import { useState, type ReactNode } from "react";
import { Button, ErrorNote, Modal } from "@/components/portal/ui";

/**
 * The confirmation before anything is deleted for good: what will go, what
 * stays, and the word DELETE typed out so it cannot happen by a stray click.
 */
export function DeleteDialog({
  open,
  onClose,
  title,
  goes,
  stays,
  actionLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  goes: ReactNode[];
  stays?: ReactNode[];
  actionLabel: string;
  onConfirm: () => Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setTyped("");
    setError(null);
    onClose();
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="space-y-4 text-sm">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-900">
          <p className="font-semibold">This cannot be undone. Deleting removes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {goes.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
        {stays && stays.length > 0 && (
          <div>
            <p className="font-semibold text-ink">Kept:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate">
              {stays.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Type DELETE to confirm</span>
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="mt-1.5 w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
          />
        </label>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap gap-2">
          <Button tone="danger" disabled={typed.trim().toUpperCase() !== "DELETE" || busy} onClick={() => void confirm()}>
            {busy ? "Deleting…" : actionLabel}
          </Button>
          <Button tone="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
