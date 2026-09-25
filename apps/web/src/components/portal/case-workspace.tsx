"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError, type CaseDetail, type SessionUser } from "@/lib/portal/api";
import { CASE_STAGES, COURT_LEVELS, labelFor } from "@/lib/portal/legal";
import { practiceAreas } from "@/content/practice-areas";
import { causeTitle, courtNumber, daysUntil, formatDate, partyLabel } from "@/lib/portal/format";
import { CaseForm } from "@/components/portal/case-form";
import { CourtRecordPanel, CourtStatusCard } from "@/components/portal/court-record";
import { DocumentsPanel } from "@/components/portal/documents-panel";
import { Timeline } from "@/components/portal/timeline";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Select, Spinner, StatusBadge, SuccessNote } from "@/components/portal/ui";

type Tab = "overview" | "court" | "documents" | "timeline" | "edit";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === "" || children === "—") return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

/** One case, for any signed-in role. What renders follows the API's canEdit/canManage. */
export function CaseWorkspace({ reference, user, basePath }: { reference: string; user: SessionUser; basePath: string }) {
  const [record, setRecord] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [saved, setSaved] = useState<string | null>(null);

  /* Bumped after every change, to refetch — the timeline and document
     list pick up entries the API wrote as a side effect. */
  const [version, setVersion] = useState(0);
  const load = () => setVersion((n) => n + 1);

  useEffect(() => {
    let active = true;
    api<CaseDetail>(`/cases/${encodeURIComponent(reference)}`)
      .then((result) => {
        if (!active) return;
        setRecord(result);
        setError(null);
      })
      .catch((cause: ApiError) => active && setError(cause));
    return () => {
      active = false;
    };
  }, [reference, version]);

  if (error) {
    return (
      <Card>
        <EmptyState title={error.status === 404 ? "Case not found" : "Could not load this case"} action={<Link href={`${basePath}/cases`} className="text-sm font-semibold text-gold-deep underline">Back to cases</Link>}>
          {error.status === 404 ? "It may not exist, or it is not shared with your account." : error.message}
        </EmptyState>
      </Card>
    );
  }
  if (!record) return <Spinner />;

  const number = courtNumber(record);
  const title = causeTitle(record.parties);
  const hearingIn = daysUntil(record.nextHearingDate);
  const parties = record.parties;
  const countByRole = (role: string) => parties.filter((p) => p.role === role).length;
  const onSynced = (updated: CaseDetail, message: string) => {
    setRecord(updated);
    setSaved(message);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "court", label: "Court record" },
    { id: "documents", label: `Documents (${record.documents.length})` },
    { id: "timeline", label: "Timeline" },
    ...(record.canEdit ? [{ id: "edit" as const, label: "Edit details" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${basePath}/cases`} className="text-xs font-semibold text-slate hover:text-ink">
          ← All {user.kind === "client" ? "matters" : "cases"}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-gold-deep">{record.reference}</span>
              <StatusBadge status={record.status} />
              <Badge>{labelFor(CASE_STAGES, record.stage)}</Badge>
            </div>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{record.title}</h1>
            <p className="mt-1 text-sm text-slate">
              {[number, record.courtName, record.bench].filter(Boolean).join(" · ") || labelFor(COURT_LEVELS, record.courtLevel)}
            </p>
          </div>
          {record.nextHearingDate && (
            <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-right">
              <p className="portal-label text-xs font-semibold uppercase tracking-wide text-gold-deep">Next hearing</p>
              <p className="font-serif text-lg font-semibold text-ink">{formatDate(record.nextHearingDate)}</p>
              <p className="text-xs text-slate">
                {hearingIn !== null && hearingIn >= 0 ? (hearingIn === 0 ? "Today" : `In ${hearingIn} day${hearingIn === 1 ? "" : "s"}`) : "Date has passed"}
                {record.nextHearingPurpose && ` · ${record.nextHearingPurpose}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav aria-label="Case sections" className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setSaved(null);
            }}
            aria-current={tab === item.id ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${
              tab === item.id ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <SuccessNote>{saved}</SuccessNote>

      {tab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Case details" />
              <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Forum">{labelFor(COURT_LEVELS, record.courtLevel)}</Detail>
                <Detail label="Court">{record.courtName}</Detail>
                <Detail label="Seat / bench">{record.bench}</Detail>
                <Detail label="State / district">{[record.district, record.state].filter(Boolean).join(", ")}</Detail>
                <Detail label="Case number">{number}</Detail>
                <Detail label="Case type">{record.caseTypeName}</Detail>
                <Detail label="CNR">{record.cnrNumber && <span className="font-mono">{record.cnrNumber}</span>}</Detail>
                <Detail label="Filing / diary no.">{record.filingNumber}</Detail>
                <Detail label="Filed on">{record.filingDate && formatDate(record.filingDate)}</Detail>
                <Detail label="Registered on">{record.registrationDate && formatDate(record.registrationDate)}</Detail>
                <Detail label="Court hall">{record.courtHall}</Detail>
                <Detail label="Coram">{record.coram}</Detail>
                <Detail label="Last hearing">{record.lastHearingDate && formatDate(record.lastHearingDate)}</Detail>
                <Detail label="Disposed on">{record.disposalDate && `${formatDate(record.disposalDate)}${record.disposalNature ? ` — ${record.disposalNature}` : ""}`}</Detail>
                <Detail label="Practice area">{practiceAreas.find((area) => area.slug === record.practiceArea)?.name}</Detail>
                <Detail label="Court below">{[record.originCourt, record.originCaseNumber].filter(Boolean).join(" · ")}</Detail>
                <Detail label="Impugned order">{record.impugnedOrderDate && formatDate(record.impugnedOrderDate)}</Detail>
                <Detail label="Opened">{formatDate(record.createdAt)}{record.createdByClient ? " (by client)" : ""}</Detail>
              </dl>
              {(record.summary || record.actsAndSections.length > 0 || record.reliefSought) && (
                <div className="space-y-4 border-t border-line px-5 py-5">
                  {record.summary && <Detail label="Summary"><span className="whitespace-pre-line">{record.summary}</span></Detail>}
                  {record.actsAndSections.length > 0 && (
                    <Detail label="Acts and sections">
                      <ul className="list-disc space-y-0.5 pl-5">
                        {record.actsAndSections.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </Detail>
                  )}
                  {record.reliefSought && <Detail label="Relief sought"><span className="whitespace-pre-line">{record.reliefSought}</span></Detail>}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Parties" description={title ?? undefined} />
              {parties.length === 0 ? (
                <EmptyState title="No parties recorded" />
              ) : (
                <ul className="divide-y divide-line">
                  {parties.map((party) => (
                    <li key={party.id ?? `${party.role}-${party.position}`} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
                      <div>
                        <p className="portal-label text-xs font-semibold uppercase tracking-wide text-slate">{partyLabel(party, countByRole(party.role))}</p>
                        <p className="text-sm text-ink">{party.name}</p>
                        {party.counsel && <p className="text-xs text-slate">Counsel: {party.counsel}</p>}
                      </div>
                      {party.isClient && <Badge tone="gold">Our client</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <CourtStatusCard record={record} onSynced={onSynced} />
            <TeamCard record={record} onChange={load} />
            {record.canManage && <ClientsCard record={record} onChange={load} />}
          </div>
        </div>
      )}

      {tab === "court" && <CourtRecordPanel record={record} onSynced={onSynced} />}

      {tab === "documents" && (
        <Card>
          <DocumentsPanel
            caseReference={record.reference}
            documents={record.documents}
            user={user}
            canEdit={record.canEdit}
            canManage={record.canManage}
            onChange={load}
          />
        </Card>
      )}

      {tab === "timeline" && (
        <Card>
          <Timeline caseReference={record.reference} entries={record.updates} user={user} onChange={load} />
        </Card>
      )}

      {tab === "edit" && record.canEdit && (
        <Card className="p-5 sm:p-7">
          <CaseForm
            key={record.updatedAt}
            mode="staff"
            initial={record}
            submitLabel="Save changes"
            onSubmit={async (payload) => {
              const updated = await api<CaseDetail>(`/cases/${encodeURIComponent(record.reference)}`, { method: "PATCH", body: payload });
              setRecord(updated);
              setTab("overview");
              setSaved("Case details saved. Status, stage and hearing changes have been added to the timeline.");
            }}
          />
        </Card>
      )}
    </div>
  );
}

type StaffOption = { id: string; name: string; role: string; isActive: boolean };

function TeamCard({ record, onChange }: { record: CaseDetail; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [draft, setDraft] = useState(record.assignments.map((a) => ({ userId: a.user.id, role: a.role })));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    api<{ data: StaffOption[] }>("/admin/users")
      .then((result) => setStaff(result.data.filter((u) => u.isActive && u.role !== "EDITOR")))
      .catch((cause: Error) => setError(cause.message));
  }, [editing]);

  async function save() {
    setError(null);
    try {
      await api(`/cases/${encodeURIComponent(record.reference)}/assignments`, { method: "PUT", body: { assignments: draft } });
      setEditing(false);
      onChange();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const available = staff.filter((s) => !draft.some((d) => d.userId === s.id));

  return (
    <Card>
      <CardHeader
        title={record.canEdit ? "Lawyers on this case" : "Your legal team"}
        action={record.canManage && !editing ? <Button tone="secondary" size="sm" onClick={() => setEditing(true)}>Change</Button> : undefined}
      />
      {!editing ? (
        record.assignments.length === 0 ? (
          <p className="px-5 py-5 text-sm text-slate">No lawyer assigned yet{record.canEdit ? "." : " — the firm will assign one shortly."}</p>
        ) : (
          <ul className="divide-y divide-line">
            {record.assignments.map((a) => (
              <li key={a.user.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={a.user.name} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{a.user.name}</p>
                  <p className="truncate text-xs text-slate">
                    {a.role === "LEAD" ? "Lead counsel" : a.role === "ASSOCIATE" ? "Associate" : "Support"} · {a.user.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-3 px-5 py-4">
          {draft.map((entry, index) => {
            const person = staff.find((s) => s.id === entry.userId) ?? record.assignments.find((a) => a.user.id === entry.userId)?.user;
            return (
              <div key={entry.userId} className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm">{person?.name ?? "…"}</p>
                <Select
                  aria-label="Role on case"
                  value={entry.role}
                  onChange={(e) => setDraft(draft.map((d, i) => (i === index ? { ...d, role: e.target.value } : d)))}
                  options={[{ value: "LEAD", label: "Lead" }, { value: "ASSOCIATE", label: "Associate" }, { value: "SUPPORT", label: "Support" }]}
                  className="w-32"
                />
                <button type="button" onClick={() => setDraft(draft.filter((_, i) => i !== index))} className="text-xs text-slate hover:text-red-700">Remove</button>
              </div>
            );
          })}
          {available.length > 0 && (
            <Select
              aria-label="Add lawyer"
              value=""
              onChange={(e) => e.target.value && setDraft([...draft, { userId: e.target.value, role: draft.length ? "ASSOCIATE" : "LEAD" }])}
              placeholder="+ Add a lawyer"
              options={available.map((s) => ({ value: s.id, label: `${s.name} (${s.role.toLowerCase()})` }))}
            />
          )}
          <ErrorNote>{error}</ErrorNote>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void save()}>Save team</Button>
            <Button size="sm" tone="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

type ClientOption = { id: string; name: string; email: string; isActive: boolean };

function ClientsCard({ record, onChange }: { record: CaseDetail; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [draft, setDraft] = useState((record.clients ?? []).map((c) => c.id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    api<{ data: ClientOption[] }>("/admin/clients?limit=200")
      .then((result) => setOptions(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, [editing]);

  async function save() {
    setError(null);
    try {
      await api(`/cases/${encodeURIComponent(record.reference)}/clients`, { method: "PUT", body: { clientIds: draft } });
      setEditing(false);
      onChange();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Client access"
        description="Accounts that see this case on their dashboard."
        action={!editing ? <Button tone="secondary" size="sm" onClick={() => setEditing(true)}>Change</Button> : undefined}
      />
      {!editing ? (
        (record.clients ?? []).length === 0 ? (
          <p className="px-5 py-5 text-sm text-slate">No client account linked. The client will not see this case until one is.</p>
        ) : (
          <ul className="divide-y divide-line">
            {record.clients!.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="text-xs text-slate">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-3 px-5 py-4">
          {draft.map((id) => {
            const client = options.find((o) => o.id === id) ?? record.clients?.find((c) => c.id === id);
            return (
              <div key={id} className="flex items-center justify-between gap-2">
                <p className="truncate text-sm">{client?.name ?? "…"} <span className="text-xs text-slate">{client?.email}</span></p>
                <button type="button" onClick={() => setDraft(draft.filter((d) => d !== id))} className="text-xs text-slate hover:text-red-700">Remove</button>
              </div>
            );
          })}
          <Select
            aria-label="Add client"
            value=""
            onChange={(e) => e.target.value && setDraft([...draft, e.target.value])}
            placeholder="+ Link a client account"
            options={options.filter((o) => o.isActive && !draft.includes(o.id)).map((o) => ({ value: o.id, label: `${o.name} — ${o.email}` }))}
          />
          <p className="text-xs text-slate">Not listed? Add the client under Clients first, using the Google email they will sign in with.</p>
          <ErrorNote>{error}</ErrorNote>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void save()}>Save access</Button>
            <Button size="sm" tone="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
