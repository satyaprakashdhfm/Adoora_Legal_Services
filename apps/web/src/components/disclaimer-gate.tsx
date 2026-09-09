"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ScalesMark } from "@/components/brand";
import {
  COOKIE_DISCLAIMER,
  disclaimer,
} from "@/content/legal";
import { readCookie, writeCookie } from "@/lib/cookies";
import { firm } from "@/content/firm";

/** Routes that must remain reachable without accepting the disclaimer. */
const EXEMPT_ROUTES = ["/notice", "/disclaimer", "/privacy", "/cookies", "/terms"];

/**
 * The Bar Council of India disclaimer gate.
 *
 * Shown once per session (acceptance stored in a first-party cookie).
 * "I AGREE" dismisses it; "I DO NOT AGREE" routes to `/notice`, a static
 * informational page carrying no firm information.
 *
 * This is a compliance convention, not a security control — the markup behind
 * it is already in the DOM. Do not treat it as an access boundary.
 */
export function DisclaimerGate() {
  const router = useRouter();
  const pathname = usePathname();
  /** `null` while we have not yet read the cookie — renders nothing. */
  const [visible, setVisible] = useState<boolean | null>(null);
  const agreeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (EXEMPT_ROUTES.some((route) => pathname.startsWith(route))) {
      setVisible(false);
      return;
    }

    setVisible(readCookie(COOKIE_DISCLAIMER) !== "true");
  }, [pathname]);

  // Lock scroll and move focus into the dialog while it is open.
  useEffect(() => {
    if (!visible) return;

    document.body.style.overflow = "hidden";
    agreeRef.current?.focus();

    // Keep focus inside the dialog: it has no dismiss-by-escape by design.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);

  function accept() {
    writeCookie(COOKIE_DISCLAIMER, "true", 180);
    setVisible(false);
  }

  function decline() {
    router.push("/notice");
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-heading"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/90 p-4 backdrop-blur-sm sm:p-6"
    >
      <div
        ref={dialogRef}
        className="rise my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line bg-paper-warm px-6 py-5 sm:px-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-paper text-gold">
            <ScalesMark className="h-6 w-6" />
          </span>
          <div>
            <h2
              id="disclaimer-heading"
              className="font-serif text-xl font-semibold text-ink"
            >
              {disclaimer.heading}
            </h2>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-light">
              {firm.name}
            </p>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-6 sm:px-8">
          <p className="text-sm leading-relaxed text-ink-soft">
            {disclaimer.intro}
          </p>

          <ul className="mt-5 space-y-3.5">
            {disclaimer.acknowledgements.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                />
                <span className="text-sm leading-relaxed text-slate">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm font-medium leading-relaxed text-ink">
            {disclaimer.advice}
          </p>

          <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-slate-light">
            {disclaimer.cookies}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-paper-warm px-6 py-5 sm:flex-row-reverse sm:px-8">
          <button
            ref={agreeRef}
            type="button"
            onClick={accept}
            className="rounded-full bg-ink px-8 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-ink-mid"
          >
            {disclaimer.agreeLabel}
          </button>
          <button
            type="button"
            onClick={decline}
            className="rounded-full border border-line-strong px-8 py-3 text-sm font-semibold text-ink-soft transition hover:border-slate hover:text-ink"
          >
            {disclaimer.declineLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
