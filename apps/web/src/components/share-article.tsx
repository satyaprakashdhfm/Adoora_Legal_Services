"use client";

import { useState } from "react";

/**
 * One Share button for an article. It opens the device's own share sheet
 * (WhatsApp, LinkedIn, Mail and the rest, whatever the reader has), and
 * copies the link where the browser has no share sheet.
 */
export function ShareArticle({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the sheet is not a failure; anything else falls back to copying.
        if ((error as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(154,98,36,0.7)] transition hover:bg-gold-deep active:scale-[0.98]"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        {copied ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : (
          <>
            <circle cx="18" cy="5.5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="18.5" r="2.5" />
            <path d="M8.2 10.9l7.6-4.2M8.2 13.1l7.6 4.2" />
          </>
        )}
      </svg>
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
