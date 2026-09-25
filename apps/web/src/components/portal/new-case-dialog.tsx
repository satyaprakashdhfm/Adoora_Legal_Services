"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type CnrLookup } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { CaseForm } from "@/components/portal/case-form";
import { Button, ErrorNote, Field, Input, Modal, Select, type ButtonTone } from "@/components/portal/ui";

type Person = { id: string; name: string; email: string; role?: string; isActive: boolean };
type TeamEntry = { userId: string; role: "LEAD" | "ASSOCIATE" | "SUPPORT" };

const ROLE_OPTIONS = [
  { value: "LEAD", label: "Lead counsel" },
  { value: "ASSOCIATE", label: "Associate" },
  { value: "SUPPORT", label: "Support" },
];

/** Any number of lawyers on the case, each with their role on it. */
function TeamPicker({ lawyers, value, onChange }: { lawyers: Person[]; value: TeamEntry[]; onChange: (next: TeamEntry[]) => void }) {
  const available = lawyers.filter((l) => !value.some((v) => v.userId === l.id));
  return (
    <div className="space-y-2">
      {value.map((entry, index) => {
        const person = lawyers.find((l) => l.id === entry.userId);
        return (
          <div key={entry.userId} className="flex items-center gap-2 rounded-md border border-line bg-paper-warm px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-sm">
              <span className="font-semibold text-ink">{person?.name ?? "…"}</span>{" "}
              <span className="text-xs text-slate">{person?.email}</span>
            </p>
            <Select
              aria-label="Role on the case"
              value={entry.role}
              onChange={(e) => onChange(value.map((v, i) => (i === index ? { ...v, role: e.target.value as TeamEntry["role"] } : v)))}
              options={ROLE_OPTIONS}
              className="w-36"
            />
            <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className="text-xs text-slate hover:text-red-700">
              Remove
            </button>
          </div>
        );
      })}
      {available.length > 0 && (
        <Select
          aria-label="Add a lawyer"
          value=""
          onChange={(e) =>
            e.target.value &&
            onChange([...value, { userId: e.target.value, role: value.some((v) => v.role === "LEAD") ? "ASSOCIATE" : "LEAD" }])
          }
          placeholder={value.length ? "+ Add another lawyer" : "+ Add a lawyer"}
          options={available.map((l) => ({ value: l.id, label: `${l.name} (${l.role?.toLowerCase()})` }))}
        />
      )}
    </div>
  );
}

/**
 * Opening a case, in a dialog, from either dashboard.
 *
 * Step one asks for the CNR: with it, the court's record is fetched from
 * eCourts and the form arrives filled in — cause title, parties and their
 * counsel, court, case number, dates, stage, coram — for the person to check
 * and correct before saving. The lookup is kept on the server, and saving
 * the case attaches it along with the hearing history and orders, so the
 * court is not asked twice. Without a CNR (a matter not yet filed, or an
 * advisory one), the same form opens empty.
 *
 * `admin` adds the lead lawyer and client pickers the console needs.
 */
function NewCaseFlow({ admin, onDone }: { admin: boolean; onDone: (reference: string) => void }) {
  const user = useUser();
  const client = user.kind === "client";
  const [cnr, setCnr] = useState("");
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<CnrLookup | null>(null);
  const [manual, setManual] = useState(false);

  const [lawyers, setLawyers] = useState<Person[]>([]);
  const [clients, setClients] = useState<Person[]>([]);
  const [team, setTeam] = useState<TeamEntry[]>([]);
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    if (!admin) return;
    api<{ data: Person[] }>("/admin/users").then((r) => setLawyers(r.data.filter((u) => u.isActive && u.role !== "EDITOR"))).catch(() => undefined);
    api<{ data: Person[] }>("/admin/clients?limit=200").then((r) => setClients(r.data.filter((c) => c.isActive))).catch(() => undefined);
  }, [admin]);

  async function fetchRecord(event: React.FormEvent) {
    event.preventDefault();
    const cleaned = cnr.replace(/[\s-]/g, "").toUpperCase();
    if (!/^[A-Z0-9]{16}$/.test(cleaned)) {
      setError("A CNR number is 16 letters and digits, e.g. TSHC010012342025.");
      return;
    }
    setLooking(true);
    setError(null);
    try {
      setLookup(await api<CnrLookup>(`/cases/${cleaned}`));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLooking(false);
    }
  }

  // Step one: the CNR, or skip it.
  if (!lookup && !manual) {
    return (
      <div className="space-y-6">
        <form onSubmit={fetchRecord} className="space-y-4">
          <Field
            label="CNR number"
            hint="16 characters, printed at the top of the case status page on eCourts and on the court's orders, e.g. TSHC010012342025."
          >
            <Input
              value={cnr}
              onChange={(e) => setCnr(e.target.value.toUpperCase())}
              maxLength={24}
              autoFocus
              placeholder="TSHC010012342025"
              className="font-mono uppercase tracking-wider"
            />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" disabled={looking || !cnr.trim()}>
            {looking ? "Fetching from eCourts…" : "Fetch case details"}
          </Button>
        </form>

        <div className="border-t border-line pt-5">
          <p className="text-sm text-ink-soft">
            {client
              ? "Not filed in court yet, or you don't have the CNR?"
              : "Not filed yet, advisory, or no CNR to hand?"}
          </p>
          <Button tone="secondary" size="sm" className="mt-3" onClick={() => setManual(true)}>
            Fill in the details manually
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lookup && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
          <p className="font-semibold">Filled in from the court&rsquo;s record — please check it before saving.</p>
          <p className="mt-1 text-xs text-ink-soft">
            CNR <span className="font-mono">{lookup.cnr}</span>
            {lookup.draft.court.status && ` · ${lookup.draft.court.status}`}
            {lookup.draft.court.stage && ` · ${lookup.draft.court.stage}`}
            {` · ${lookup.draft.court.hearings} hearing${lookup.draft.court.hearings === 1 ? "" : "s"} and ${lookup.draft.court.orders} order${lookup.draft.court.orders === 1 ? "" : "s"} will be saved with the case`}
          </p>
          {lookup.existing.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-red-800">
              Already on file:{" "}
              {lookup.existing.map((c, i) => (
                <span key={c.reference}>
                  {i > 0 && ", "}
                  <Link href={`${admin ? "/admin" : "/dashboard"}/cases/${c.reference}`} className="font-mono underline">
                    {c.reference}
                  </Link>
                </span>
              ))}
              . Open that instead unless this is a separate matter.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setLookup(null);
          setManual(false);
        }}
        className="text-xs font-semibold text-slate hover:text-ink"
      >
        ← Use a different CNR
      </button>

      <CaseForm
        key={lookup?.fetchedAt ?? "manual"}
        mode={client ? "client" : "staff"}
        draft={lookup?.draft}
        submitLabel={client ? "Open matter" : "Create case"}
        before={
          admin ? (
            <fieldset className="border-t border-line pt-6">
              <legend className="font-serif text-base font-semibold text-ink">Team and client</legend>
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                {/* Not a <Field>: that is a <label>, and this holds several controls. */}
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Lawyers on the case</p>
                  <div className="mt-1.5">
                    <TeamPicker lawyers={lawyers} value={team} onChange={setTeam} />
                  </div>
                  <p className="mt-1 text-xs text-slate">Add as many as the matter needs. Each sees the case on their dashboard.</p>
                </div>
                <Field label="Client account" hint="The client sees the case on their dashboard once linked.">
                  <Select value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Link later" options={clients.map((c) => ({ value: c.id, label: `${c.name} — ${c.email}` }))} />
                </Field>
              </div>
            </fieldset>
          ) : undefined
        }
        onSubmit={async (payload) => {
          const created = await api<{ reference: string }>("/cases", {
            method: "POST",
            body: admin
              ? {
                  ...payload,
                  assignments: team,
                  clientIds: clientId ? [clientId] : [],
                }
              : payload,
          });
          onDone(created.reference);
        }}
      />
    </div>
  );
}

/** A button that opens the new-case dialog, then goes to the saved case. */
export function NewCaseButton({
  admin = false,
  tone,
  size,
  label,
}: {
  admin?: boolean;
  tone?: ButtonTone;
  size?: "sm" | "md";
  label?: string;
}) {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const client = user.kind === "client";
  const text = label ?? (client ? "Open a new matter" : admin ? "New case" : "Open a case");

  return (
    <>
      <Button tone={tone} size={size} onClick={() => setOpen(true)}>{text}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={client ? "Open a new matter" : "New case"} wide>
        {open && (
          <NewCaseFlow
            admin={admin}
            onDone={(reference) => {
              setOpen(false);
              router.push(`${admin ? "/admin" : "/dashboard"}/cases/${reference}`);
            }}
          />
        )}
      </Modal>
    </>
  );
}
