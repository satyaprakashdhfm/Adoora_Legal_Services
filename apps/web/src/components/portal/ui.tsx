"use client";

import Link from "next/link";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { initials } from "@/lib/portal/format";

/**
 * Building blocks for the dashboards and the admin console, in the site's
 * own tokens (ink, gold, paper, line) so the signed-in areas read as the
 * same firm as the public pages.
 */

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

const buttonTones: Record<ButtonTone, string> = {
  primary: "bg-gold text-ink-deep hover:bg-gold-bright",
  secondary: "border border-line-strong bg-white text-ink hover:border-gold hover:text-gold-deep",
  ghost: "text-ink-soft hover:bg-paper-tint hover:text-ink",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

export function buttonClass(tone: ButtonTone = "primary", size: "sm" | "md" = "md") {
  return `inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"
  } ${buttonTones[tone]}`;
}

export function Button({
  tone = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { tone?: ButtonTone; size?: "sm" | "md" }) {
  return <button type="button" {...props} className={`${buttonClass(tone, size)} ${className}`} />;
}

export function ButtonLink({
  tone = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone; size?: "sm" | "md" }) {
  return <Link {...props} className={`${buttonClass(tone, size)} ${className}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(11,24,52,0.04)] ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
        {description && <div className="mt-0.5 text-sm text-slate">{description}</div>}
      </div>
      {action}
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-gold-deep">{eyebrow}</p>}
        <h1 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <div className="mt-1.5 max-w-3xl text-sm text-slate">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const badgeTones = {
  gold: "bg-gold/12 text-gold-deep ring-gold/25",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
  grey: "bg-paper-tint text-ink-soft ring-line-strong",
  red: "bg-red-50 text-red-800 ring-red-200",
  ink: "bg-ink text-white ring-ink",
} as const;

export function Badge({ tone = "grey", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

const statusTone: Record<string, keyof typeof badgeTones> = {
  INTAKE: "gold",
  ACTIVE: "green",
  ON_HOLD: "grey",
  DISPOSED: "blue",
  CLOSED: "grey",
  WITHDRAWN: "red",
};

const statusLabel: Record<string, string> = {
  INTAKE: "Intake",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  DISPOSED: "Disposed",
  CLOSED: "Closed",
  WITHDRAWN: "Withdrawn",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "grey"}>{statusLabel[status] ?? status}</Badge>;
}

export function VisibilityBadge({ visibility }: { visibility: string }) {
  return visibility === "INTERNAL" ? <Badge tone="ink">Internal</Badge> : <Badge tone="grey">Shared with client</Badge>;
}

export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return (
      // Google profile photos; a plain img avoids configuring remote patterns.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover ring-1 ring-line"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-ink-mid font-semibold text-gold-bright"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name) || "·"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export const inputClass =
  "w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink transition placeholder:text-slate-light focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 disabled:bg-paper-tint";

export function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label} {required && <span className="text-gold-deep">*</span>}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-slate">{hint}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea rows={4} {...props} className={`${inputClass} resize-y ${props.className ?? ""}`} />;
}

export function Select({
  options,
  placeholder,
  ...props
}: ComponentProps<"select"> & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
      {children}
    </p>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-slate">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-gold" />
      {label}…
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-serif text-lg font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-slate">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatTile({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="portal-label text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate">{hint}</p>}
    </>
  );
  const className = "block rounded-xl border border-line bg-white px-5 py-4 transition";
  return href ? (
    <Link href={href} className={`${className} hover:border-gold`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-line bg-paper-warm px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-slate ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-line px-4 py-3 align-top text-ink ${className}`}>{children}</td>;
}

// ---------------------------------------------------------------------------
// Modal — native <dialog>, the same approach as the careers apply dialog.
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;
    ref.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
      aria-label={title}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} rounded-xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink-deep/60`}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-serif text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="rounded p-1 text-slate transition hover:bg-paper-tint hover:text-ink"
        >
          <span className="sr-only">Close</span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
            <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
    </dialog>,
    document.body,
  );
}

/** The "G" mark, in Google's own colours as their branding guidelines require. */
export function GoogleMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
