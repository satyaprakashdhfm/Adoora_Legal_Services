"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { ClientSignIn } from "@/components/portal/client-sign-in";
import { closeLogin, useLoginDialog } from "@/lib/portal/login-dialog";

/**
 * The sign-in popup, opened by the header's Login button from any page.
 * Mounted once in the root layout. The /login page shows the same form, for
 * links and redirects that arrive there directly.
 */
export function LoginDialog() {
  const dialog = useLoginDialog();
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialog.open) return;
    ref.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [dialog.open]);

  // Navigating away closes it.
  useEffect(() => {
    closeLogin();
  }, [pathname]);

  if (!dialog.open) return null;

  return (
    <dialog
      ref={ref}
      onClose={closeLogin}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
      aria-label="Client sign in"
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink-deep/70 backdrop:backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center bg-[linear-gradient(160deg,var(--color-ink-mid),var(--color-ink-deep))] px-6 py-8">
        <Wordmark tone="dark" />
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <span className="sr-only">Close</span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
            <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="px-6 pb-7 pt-6 sm:px-8">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">Client sign in</h2>
        <p className="mt-1 mb-5 text-sm text-slate">Follow your cases, documents and queries.</p>
        <ClientSignIn next={dialog.next} />
      </div>
    </dialog>
  );
}
