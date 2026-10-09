"use client";

import Link from "next/link";
import { useState } from "react";
import { apiUrl } from "@/lib/site";
import { applicationRoles, speculativeRole } from "@/content/careers";

type Status = "idle" | "submitting" | "sent" | "error";

const MAX_DESCRIPTION = 500;
const RESUME_MAX_MB = 5;
const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];

/**
 * The form's role choices and the one selected to start with: the role the
 * candidate clicked Apply on ("Intern" for any internship), added to the
 * list when it is a posted title such as "Associate — Corporate Advisory".
 */
function roleChoices(role: string): { options: string[]; selected: string } {
  const standard: string[] = [...applicationRoles];
  if (role === speculativeRole.title) return { options: standard, selected: "" };
  const selected = /\bintern(ship)?\b/i.test(role) ? "Intern" : role;
  return { options: standard.includes(selected) ? standard : [selected, ...standard], selected };
}

/** The same rules as the API, so a wrong file is caught before sending. */
function checkResume(file: File | null): string | null {
  if (!file) return "Please attach your résumé.";
  const name = file.name.toLowerCase();
  if (!RESUME_EXTENSIONS.some((extension) => name.endsWith(extension))) return "Please attach your résumé as a PDF or Word document.";
  if (file.size > RESUME_MAX_MB * 1024 * 1024) return `Your résumé is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please keep it under ${RESUME_MAX_MB} MB.`;
  return null;
}

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
 * Careers application form. `role` is the role the candidate clicked Apply
 * on; it starts selected in the Role list, which they can change.
 *
 * Posts multipart to `POST /api/careers` with the résumé (PDF or Word, up to
 * 5 MB), which the API checks, encrypts and stores with the application. The
 * API has no column for "current location", so it travels folded into the
 * top of `message` rather than being dropped silently.
 */
export function CareerForm({ role }: { role: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const { options: roleOptions, selected: initialRole } = roleChoices(role);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const problem = checkResume(resume);
    if (problem) {
      setResumeError(problem);
      setStatus("idle");
      return;
    }

    const location = (data.get("location") as string) || "";
    const message = (data.get("message") as string) ?? "";
    const body = new FormData();
    for (const field of ["name", "email", "phone", "role", "experience", "company"]) {
      body.set(field, String(data.get(field) ?? ""));
    }
    body.set("message", location ? `Current location: ${location}\n\n${message}` : message);
    body.set("consent", data.get("consent") === "on" ? "true" : "false");
    body.set("resume", resume!);

    try {
      const response = await fetch(`${apiUrl}/api/careers`, { method: "POST", body });

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
      setResume(null);
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
          Application Received
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Thank you. Your application and résumé have reached us. We respond
          to applications we are taking forward; we are not always able to
          reply to every application individually.
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
          label="Role"
          name="role"
          required
          options={roleOptions}
          placeholder="Select role"
          defaultValue={initialRole}
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

      <div className="mt-5">
        <span className="block text-sm font-medium text-ink">
          Résumé <span className="text-gold-deep">*</span>
        </span>
        <label
          className={`mt-2 flex cursor-pointer flex-wrap items-center gap-3 rounded-lg border border-dashed bg-paper px-3.5 py-3 text-sm transition hover:border-gold focus-within:border-gold focus-within:ring-1 focus-within:ring-gold/40 ${
            resumeError ? "border-red-300" : "border-line-strong"
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-md bg-ink px-3.5 py-2 text-xs font-semibold text-white">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
              <path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M3 13h10" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {resume ? "Change file" : "Upload résumé"}
          </span>
          <span className={`min-w-0 truncate ${resume ? "font-medium text-ink" : "text-slate"}`}>
            {resume ? resume.name : "No file chosen"}
          </span>
          <input
            type="file"
            name="resume-file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              const problem = file ? checkResume(file) : null;
              setResumeError(problem);
              setResume(problem ? null : file);
            }}
          />
        </label>
        {resumeError ? (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">{resumeError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-slate">PDF or Word (.doc, .docx), up to {RESUME_MAX_MB} MB.</p>
        )}
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
  defaultValue = "",
}: {
  label: string;
  name: string;
  options: string[];
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
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
        defaultValue={defaultValue}
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
