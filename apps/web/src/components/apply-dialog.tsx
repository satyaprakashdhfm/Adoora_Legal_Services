"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CareerForm } from "@/components/career-form";

/**
 * A careers "Apply" trigger that opens the application form in a modal over
 * the careers page, rather than navigating to `/careers/apply/[role]`. That
 * route still exists for anyone arriving on an old link.
 *
 * A native `<dialog>` opened with `showModal()`: the browser supplies the
 * focus trap, Escape to close and the top-layer stacking, so this sits above
 * the header and the WhatsApp button without any z-index bookkeeping. A click
 * on the backdrop (the dialog element itself, outside the panel) closes it
 * too. Page scroll is locked while it is open.
 *
 * The dialog is only rendered while open, and into `document.body`: one
 * trigger sits inside a paragraph, where a `<dialog>` full of headings and
 * form fields would be invalid HTML and break hydration.
 */
export function ApplyDialog({
  role,
  className,
  children,
}: {
  role: string;
  className?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children}
      </button>

      {isOpen &&
        createPortal(
          <dialog
            ref={dialogRef}
            aria-label={`Apply for ${role}`}
            onClose={() => setIsOpen(false)}
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-paper p-0 shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
          >
            <div className="p-6 sm:p-10">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="eyebrow inline-flex items-center gap-2.5 text-gold-deep">
                    <span className="h-px w-8 bg-gold/50" />
                    Apply now
                  </p>
                  <h2 className="mt-4 font-serif text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
                    {role}
                  </h2>
                  <p className="mt-2 text-sm text-ink-soft sm:text-base">
                    Share a few details and we&rsquo;ll be in touch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition hover:border-gold hover:text-gold-deep"
                >
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      d="M3 3l10 10M13 3L3 13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-8 rounded-2xl border border-line bg-paper-warm p-5 sm:p-8">
                <CareerForm role={role} />
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
