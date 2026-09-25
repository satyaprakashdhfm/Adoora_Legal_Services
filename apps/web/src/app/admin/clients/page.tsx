"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { courtNumber } from "@/lib/portal/format";
import { formatDate } from "@/lib/portal/format";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  PageTitle,
  Select,
  Spinner,
  StatusBadge,
  Table,
  Td,
  Textarea,
  Th,
} from "@/components/portal/ui";

type ClientRow = {
  id: string;
  email: string;
  name: string;
  kind: "INDIVIDUAL" | "ORGANISATION";
  organisation: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  googleLinked: boolean;
  cases: { id: string; reference: string; title: string; status: string }[];
};

/**
 * Which cases the client can see. Picking a case here is the same link as
 * "Client access" on the case page — the client's dashboard shows it from
 * their next visit. A client who has none yet can still sign in and open
 * their own matter from its CNR; it arrives here as Intake.
 */
function CasePicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);

  useEffect(() => {
    api<Page<CaseSummary>>("/cases?limit=100")
      .then((page) => setCases(page.data))
      .catch(() => setCases([]));
  }, []);

  const label = (c: CaseSummary) => [c.reference, c.title, courtNumber(c)].filter(Boolean).join(" · ");

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((id) => {
            const c = cases?.find((item) => item.id === id);
            return (
              <li key={id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-paper-warm px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-mono text-xs font-semibold text-gold-deep">{c?.reference ?? "…"}</span>{" "}
                  {c?.title}
                </span>
                <button type="button" onClick={() => onChange(value.filter((v) => v !== id))} className="shrink-0 text-xs text-slate hover:text-red-700">
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Select
        aria-label="Link a case"
        value=""
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}
        placeholder={cases === null ? "Loading cases…" : cases.length === 0 ? "No cases yet" : "+ Link a case"}
        options={(cases ?? []).filter((c) => !value.includes(c.id)).map((c) => ({ value: c.id, label: label(c) }))}
        disabled={!cases?.length}
      />
    </div>
  );
}

function ClientForm({ initial, onSaved }: { initial?: ClientRow; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [caseIds, setCaseIds] = useState<string[]>(() => initial?.cases.map((c) => c.id) ?? []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await api(`/admin/clients/${initial.id}`, {
          method: "PATCH",
          body: { name: data.name, kind: data.kind, organisation: data.organisation, phone: data.phone, address: data.address, isActive: data.isActive === "true", caseIds },
        });
      } else {
        await api("/admin/clients", { method: "POST", body: { ...data, caseIds } });
      }
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Google email" required className="sm:col-span-2" hint={initial ? "The sign-in email cannot be changed." : "The address they will sign in with. Their account is linked the first time they use “Continue with Google”."}>
        <Input name="email" type="email" required defaultValue={initial?.email} disabled={Boolean(initial)} />
      </Field>
      <Field label="Name" required>
        <Input name="name" required minLength={2} defaultValue={initial?.name} />
      </Field>
      <Field label="Type">
        <Select name="kind" defaultValue={initial?.kind ?? "INDIVIDUAL"} options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "ORGANISATION", label: "Organisation" }]} />
      </Field>
      <Field label="Organisation">
        <Input name="organisation" defaultValue={initial?.organisation ?? ""} />
      </Field>
      <Field label="Phone">
        <Input name="phone" type="tel" defaultValue={initial?.phone ?? ""} />
      </Field>
      <Field label="Address" className="sm:col-span-2">
        <Textarea name="address" rows={2} defaultValue={initial?.address ?? ""} />
      </Field>
      {/* Not a <Field>: that is a <label>, and this holds several controls. */}
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Cases</p>
        <div className="mt-1.5">
          <CasePicker value={caseIds} onChange={setCaseIds} />
        </div>
        <p className="mt-1 text-xs text-slate">
          {initial
            ? "The cases this client sees on their dashboard."
            : "Attach the client's case now so it is waiting when they sign in. No case yet? They can open one from its CNR after signing in."}
        </p>
      </div>
      {initial && (
        <Field label="Account" className="sm:col-span-2" hint="Deactivating signs the client out everywhere at once.">
          <Select name="isActive" defaultValue={String(initial.isActive)} options={[{ value: "true", label: "Active" }, { value: "false", label: "Deactivated" }]} />
        </Field>
      )}
      <div className="space-y-3 sm:col-span-2">
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save client" : "Add client"}</Button>
      </div>
    </form>
  );
}

export default function AdminClients() {
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientRow | "new" | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: "200" });
    if (query.trim()) params.set("q", query.trim());
    api<{ data: ClientRow[] }>(`/admin/clients?${params}`)
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Clients"
        title="Client accounts"
        description="Clients sign in with Google. Add one in advance so their cases are waiting for them, or link a case to someone who has already signed in."
        actions={<Button onClick={() => setEditing("new")}>Add client</Button>}
      />

      <Card>
        <div className="border-b border-line p-4">
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or organisation" aria-label="Search clients" />
        </div>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No clients yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Contact</Th>
                <Th>Cases</Th>
                <Th>Sign-in</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.isActive ? "" : "opacity-60"}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} src={row.avatarUrl} size={32} />
                      <div>
                        <p className="font-semibold">{row.name}</p>
                        {row.organisation && <p className="text-xs text-slate">{row.organisation}</p>}
                        {!row.isActive && <Badge tone="red">Deactivated</Badge>}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs">
                    {row.email}
                    {row.phone && <><br />{row.phone}</>}
                  </Td>
                  <Td className="text-xs">
                    {row.cases.length === 0 ? (
                      <span className="text-slate">None linked</span>
                    ) : (
                      <ul className="space-y-1">
                        {row.cases.slice(0, 3).map((c) => (
                          <li key={c.reference} className="flex items-center gap-1.5">
                            <Link href={`/admin/cases/${c.reference}`} className="font-mono text-gold-deep hover:underline">{c.reference}</Link>
                            <StatusBadge status={c.status} />
                          </li>
                        ))}
                        {row.cases.length > 3 && <li className="text-slate">+{row.cases.length - 3} more</li>}
                      </ul>
                    )}
                  </Td>
                  <Td className="text-xs">
                    {row.googleLinked ? <Badge tone="green">Google linked</Badge> : <Badge>Not signed in yet</Badge>}
                    <p className="mt-1 text-slate">{row.lastLoginAt ? `Last ${formatDate(row.lastLoginAt)}` : `Added ${formatDate(row.createdAt)}`}</p>
                  </Td>
                  <Td className="text-right">
                    <Button tone="secondary" size="sm" onClick={() => setEditing(row)}>Edit</Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a client" : "Edit client"}>
        {editing !== null && (
          <ClientForm
            initial={editing === "new" ? undefined : editing}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
