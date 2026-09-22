"use client";

import Link from "next/link";
import { useState } from "react";
import { apiUrl } from "@/lib/site";

type Status = "idle" | "submitting" | "sent" | "error";

const MAX_DESCRIPTION = 500;

const locations = [
  "Hyderabad",
  "Bengaluru",
  "Guntur",
  "Other (India)",
  "Outside India",
];

const experienceBands = [
  "Less than 1 year",
  "1–2 years",
  "2–4 years",
  "4–6 years",
  "6+ years",
];

/**
 * Careers application form, one instance per role — the role a candidate is
 * applying for is fixed by the page it's rendered on (`/careers/apply/[role]`)
 * rather than chosen from a select here.
 *
 * Posts to `POST /api/careers`. The API has no column for "current
 * location", so it travels folded into the top of `message` rather than
 * being dropped silently.
 *
 * Candidates attach a CV by emailing it after submitting — the API does not
 * accept file uploads, and accepting them without virus scanning and a
 * retention policy in place would be worse than asking for an email.
 */
export function CareerForm({ role }: { role: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const location = (data.get("location") as string) || "";
    const message = (data.get("message") as string) ?? "";

    try {
      const response = await fetch(`${apiUrl}/api/careers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          role,
          experience: data.get("experience"),
          message: location ? `Current location: ${location}\n\n${message}` : message,
          consent: data.get("consent") === "on",
          company: data.get("company"),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(
          payload?.message ?? "We could not submit your application.",
        );
      }

      form.reset();
      setDescription("");
      setStatus("sent");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not submit your application.",
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-paper p-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep"
        >
          <svg viewBox="0 0 20 20" className="h-6 w-6">
            <path
              d="M4 10.5l4 4 8-9"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h3 className="mt-5 font-serif text-xl font-semibold text-ink">
          Application received
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Thank you. Please email your CV and a short covering note to{" "}
          <a
            href="mailto:info@adooralegalservices.com"
            className="font-semibold text-gold-deep underline underline-offset-2"
          >
            info@adooralegalservices.com
          </a>{" "}
          quoting the role, so we can consider it alongside this form. We
          respond to applications we are taking forward; we are not always
          able to reply to every application individually.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-gold-deep underline decoration-gold/40 underline-offset-4"
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field
          label="Email address"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
        />

        <SelectField
          label="Current location"
          name="location"
          options={locations}
          placeholder="Select location"
        />

        <SelectField
          label="Years of experience"
          name="experience"
          required
          options={experienceBands}
          placeholder="Select experience"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="block text-sm font-medium text-ink">
          Brief description <span className="text-gold-deep">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell us about yourself, your interests and why you'd like to join us…"
          className="mt-2 w-full resize-y rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition placeholder:text-slate-light focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
        />
        <div className="mt-1.5 flex items-start justify-end">
          <span className="text-xs text-slate">
            {description.length}/{MAX_DESCRIPTION}
          </span>
        </div>
      </div>

      {/* Honeypot — hidden from users, and from assistive technology. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="career-company">Company</label>
        <input
          id="career-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="mt-6 flex items-start gap-3">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]"
        />
        <span className="text-sm leading-relaxed text-ink-soft">
          I consent to ADOORA Legal Services processing the personal data in
          this form to assess my application, as described in the{" "}
          <Link href="/privacy" className="font-semibold text-gold-deep underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {status === "error" && error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error} You can also email info@adooralegalservices.com directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-8 py-3.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Submitting…" : "Submit application"}
        {status !== "submitting" && (
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
            <path
              d="M2 8h11M9 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label} {required && <span className="text-gold-deep">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition placeholder:text-slate-light focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
      />
      {hint && <p className="mt-1.5 text-xs text-slate">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label} {required && <span className="text-gold-deep">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
