"use client";

import { useMemo, useState, type ReactNode } from "react";
import { practiceAreas } from "@/content/practice-areas";
import type { CaseDetail, Party } from "@/lib/portal/api";
import {
  CASE_STAGES,
  CASE_STATUSES,
  CASE_TYPES,
  COURT_LEVELS,
  HIGH_COURTS,
  PARTY_ROLES,
  STATES_AND_UTS,
} from "@/lib/portal/legal";
import { toDateInput } from "@/lib/portal/format";
import { Button, ErrorNote, Field, Input, Select, Textarea } from "@/components/portal/ui";

/**
 * The case record form, in two sizes:
 *
 * - `staff` — every field on the Case model, for lawyers and admins;
 * - `client` — what a client is likely to know when opening a matter: what it
 *   is about, the court if it is already in one, the case number or CNR, and
 *   the parties.
 */

type Mode = "staff" | "client";

type FormState = {
  title: string;
  summary: string;
  practiceArea: string;
  status: string;
  stage: string;
  courtLevel: string;
  courtName: string;
  bench: string;
  state: string;
  district: string;
  courtHall: string;
  coram: string;
  caseTypeCode: string;
  caseTypeName: string;
  caseNumber: string;
  caseYear: string;
  filingNumber: string;
  filingDate: string;
  registrationDate: string;
  cnrNumber: string;
  actsAndSections: string;
  reliefSought: string;
  originCourt: string;
  originCaseNumber: string;
  impugnedOrderDate: string;
  lastHearingDate: string;
  nextHearingDate: string;
  nextHearingPurpose: string;
  disposalDate: string;
  disposalNature: string;
  parties: Party[];
};

/**
 * A draft from "fill from CNR" arrives in the form's own shape (strings, a
 * list of acts); anything it does not carry keeps its default.
 */
function fromDraft(draft: Record<string, unknown>): Partial<FormState> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (key === "court") continue;
    if (key === "actsAndSections") out[key] = Array.isArray(value) ? value.join("\n") : "";
    else if (key === "parties") out[key] = Array.isArray(value) ? value : [];
    else if (value !== null && value !== undefined) out[key] = String(value);
  }
  return out as Partial<FormState>;
}

function initialState(initial?: CaseDetail, draft?: Record<string, unknown>): FormState {
  const text = (value: string | number | null | undefined) => (value == null ? "" : String(value));
  const base: FormState = {
    title: text(initial?.title),
    summary: text(initial?.summary),
    practiceArea: text(initial?.practiceArea),
    status: initial?.status ?? "ACTIVE",
    stage: initial?.stage ?? "PRE_FILING",
    courtLevel: initial?.courtLevel ?? "NOT_IN_LITIGATION",
    courtName: text(initial?.courtName),
    bench: text(initial?.bench),
    state: text(initial?.state),
    district: text(initial?.district),
    courtHall: text(initial?.courtHall),
    coram: text(initial?.coram),
    caseTypeCode: text(initial?.caseTypeCode),
    caseTypeName: text(initial?.caseTypeName),
    caseNumber: text(initial?.caseNumber),
    caseYear: text(initial?.caseYear),
    filingNumber: text(initial?.filingNumber),
    filingDate: toDateInput(initial?.filingDate),
    registrationDate: toDateInput(initial?.registrationDate),
    cnrNumber: text(initial?.cnrNumber),
    actsAndSections: (initial?.actsAndSections ?? []).join("\n"),
    reliefSought: text(initial?.reliefSought),
    originCourt: text(initial?.originCourt),
    originCaseNumber: text(initial?.originCaseNumber),
    impugnedOrderDate: toDateInput(initial?.impugnedOrderDate),
    lastHearingDate: toDateInput(initial?.lastHearingDate),
    nextHearingDate: toDateInput(initial?.nextHearingDate),
    nextHearingPurpose: text(initial?.nextHearingPurpose),
    disposalDate: toDateInput(initial?.disposalDate),
    disposalNature: text(initial?.disposalNature),
    parties: initial?.parties?.map(({ role, position, name, isClient, counsel }) => ({ role, position, name, isClient, counsel })) ?? [],
  };
  return draft ? { ...base, ...fromDraft(draft) } : base;
}

function toPayload(form: FormState, mode: Mode) {
  const parties = form.parties
    .filter((party) => party.name.trim())
    .map((party) => ({ ...party, counsel: party.counsel || null }));

  const common = {
    title: form.title,
    summary: form.summary,
    practiceArea: form.practiceArea,
    courtLevel: form.courtLevel,
    courtName: form.courtName,
    bench: form.bench,
    state: form.state,
    district: form.district,
    caseTypeCode: form.caseTypeCode,
    caseTypeName: form.caseTypeName,
    caseNumber: form.caseNumber,
    caseYear: form.caseYear,
    cnrNumber: form.cnrNumber,
    nextHearingDate: form.nextHearingDate,
    parties,
  };

  if (mode === "client") return common;

  return {
    ...common,
    status: form.status,
    stage: form.stage,
    courtHall: form.courtHall,
    coram: form.coram,
    filingNumber: form.filingNumber,
    filingDate: form.filingDate,
    registrationDate: form.registrationDate,
    actsAndSections: form.actsAndSections.split("\n").map((line) => line.trim()).filter(Boolean),
    reliefSought: form.reliefSought,
    originCourt: form.originCourt,
    originCaseNumber: form.originCaseNumber,
    impugnedOrderDate: form.impugnedOrderDate,
    lastHearingDate: form.lastHearingDate,
    nextHearingPurpose: form.nextHearingPurpose,
    disposalDate: form.disposalDate,
    disposalNature: form.disposalNature,
  };
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-6 first:border-0 first:pt-0">
      <legend className="float-left w-full">
        <span className="font-serif text-base font-semibold text-ink">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-slate">{description}</span>}
      </legend>
      <div className="clear-both grid gap-4 pt-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function CaseForm({
  mode,
  initial,
  draft,
  submitLabel,
  onSubmit,
  before,
}: {
  mode: Mode;
  initial?: CaseDetail;
  /** Prefill for a new case, e.g. from an eCourts lookup. */
  draft?: Record<string, unknown>;
  submitLabel: string;
  onSubmit: (payload: ReturnType<typeof toPayload>) => Promise<void>;
  /** Extra controls rendered above the submit button (admin pickers). */
  before?: ReactNode;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(initial, draft));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const staff = mode === "staff";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const highCourt = useMemo(
    () => HIGH_COURTS.find((court) => court.name === form.courtName),
    [form.courtName],
  );
  const caseTypes = CASE_TYPES[form.courtLevel] ?? [];
  const inLitigation = form.courtLevel !== "NOT_IN_LITIGATION";

  function onCourtLevel(level: string) {
    setForm((current) => ({
      ...current,
      courtLevel: level,
      // The Supreme Court needs no name; a change of forum clears the old one.
      courtName: level === "SUPREME_COURT" ? "Supreme Court of India" : level === current.courtLevel ? current.courtName : "",
      bench: level === current.courtLevel ? current.bench : "",
    }));
  }

  function onCaseTypeCode(code: string) {
    const known = caseTypes.find((type) => type.code.toLowerCase() === code.trim().toLowerCase());
    setForm((current) => ({
      ...current,
      caseTypeCode: code,
      caseTypeName: known ? known.name : current.caseTypeName,
    }));
  }

  function updateParty(index: number, patch: Partial<Party>) {
    set("parties", form.parties.map((party, i) => (i === index ? { ...party, ...patch } : party)));
  }

  function addParty(role: string) {
    const position = form.parties.filter((party) => party.role === role).length + 1;
    set("parties", [...form.parties, { role, position, name: "", isClient: false, counsel: null }]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(toPayload(form, mode));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <Section title="The case">
        <Field label="Title" required className="sm:col-span-2" hint={staff ? "Usually the cause title, e.g. “Ravi Kumar v. State of Telangana”." : "A few words you will recognise it by."}>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} maxLength={300} />
        </Field>
        <Field label={staff ? "Summary" : "What is the case about?"} required={!staff} className="sm:col-span-2" hint={staff ? undefined : "Please do not include anything you would not want the firm to read before it has agreed to act — a conflicts check comes first."}>
          <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} required={!staff} minLength={staff ? undefined : 20} maxLength={5000} rows={staff ? 3 : 5} />
        </Field>
        <Field label="Practice area">
          <Select
            value={form.practiceArea}
            onChange={(e) => set("practiceArea", e.target.value)}
            placeholder="Not sure / other"
            options={practiceAreas.map((area) => ({ value: area.slug, label: area.name }))}
          />
        </Field>
        {staff && (
          <>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value)} options={CASE_STATUSES} />
            </Field>
            <Field label="Stage">
              <Select value={form.stage} onChange={(e) => set("stage", e.target.value)} options={CASE_STAGES} />
            </Field>
          </>
        )}
      </Section>

      <Section title="Court or forum" description="Where the case is, or will be, heard.">
        <Field label="Forum" className="sm:col-span-2">
          <Select value={form.courtLevel} onChange={(e) => onCourtLevel(e.target.value)} options={COURT_LEVELS} />
        </Field>

        {form.courtLevel === "HIGH_COURT" && (
          <>
            <Field label="High Court" hint={highCourt ? `Jurisdiction: ${highCourt.jurisdiction}` : undefined}>
              <Select
                value={form.courtName}
                onChange={(e) => {
                  const court = HIGH_COURTS.find((c) => c.name === e.target.value);
                  setForm((current) => ({ ...current, courtName: e.target.value, bench: court?.seats[0] ?? "" }));
                }}
                placeholder="Select the High Court"
                options={HIGH_COURTS.map((court) => ({ value: court.name, label: court.name }))}
              />
            </Field>
            <Field label="Seat / bench">
              <Select
                value={form.bench}
                onChange={(e) => set("bench", e.target.value)}
                placeholder={highCourt ? "Select" : "Choose the High Court first"}
                options={(highCourt?.seats ?? []).map((seat) => ({ value: seat, label: seat }))}
                disabled={!highCourt}
              />
            </Field>
          </>
        )}

        {inLitigation && form.courtLevel !== "HIGH_COURT" && form.courtLevel !== "SUPREME_COURT" && (
          <>
            <Field label="Court / forum name" className="sm:col-span-2" hint="As it appears on the court's orders, e.g. “XII Additional Chief Judge, City Civil Court, Hyderabad” or “NCLT, Hyderabad Bench”.">
              <Input value={form.courtName} onChange={(e) => set("courtName", e.target.value)} maxLength={200} />
            </Field>
            <Field label="State / UT">
              <Select value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Select" options={STATES_AND_UTS.map((s) => ({ value: s, label: s }))} />
            </Field>
            <Field label="District">
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} maxLength={100} />
            </Field>
          </>
        )}

        {staff && inLitigation && (
          <>
            <Field label="Court hall">
              <Input value={form.courtHall} onChange={(e) => set("courtHall", e.target.value)} maxLength={60} />
            </Field>
            <Field label="Coram" hint="The judge or bench the case is listed before.">
              <Input value={form.coram} onChange={(e) => set("coram", e.target.value)} maxLength={300} />
            </Field>
          </>
        )}
      </Section>

      {inLitigation && (
        <Section title="Case number" description={staff ? "The court's numbering, once it exists. The firm's own reference never changes." : "If the case is already filed, whatever you have from the court papers."}>
          <Field label="Case type" hint={caseTypes.length ? "Pick a suggestion or type the court's abbreviation." : undefined}>
            <Input list="case-type-options" value={form.caseTypeCode} onChange={(e) => onCaseTypeCode(e.target.value)} maxLength={40} placeholder={caseTypes[0]?.code ?? "e.g. WP"} />
            <datalist id="case-type-options">
              {caseTypes.map((type) => (
                <option key={type.code} value={type.code}>{type.name}</option>
              ))}
            </datalist>
          </Field>
          <Field label="Case type (in full)">
            <Input value={form.caseTypeName} onChange={(e) => set("caseTypeName", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Number">
            <Input value={form.caseNumber} onChange={(e) => set("caseNumber", e.target.value)} maxLength={40} inputMode="numeric" />
          </Field>
          <Field label="Year">
            <Input value={form.caseYear} onChange={(e) => set("caseYear", e.target.value)} type="number" min={1900} max={2100} />
          </Field>
          <Field label="CNR number" className="sm:col-span-2" hint="16 characters, printed on eCourts case status pages, e.g. HBHC01… for the Telangana High Court.">
            <Input value={form.cnrNumber} onChange={(e) => set("cnrNumber", e.target.value.toUpperCase())} maxLength={20} className="font-mono uppercase" />
          </Field>
          {staff && (
            <>
              <Field label="Filing / diary number">
                <Input value={form.filingNumber} onChange={(e) => set("filingNumber", e.target.value)} maxLength={60} />
              </Field>
              <Field label="Filing date">
                <Input type="date" value={form.filingDate} onChange={(e) => set("filingDate", e.target.value)} />
              </Field>
              <Field label="Registration date">
                <Input type="date" value={form.registrationDate} onChange={(e) => set("registrationDate", e.target.value)} />
              </Field>
            </>
          )}
        </Section>
      )}

      <fieldset className="border-t border-line pt-6">
        <legend className="float-left w-full">
          <span className="font-serif text-base font-semibold text-ink">Parties</span>
          <span className="mt-0.5 block text-xs text-slate">As named in the cause title. Tick the party the firm acts for.</span>
        </legend>
        <div className="clear-both space-y-3 pt-4">
          {form.parties.map((party, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-line bg-paper-warm p-3 sm:grid-cols-[10rem_4.5rem_1fr_auto] sm:items-center">
              <Select aria-label="Role" value={party.role} onChange={(e) => updateParty(index, { role: e.target.value })} options={PARTY_ROLES} />
              <Input aria-label="Number" type="number" min={1} value={party.position} onChange={(e) => updateParty(index, { position: Number(e.target.value) || 1 })} />
              <Input aria-label="Name" placeholder="Name, and description (e.g. rep. by its Principal Secretary)" value={party.name} onChange={(e) => updateParty(index, { name: e.target.value })} maxLength={300} />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" checked={party.isClient} onChange={(e) => updateParty(index, { isClient: e.target.checked })} className="accent-[var(--color-gold)]" />
                  Our client
                </label>
                <button type="button" onClick={() => set("parties", form.parties.filter((_, i) => i !== index))} className="text-xs text-slate hover:text-red-700">
                  Remove
                </button>
              </div>
              {staff && (
                <Input aria-label="Counsel" placeholder="Counsel for this party (optional)" value={party.counsel ?? ""} onChange={(e) => updateParty(index, { counsel: e.target.value })} maxLength={200} className="sm:col-span-4" />
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {["PETITIONER", "RESPONDENT", "APPELLANT", "PLAINTIFF", "DEFENDANT", "COMPLAINANT", "ACCUSED"].map((role) => (
              <Button key={role} tone="secondary" size="sm" onClick={() => addParty(role)}>
                + {PARTY_ROLES.find((r) => r.value === role)?.label}
              </Button>
            ))}
          </div>
        </div>
      </fieldset>

      {staff && (
        <Section title="Law and relief">
          <Field label="Acts and sections" className="sm:col-span-2" hint="One per line, e.g. “Article 226, Constitution of India” or “Section 138, Negotiable Instruments Act, 1881”.">
            <Textarea value={form.actsAndSections} onChange={(e) => set("actsAndSections", e.target.value)} rows={3} />
          </Field>
          <Field label="Relief sought" className="sm:col-span-2">
            <Textarea value={form.reliefSought} onChange={(e) => set("reliefSought", e.target.value)} rows={3} maxLength={5000} />
          </Field>
        </Section>
      )}

      {staff && inLitigation && (
        <Section title="Lower court" description="For appeals, revisions and writs against an order.">
          <Field label="Court below">
            <Input value={form.originCourt} onChange={(e) => set("originCourt", e.target.value)} maxLength={200} />
          </Field>
          <Field label="Case number below">
            <Input value={form.originCaseNumber} onChange={(e) => set("originCaseNumber", e.target.value)} maxLength={80} />
          </Field>
          <Field label="Date of impugned order">
            <Input type="date" value={form.impugnedOrderDate} onChange={(e) => set("impugnedOrderDate", e.target.value)} />
          </Field>
        </Section>
      )}

      {inLitigation && (
        <Section title="Hearings">
          {staff && (
            <Field label="Last hearing">
              <Input type="date" value={form.lastHearingDate} onChange={(e) => set("lastHearingDate", e.target.value)} />
            </Field>
          )}
          <Field label="Next hearing">
            <Input type="date" value={form.nextHearingDate} onChange={(e) => set("nextHearingDate", e.target.value)} />
          </Field>
          {staff && (
            <>
              <Field label="Listed for" hint="e.g. Admission, Hearing, Orders, Evidence.">
                <Input value={form.nextHearingPurpose} onChange={(e) => set("nextHearingPurpose", e.target.value)} maxLength={200} />
              </Field>
              <Field label="Disposal date">
                <Input type="date" value={form.disposalDate} onChange={(e) => set("disposalDate", e.target.value)} />
              </Field>
              <Field label="Nature of disposal" hint="e.g. Allowed, Dismissed, Disposed of with directions.">
                <Input value={form.disposalNature} onChange={(e) => set("disposalNature", e.target.value)} maxLength={200} />
              </Field>
            </>
          )}
        </Section>
      )}

      {before}

      <div className="space-y-3 border-t border-line pt-6">
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
