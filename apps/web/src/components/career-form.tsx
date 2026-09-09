"use client";

import Link from "next/link";
import { useState } from "react";
import { apiUrl } from "@/lib/site";

type Status = "idle" | "submitting" | "sent" | "error";

/**
 * Careers application form. Posts to `POST /api/careers`.
 *
 * Candidates attach a CV by emailing it after submitting — the API does not
 * yet accept file uploads, and accepting them without virus scanning and a
 * retention policy in place would be worse than asking for an email.
 */
export function CareerForm({ roles }: { roles: string[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch(`${apiUrl}/api/careers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          role: data.get("role"),
          enrolment: data.get("enrolment"),
          experience: data.get("experience"),
          message: data.get("message"),
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
      <div className="rounded-2xl border border-line bg-paper-warm p-8">
        <h3 className="font-serif text-xl font-semibold text-ink">
          Application received
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Thank you. Please email your CV and a short covering note to{" "}
          <a
            href="mailto:careers@adooralegalservices.com"
            className="text-gold underline underline-offset-2"
          >
            careers@adooralegalservices.com
          </a>{" "}
          quoting the role, so we can consider it alongside this form. We
          respond to applications we are taking forward; we are not always able
          to reply to every application individually.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-gold underline decoration-gold/30 underline-offset-4"
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line p-7 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Full name" name="name" required autoComplete="name" />
        <Input
          label="Email address"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <Input label="Telephone" name="phone" type="tel" required autoComplete="tel" />

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-ink">
            Role <span className="text-gold">*</span>
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue=""
            className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition focus:border-gold"
          >
            <option value="" disabled>
              Select a role
            </option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
            <option value="Speculative application">
              Speculative application
            </option>
          </select>
        </div>

        <Input
          label="Years of experience"
          name="experience"
          required
          hint="Post-qualification, or state if you are a student."
        />
        <Input
          label="Bar enrolment number"
          name="enrolment"
          hint="Optional — leave blank if not yet enrolled."
        />
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="block text-sm font-medium text-ink">
          Why this role <span className="text-gold">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          maxLength={1500}
          placeholder="A few lines on the work you want to do and the experience you would bring to it."
          className="mt-2 w-full resize-y rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition placeholder:text-slate-light focus:border-gold"
        />
      </div>

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
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
        />
        <span className="text-sm leading-relaxed text-slate">
          I consent to ADOORA Legal Services processing the personal data in
          this form to assess my application, as described in the{" "}
          <Link href="/privacy" className="text-gold underline underline-offset-2">
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
          {error} You can also email careers@adooralegalservices.com directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-7 w-full rounded-full bg-ink px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-mid disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

function Input({
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
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition placeholder:text-slate-light focus:border-gold"
      />
      {hint && <p className="mt-1.5 text-xs text-slate-light">{hint}</p>}
    </div>
  );
}
