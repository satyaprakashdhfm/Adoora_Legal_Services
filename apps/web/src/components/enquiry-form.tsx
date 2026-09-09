"use client";

import Link from "next/link";
import { useState } from "react";
import { practiceAreas } from "@/content/practice-areas";
import { apiUrl } from "@/lib/site";

type Status = "idle" | "submitting" | "sent" | "error";

const MAX_DESCRIPTION = 2000;

/**
 * Client intake form.
 *
 * Posts to the Express API (`POST /api/enquiries`). Deliberately short — the
 * fields the firm needs to run a conflicts check and route the enquiry, and
 * nothing more. The DPDP consent is an explicit unticked checkbox, not a
 * notice-and-continue, and it gates submission.
 */
export function EnquiryForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch(`${apiUrl}/api/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          matterType: data.get("matterType"),
          description: data.get("description"),
          consent: data.get("consent") === "on",
          // Honeypot: bots fill hidden fields, humans cannot see this one.
          company: data.get("company"),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message ?? "We could not send your enquiry.");
      }

      form.reset();
      setDescription("");
      setStatus("sent");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not send your enquiry.",
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-paper-warm p-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold"
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
          Your enquiry has reached us
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          We aim to acknowledge every enquiry within one working day. We will
          run a conflicts check before responding substantively — until we
          confirm an engagement in writing, no lawyer&ndash;client relationship
          exists and the information you have sent is not privileged.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-gold underline decoration-gold/30 underline-offset-4"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line p-7 sm:p-8">
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
          label="Telephone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          hint="Include the country code if you are outside India."
        />

        <div>
          <label
            htmlFor="matterType"
            className="block text-sm font-medium text-ink"
          >
            Matter type <span className="text-gold">*</span>
          </label>
          <select
            id="matterType"
            name="matterType"
            required
            defaultValue=""
            className="mt-2 w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition focus:border-gold"
          >
            <option value="" disabled>
              Select the closest area
            </option>
            {practiceAreas.map((area) => (
              <option key={area.slug} value={area.name}>
                {area.name}
              </option>
            ))}
            <option value="Other">Other / not sure</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-ink"
        >
          Brief description <span className="text-gold">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="A few lines on what the matter concerns and any deadline you are working to."
          className="mt-2 w-full resize-y rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink transition placeholder:text-slate-light focus:border-gold"
        />
        <div className="mt-1.5 flex items-start justify-between gap-4">
          <p className="text-xs text-slate-light">
            Please do not send confidential documents or sensitive personal
            information at this stage.
          </p>
          <span className="shrink-0 text-xs text-slate-light">
            {description.length}/{MAX_DESCRIPTION}
          </span>
        </div>
      </div>

      {/* Honeypot — hidden from users, and from assistive technology. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
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
          this form in order to respond to my enquiry and to carry out a
          conflicts check, as described in the{" "}
          <Link
            href="/privacy"
            className="text-gold underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          . I understand that sending this form does not create a
          lawyer&ndash;client relationship.
        </span>
      </label>

      {status === "error" && error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error} You can also reach us by telephone or email using the details
          alongside.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-7 w-full rounded-full bg-ink px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-mid disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Sending…" : "Send enquiry"}
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
