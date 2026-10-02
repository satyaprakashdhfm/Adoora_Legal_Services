"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type CnrLookup } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { CaseForm } from "@/components/portal/case-form";
import { CourtCaptcha } from "@/components/portal/court-captcha";
import { Button, ErrorNote, Field, Input, Modal, type ButtonTone } from "@/components/portal/ui";
import { PeoplePicker, TeamPicker, personDetail, type TeamEntry } from "@/components/portal/people-picker";

type Person = { id: string; name: string; email: string | null; phone?: string | null; role?: string; isActive: boolean };

/**
 * Opening a case, in a dialog, from either dashboard.
 *
 * Step one asks for the CNR: with it, the court's record is read from the
 * court's own website (the person types its captcha) and the form arrives
 * filled in — cause title, parties and their
 * counsel, court, case number, dates, stage, coram — for the person to check
 * and correct before saving. The lookup is held on the server, and saving
 * the case attaches it with the hearing history and the order PDFs, so the
 * court is not asked twice. Staff may use eCourtsIndia as a paid backup. Without a CNR (a matter not yet filed, or an
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
  // The CNR being looked up on the court's website (step two: its captcha).
  const [asking, setAsking] = useState<string | null>(null);

  const [lawyers, setLawyers] = useState<Person[]>([]);
  const [clients, setClients] = useState<Person[]>([]);
  const [team, setTeam] = useState<TeamEntry[]>([]);
  const [clientIds, setClientIds] = useState<string[]>([]);

  useEffect(() => {
    if (!admin) return;
    api<{ data: Person[] }>("/admin/users").then((r) => setLawyers(r.data.filter((u) => u.isActive && u.role !== "EDITOR"))).catch(() => undefined);
    api<{ data: Person[] }>("/admin/clients?limit=200").then((r) => setClients(r.data.filter((c) => c.isActive))).catch(() => undefined);
  }, [admin]);

  function cleanedCnr() {
    const cleaned = cnr.replace(/[\s-]/g, "").toUpperCase();
    if (/^[A-Z0-9]{16}$/.test(cleaned)) return cleaned;
    setError("A CNR number is 16 letters and digits, e.g. HBHC01… for the Telangana High Court.");
    return null;
  }

  function askCourt(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const cleaned = cleanedCnr();
    if (cleaned) setAsking(cleaned);
  }

  /** Staff only, paid: the same lookup through eCourtsIndia. */
  async function fetchFromBackup() {
    const cleaned = cleanedCnr();
    if (!cleaned) return;
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

  // Step two: the court's captcha for that CNR.
  if (asking && !lookup) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          Reading CNR <span className="font-mono font-semibold">{asking}</span> on the court&apos;s own website. The form fills in from it; the hearings and
          order PDFs are saved when you create the case.
        </p>
        <CourtCaptcha<CnrLookup>
          base="/cases/cnr-lookup"
          startBody={{ cnr: asking }}
          submitLabel="Fetch case details"
          onResult={setLookup}
          caseHref={(reference) => `${admin ? "/admin" : "/dashboard"}/cases/${reference}`}
        />
        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
          <button type="button" onClick={() => setAsking(null)} className="text-xs font-semibold text-slate hover:text-ink">
            ← Change the CNR
          </button>
          {!client && (
            <button type="button" onClick={() => void fetchFromBackup()} disabled={looking} className="text-xs text-slate underline hover:text-ink">
              {looking ? "Asking eCourtsIndia…" : "Court website not working? Use the eCourtsIndia backup (paid)"}
            </button>
          )}
        </div>
        <ErrorNote>{error}</ErrorNote>
      </div>
    );
  }

  // Step one: the CNR, or skip it.
  if (!lookup && !manual) {
    return (
      <div className="space-y-6">
        <form onSubmit={askCourt} className="space-y-4">
          <Field
            label="CNR number"
            hint="16 characters, printed on the court's case status page and on its orders, e.g. HBHC01… for the Telangana High Court."
          >
            <Input
              value={cnr}
              onChange={(e) => setCnr(e.target.value.toUpperCase())}
              maxLength={24}
              autoFocus
              placeholder="HBHC01XXXXXXYYYY"
              className="font-mono uppercase tracking-wider"
            />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" disabled={!cnr.trim()}>
            Next: the court&apos;s captcha
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
              . Open that instead unless this is a separate case.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setLookup(null);
          setManual(false);
          setAsking(null);
        }}
        className="text-xs font-semibold text-slate hover:text-ink"
      >
        ← Use a different CNR
      </button>

      <CaseForm
        key={lookup?.fetchedAt ?? "manual"}
        mode={client ? "client" : "staff"}
        draft={lookup?.draft}
        submitLabel={client ? "Add case" : "Create case"}
        before={
          admin ? (
            <fieldset className="border-t border-line pt-6">
              <legend className="font-serif text-base font-semibold text-ink">Team and client</legend>
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                {/* Not a <Field>: that is a <label>, and this holds several controls. */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Lawyers on the case</p>
                  <p className="mb-2 mt-0.5 text-xs text-slate">Tick as many as the case needs. Each sees it in the lawyer workspace.</p>
                  <TeamPicker lawyers={lawyers.map((l) => ({ id: l.id, name: l.name, detail: personDetail(l) }))} value={team} onChange={setTeam} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Client accounts</p>
                  <p className="mb-2 mt-0.5 text-xs text-slate">Tick every client who should see this case. You can also link them later.</p>
                  <PeoplePicker
                    people={clients.map((c) => ({ id: c.id, name: c.name, detail: personDetail({ phone: c.phone, email: c.email }) }))}
                    value={clientIds}
                    onChange={setClientIds}
                    label="Client accounts"
                    empty="No clients yet. Add them under Clients."
                  />
                </div>
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
                  clientIds,
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
  const text = label ?? (client ? "Add a case" : admin ? "New case" : "Open a case");

  return (
    <>
      <Button tone={tone} size={size} onClick={() => setOpen(true)}>{text}</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={client ? "Add a case" : "New case"} wide>
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
