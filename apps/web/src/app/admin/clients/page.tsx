"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, refreshWebsite, type CaseSummary, type Page } from "@/lib/portal/api";
import { checkLogo, LOGO_GUIDE, LOGO_TYPES } from "@/lib/portal/partner-logo";
import { ListToolbar } from "@/components/portal/list-toolbar";
import { courtNumber } from "@/lib/portal/format";
import { PeoplePicker } from "@/components/portal/people-picker";
import { DeleteDialog } from "@/components/portal/delete-dialog";
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
  /** None when they sign in with their mobile number only. */
  email: string | null;
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
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  cases: { id: string; reference: string; title: string; status: string }[];
  /** An organisation's entry in the home page's "Our Partners", if it has one. */
  partner: ClientPartner | null;
};

type ClientPartner = { id: string; published: boolean; logoUrl: string | null };

const KIND_FILTER = [
  { value: "INDIVIDUAL", label: "Individuals" },
  { value: "ORGANISATION", label: "Organisations" },
] as const;
const STATUS_FILTER = [
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
] as const;
const CASES_FILTER = [
  { value: "with", label: "With cases" },
  { value: "without", label: "No cases yet" },
] as const;
const SIGN_IN_FILTER = [
  { value: "signed-in", label: "Has signed in" },
  { value: "never", label: "Never signed in" },
] as const;
const WEBSITE_FILTER = [{ value: "shown", label: "On the home page" }] as const;
const CLIENT_SORT = [
  { value: "name", label: "Name, A to Z" },
  { value: "name-desc", label: "Name, Z to A" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "last-sign-in", label: "Last signed in" },
  { value: "most-cases", label: "Most cases" },
] as const;

/**
 * Which cases the client can see. Picking a case here is the same link as
 * "Client accounts" on the case page — the client's dashboard shows it from
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

  if (cases === null) return <p className="text-sm text-slate">Loading cases…</p>;
  return (
    <PeoplePicker
      people={cases.map((c) => ({ id: c.id, name: c.title, detail: [c.reference, courtNumber(c)].filter(Boolean).join(" · ") }))}
      value={value}
      onChange={onChange}
      label="Cases this client can see"
      empty="No cases yet."
    />
  );
}

function ClientForm({ initial, onSaved }: { initial?: ClientRow; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [caseIds, setCaseIds] = useState<string[]>(() => initial?.cases.map((c) => c.id) ?? []);
  const [kind, setKind] = useState<ClientRow["kind"]>(initial?.kind ?? "INDIVIDUAL");
  const [deleting, setDeleting] = useState(false);
  const organisation = kind === "ORGANISATION";
  const [showOnWebsite, setShowOnWebsite] = useState(initial?.partner?.published ?? false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const currentLogo = logoPreview ?? initial?.partner?.logoUrl ?? null;

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  async function pickLogo(file: File | undefined) {
    setLogo(null);
    setLogoPreview(null);
    setLogoError(null);
    if (!file) return;
    const problem = await checkLogo(file);
    if (problem) {
      setLogoError(problem);
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setSaving(true);
    setError(null);
    const website = organisation && showOnWebsite;
    if (website && !logo && !initial?.partner?.logoUrl) {
      setLogoError("Please upload the organisation's logo to show it on the home page.");
      setSaving(false);
      return;
    }
    try {
      const saved = initial
        ? await api<{ id: string; partner: ClientPartner | null }>(`/admin/clients/${initial.id}`, {
            method: "PATCH",
            body: { name: data.name, kind, organisation: data.organisation ?? "", phone: data.phone, address: data.address ?? "", isActive: data.isActive === "true", caseIds, showOnWebsite: website, ...(initial?.email ? {} : { email: data.email ?? "" }) },
          })
        : await api<{ id: string; partner: ClientPartner | null }>("/admin/clients", { method: "POST", body: { ...data, kind, caseIds, showOnWebsite: website } });
      if (website && logo && saved.partner) {
        const upload = new FormData();
        upload.set("logo", logo);
        await api(`/admin/partners/${saved.partner.id}/logo`, { method: "PUT", body: upload });
      }
      // The home page changes whenever the tick, the name or the logo might have.
      if (website || initial?.partner) await refreshWebsite(["website-partners"]);
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {/* Individuals need a name and a phone; an organisation also its name and address. */}
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Client is</p>
        <div className="mt-1.5 inline-flex rounded-md border border-line-strong p-0.5" role="radiogroup" aria-label="Client is">
          {(["INDIVIDUAL", "ORGANISATION"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={kind === value}
              onClick={() => setKind(value)}
              className={`rounded px-4 py-1.5 text-sm font-semibold transition ${kind === value ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
            >
              {value === "INDIVIDUAL" ? "An individual" : "An organisation"}
            </button>
          ))}
        </div>
      </div>
      {organisation && (
        <Field label="Organisation name" required className="sm:col-span-2">
          <Input name="organisation" required minLength={2} maxLength={200} placeholder="e.g. Sri Venkateswara Constructions Pvt. Ltd." defaultValue={initial?.organisation ?? ""} />
        </Field>
      )}
      <Field label={organisation ? "Contact person" : "Name"} required>
        <Input name="name" required minLength={2} defaultValue={initial?.name} />
      </Field>
      <Field label="Mobile number" required hint="They sign in with an OTP sent to this number.">
        <Input name="phone" type="tel" required minLength={10} maxLength={32} defaultValue={initial?.phone ?? ""} />
      </Field>
      <Field
        label="Email"
        className="sm:col-span-2"
        hint={initial?.email ? "The sign-in email cannot be changed." : "Optional. With it, they can also sign in with Google."}
      >
        <Input name="email" type="email" defaultValue={initial?.email ?? ""} disabled={Boolean(initial?.email)} />
      </Field>
      {organisation && (
        <Field label="Office address" className="sm:col-span-2">
          <Textarea name="address" rows={2} defaultValue={initial?.address ?? ""} />
        </Field>
      )}
      {organisation && (
        <div className="rounded-lg border border-line bg-paper-warm p-4 sm:col-span-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={showOnWebsite}
              onChange={(event) => {
                setShowOnWebsite(event.target.checked);
                setLogoError(null);
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">Show on the home page</span>
              <span className="block text-xs text-slate">Adds the organisation&apos;s logo to Our Partners on the website. Untick to take it off again.</span>
            </span>
          </label>
          {showOnWebsite && (
            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-[repeating-conic-gradient(var(--color-paper-tint)_0_25%,white_0_50%)] bg-[length:12px_12px]">
                {currentLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local preview or an uploaded logo
                  <img src={currentLogo} alt="" className="h-16 w-16 object-contain" />
                ) : (
                  <span className="text-[10px] font-semibold uppercase text-slate">No logo</span>
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <label className="inline-flex cursor-pointer items-center rounded-md border border-line-strong bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-gold">
                  {currentLogo ? "Choose another logo" : "Upload logo"} <span className="ml-1 text-gold-deep">*</span>
                  <input type="file" accept={LOGO_TYPES.join(",")} className="sr-only" onChange={(e) => void pickLogo(e.target.files?.[0])} />
                </label>
                <p className="text-xs text-slate">{LOGO_GUIDE}</p>
                {logoError && <p className="text-xs font-semibold text-red-700">{logoError}</p>}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Not a <Field>: that is a <label>, and this holds several controls. */}
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Cases</p>
        <div className="mt-1.5">
          <CasePicker value={caseIds} onChange={setCaseIds} />
        </div>
        <p className="mt-1 text-xs text-slate">
          {initial
            ? "The cases this client sees on their dashboard."
            : "Attach the client's case now so it is waiting when they sign in. No case yet? Link it later, here or from the case's Client accounts card."}
        </p>
      </div>
      {initial && (
        <Field label="Account" className="sm:col-span-2" hint="Deactivating signs the client out everywhere at once.">
          <Select name="isActive" defaultValue={String(initial.isActive)} options={[{ value: "true", label: "Active" }, { value: "false", label: "Deactivated" }]} />
        </Field>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3 sm:col-span-2">
        <div className="space-y-3">
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save client" : "Add client"}</Button>
        </div>
        {initial && (
          <Button tone="danger" size="sm" onClick={() => setDeleting(true)}>
            Delete client
          </Button>
        )}
      </div>
      {initial && (
        <DeleteDialog
          open={deleting}
          onClose={() => setDeleting(false)}
          title={`Delete ${initial.name}?`}
          goes={[
            <>The client account of <strong>{initial.name}</strong>: they can no longer sign in, and are signed out now</>,
            "The queries they raised, with the firm's replies",
            initial.cases.length
              ? `Their access to ${initial.cases.length === 1 ? "1 case" : `${initial.cases.length} cases`}`
              : "Nothing else: no cases are linked",
          ]}
          stays={["The cases themselves, and every file on them, including files this client uploaded"]}
          actionLabel="Delete client"
          onConfirm={async () => {
            await api(`/admin/clients/${initial.id}`, { method: "DELETE" });
            onSaved();
          }}
        />
      )}
    </form>
  );
}

export default function AdminClients() {
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [cases, setCases] = useState("");
  const [signIn, setSignIn] = useState("");
  const [website, setWebsite] = useState("");
  const [sort, setSort] = useState("name");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientRow | "new" | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: "200", sort });
    if (query.trim()) params.set("q", query.trim());
    for (const [key, value] of Object.entries({ kind, status, cases, signIn, website })) if (value) params.set(key, value);
    api<{ data: ClientRow[] }>(`/admin/clients?${params}`)
      .then((result) => {
        setRows(result.data);
        setError(null);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [query, kind, status, cases, signIn, website, sort]);

  useEffect(() => {
    const timer = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  function reset() {
    setQuery("");
    setKind("");
    setStatus("");
    setCases("");
    setSignIn("");
    setWebsite("");
  }

  const filtered = Boolean(query.trim() || kind || status || cases || signIn || website);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Clients"
        title="Client accounts"
        description="Clients sign in with their email. Add one in advance so their cases are waiting for them, or link a case to someone who has already signed in."
        actions={<Button onClick={() => setEditing("new")}>Add client</Button>}
      />

      <Card>
        <ListToolbar
          search={{ value: query, onChange: setQuery, placeholder: "Search by client, organisation, contact, or case" }}
          filters={[
            { key: "kind", label: "Type", value: kind, options: KIND_FILTER, onChange: setKind },
            { key: "status", label: "Account", value: status, options: STATUS_FILTER, onChange: setStatus },
            { key: "cases", label: "Cases", value: cases, options: CASES_FILTER, onChange: setCases },
            { key: "signIn", label: "Sign-in", value: signIn, options: SIGN_IN_FILTER, onChange: setSignIn },
            { key: "website", label: "Website", value: website, options: WEBSITE_FILTER, onChange: setWebsite },
          ]}
          sort={{ value: sort, options: CLIENT_SORT, onChange: setSort }}
          count={rows ? `${rows.length} client${rows.length === 1 ? "" : "s"}${rows.length === 200 ? " (first 200)" : ""}` : undefined}
          onReset={reset}
        />
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          filtered ? (
            <EmptyState title="No clients match" action={<Button tone="secondary" onClick={reset}>Clear filters</Button>}>
              Try a shorter search, or clear the filters.
            </EmptyState>
          ) : (
            <EmptyState title="No clients yet" />
          )
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
                        {row.partner?.published && <Badge tone="gold">On the home page</Badge>}
                        {!row.isActive && <Badge tone="red">Deactivated</Badge>}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs">
                    {row.email}
                    {!row.emailVerifiedAt && (
                      <span className="ml-1.5" title="Signed up with mobile OTP; the email was typed, not proven. It is verified the first time they sign in with Google.">
                        <Badge tone="gold">unverified</Badge>
                      </span>
                    )}
                    {row.phone && (
                      <>
                        <br />
                        {row.phone}
                        {row.phoneVerifiedAt && <span className="ml-1.5 text-emerald-700" title="Proven by OTP">✓ OTP</span>}
                      </>
                    )}
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
