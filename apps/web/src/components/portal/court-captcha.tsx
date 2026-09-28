"use client";

/* eslint-disable @next/next/no-img-element -- the captcha arrives as a data: URL from the API */
import Link from "next/link";
import { useState } from "react";
import { api, ApiError } from "@/lib/portal/api";
import { Button, ErrorNote } from "@/components/portal/ui";

type Portal = "district" | "hc";
type Session = { sessionId: string; captcha: string; portal?: Portal };

const OTHER: Record<Portal, { portal: Portal; label: string }> = {
  district: { portal: "hc", label: "Try the High Court website" },
  hc: { portal: "district", label: "Try the district courts website" },
};

/**
 * The court's website asks a person to type its captcha; this is that step,
 * for any lookup on it. `base` is the API path whose /start, /captcha and
 * /submit it calls. A result other than "wrong code" goes to `onResult`.
 *
 * When one website has no such case, the person may try the other: a CNR's
 * first letters do not always say whether a court is a High Court.
 */
export function CourtCaptcha<T>({
  base,
  startBody,
  submitLabel,
  onResult,
  caseHref,
}: {
  base: string;
  startBody?: Record<string, unknown>;
  submitLabel: string;
  onResult: (result: T) => void;
  /** Where a case already on file with this CNR opens, when the API says so. */
  caseHref?: (reference: string) => string;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"start" | "image" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [notFoundOn, setNotFoundOn] = useState<Portal | null>(null);
  const [duplicate, setDuplicate] = useState<string | null>(null);

  async function start(portal?: Portal) {
    setBusy("start");
    setError(null);
    setNote(null);
    setNotFoundOn(null);
    try {
      setSession(await api<Session>(`${base}/start`, { method: "POST", body: { ...startBody, portal } }));
    } catch (cause) {
      setError((cause as Error).message);
      if (cause instanceof ApiError && cause.code === "duplicate_case") setDuplicate(cause.message.match(/ALS-[A-Z0-9-]+/)?.[0] ?? null);
    } finally {
      setBusy(null);
    }
  }

  async function newImage() {
    if (!session) return;
    setBusy("image");
    setError(null);
    try {
      const next = await api<Session>(`${base}/captcha`, { method: "POST", body: { sessionId: session.sessionId } });
      setSession({ ...session, ...next });
      setCode("");
    } catch (cause) {
      setError((cause as Error).message);
      setSession(null);
    } finally {
      setBusy(null);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !code.trim()) return;
    setBusy("submit");
    setError(null);
    setNote(null);
    try {
      const result = await api<T & { retry?: boolean; captcha?: string }>(`${base}/submit`, {
        method: "POST",
        body: { sessionId: session.sessionId, code },
      });
      if (result.retry && result.captcha) {
        setSession({ ...session, captcha: result.captcha });
        setCode("");
        setNote("That did not match. Here is a new picture — please try again.");
        return;
      }
      onResult(result);
    } catch (cause) {
      setError((cause as Error).message);
      if (cause instanceof ApiError && cause.code === "portal_not_found" && session.portal) setNotFoundOn(session.portal);
      setSession(null);
      setCode("");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-paper-warm px-3 py-2 text-xs text-ink-soft">
        <span className="font-semibold">Why a captcha?</span> The court&apos;s website asks for this code to check a person is asking. We pass it straight to the court.
      </p>
      <ErrorNote>{error}</ErrorNote>
      {duplicate && caseHref && (
        <Link href={caseHref(duplicate)} className="inline-block text-sm font-semibold text-gold-deep underline underline-offset-2">
          Open {duplicate} →
        </Link>
      )}
      {note && <p className="text-sm text-amber-800">{note}</p>}

      {!session ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void start()} disabled={busy !== null}>
            {busy === "start" ? "Opening the court's website…" : "Show the court's captcha"}
          </Button>
          {notFoundOn && (
            <Button tone="secondary" onClick={() => void start(OTHER[notFoundOn].portal)} disabled={busy !== null}>
              {OTHER[notFoundOn].label}
            </Button>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <img src={session.captcha} alt="Captcha from the court's website" className="h-14 rounded border border-line bg-white" />
            <Button size="sm" tone="ghost" onClick={() => void newImage()} disabled={busy !== null}>
              {busy === "image" ? "Loading…" : "New picture"}
            </Button>
          </div>
          <label className="block text-xs font-semibold text-ink-soft">
            Type the characters in the picture
            <input
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12))}
              autoComplete="off"
              className="mt-1.5 w-full rounded-md border border-line-strong bg-white px-3 py-2 font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </label>
          <Button type="submit" disabled={busy !== null || !code.trim()}>
            {busy === "submit" ? "Reading the court's website — this can take a minute…" : submitLabel}
          </Button>
        </form>
      )}
    </div>
  );
}
