"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, refreshWebsite, type LawyerProfile, type StaffRole } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { formatDate } from "@/lib/portal/format";
import { practiceAreas } from "@/content/practice-areas";
import { STATES_AND_UTS } from "@/lib/portal/legal";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, Field, Input, Modal, PageTitle, Select, Spinner, Table, Td, Textarea, Th } from "@/components/portal/ui";
import { ListToolbar } from "@/components/portal/list-toolbar";

const ACCOUNT_FILTER = [
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
] as const;
const WEBSITE_FILTER = [
  { value: "shown", label: "Shown" },
  { value: "home", label: "On the home page" },
  { value: "hidden", label: "Not shown" },
] as const;
const KIND_FILTER = [
  { value: "firm", label: "Firm lawyers" },
  { value: "third-party", label: "Third-party lawyers" },
] as const;
const TEAM_SORT = [
  { value: "name", label: "Name, A to Z" },
  { value: "cases", label: "Most cases" },
  { value: "last-sign-in", label: "Last signed in" },
  { value: "newest", label: "Newest added" },
] as const;

/**
 * Everyone at the firm, in one list: people with a sign-in account and people
 * shown on the website only. One form covers both — who they are, what they
 * can open in the portal, and whether (and how) the website shows them.
 * Website → Lawyer profiles is a read-only view of the same records.
 */

type StaffRow = {
  id: string;
  email: string | null;
  name: string;
  role: StaffRole;
  isLawyer: boolean;
  isActive: boolean;
  phone: string | null;
  barEnrolment: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  hasPassword: boolean;
  googleLinked: boolean;
  _count: { assignments: number };
};

type Person = { key: string; user: StaffRow | null; profile: LawyerProfile | null };

type ServerEmail = { email: string; role: StaffRole | null; isActive: boolean | null };

/**
 * Who can sign in where, by email: the admin console (people ticked Admin),
 * the lawyers' dashboard (people ticked Lawyer), and the emails the server
 * itself admits as admins (ADMIN_EMAILS). A lawyer who helps run the firm is
 * ticked as both.
 */
function SignInAccess({ users }: { users: StaffRow[] }) {
  const [serverEmails, setServerEmails] = useState<ServerEmail[] | null>(null);
  useEffect(() => {
    api<{ serverEmails: ServerEmail[] }>("/admin/access")
      .then((result) => setServerEmails(result.serverEmails))
      .catch(() => setServerEmails([]));
  }, []);

  const active = users.filter((u) => u.isActive);
  const consoleUsers = active.filter(isAdmin);
  const lawyers = active.filter(isLawyer);
  const pending = (serverEmails ?? []).filter((entry) => !entry.role);

  const row = (u: StaffRow) => (
    <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{u.email}</p>
        <p className="text-xs text-slate">
          {u.name} · {u.lastLoginAt ? `last signed in ${formatDate(u.lastLoginAt)}` : "has not signed in yet"}
        </p>
      </div>
      <div className="flex gap-1">
        <AccessBadges user={u} />
      </div>
    </li>
  );

  return (
    <Card>
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-ink">Who can sign in</h2>
        <p className="mt-1 text-sm text-slate">
          Access goes by email and the Admin and Lawyer ticks. To give someone access, add them below or change their ticks with Edit.
        </p>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-ink">
            Admin console <span className="font-normal text-slate">· /admin/login</span>
          </h3>
          <p className="mt-0.5 text-xs text-slate">Admins see every case and manage the website and the team.</p>
          {consoleUsers.length ? (
            <ul className="mt-2 divide-y divide-line">{consoleUsers.map(row)}</ul>
          ) : (
            <p className="mt-2 text-sm text-slate">No one yet.</p>
          )}
          {pending.length > 0 && (
            <div className="mt-3 rounded-lg border border-line bg-paper-warm px-3.5 py-3">
              <p className="text-xs font-semibold text-ink">Also allowed by the server settings (ADMIN_EMAILS)</p>
              <ul className="mt-1.5 space-y-1">
                {pending.map((entry) => (
                  <li key={entry.email} className="text-sm text-ink-soft">
                    {entry.email} <span className="text-xs text-slate">· becomes an Admin on first Google sign-in</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-ink">
            Lawyer dashboard <span className="font-normal text-slate">· /lawyer/login</span>
          </h3>
          <p className="mt-0.5 text-xs text-slate">Everyone ticked Lawyer: each sees only the cases assigned to them here.</p>
          {lawyers.length ? (
            <ul className="mt-2 divide-y divide-line">{lawyers.map(row)}</ul>
          ) : (
            <p className="mt-2 text-sm text-slate">No lawyers yet.</p>
          )}
        </section>
      </div>
      <p className="border-t border-line px-5 py-3.5 text-xs leading-relaxed text-slate">
        Sign-in is by the email (Gmail) or mobile number saved on each person below. The three sign-ins are independent: someone
        ticked as both can be signed in to the admin console, the lawyer dashboard and, with a client account, the client dashboard at
        the same time. A lawyer who also runs the firm: tick both <strong className="text-ink">Admin</strong> and{" "}
        <strong className="text-ink">Lawyer</strong>. Deactivated people are not listed.
      </p>
    </Card>
  );
}

const isAdmin = (user: StaffRow | null | undefined) => user?.role === "ADMIN";
const isLawyer = (user: StaffRow | null | undefined) => Boolean(user && (user.role === "LAWYER" || user.isLawyer));

const ACCESS_FILTER = [
  { value: "admin", label: "Admin" },
  { value: "lawyer", label: "Lawyer" },
] as const;

function AccessBadges({ user }: { user: StaffRow | null }) {
  if (!isAdmin(user) && !isLawyer(user)) return <span className="text-slate">—</span>;
  return (
    <>
      {isAdmin(user) && <Badge tone="gold">Admin</Badge>}
      {isLawyer(user) && <Badge tone="blue">Lawyer</Badge>}
    </>
  );
}

/** Uploaded portrait, or one bundled with the website (all shipped as .jpg). */
const portrait = (p: LawyerProfile | null) => (p ? (p.photoUrl ?? (p.photo ? `/${p.photo}.jpg` : null)) : null);

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
/** Paragraphs are separated by a blank line. */
const paragraphs = (value: string) => value.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);

function PracticePicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {practiceAreas.map((area) => {
        const on = value.includes(area.slug);
        return (
          <button
            key={area.slug}
            type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== area.slug) : [...value, area.slug])}
            aria-pressed={on}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${on ? "border-gold bg-gold/15 text-gold-deep" : "border-line-strong text-ink-soft hover:border-gold"}`}
          >
            {area.shortName}
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border-t border-line pt-4 sm:col-span-2">
      <p className="font-serif text-base font-semibold text-ink">{title}</p>
      {hint && <p className="text-xs text-slate">{hint}</p>}
    </div>
  );
}

function PersonForm({ person, self, onSaved }: { person: Person | null; self: boolean; onSaved: () => void }) {
  const user = person?.user ?? null;
  const profile = person?.profile ?? null;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // A new person starts as a lawyer; someone on the website only starts with neither.
  const [admin, setAdmin] = useState(isAdmin(user));
  const [lawyer, setLawyer] = useState(user ? isLawyer(user) : !profile);
  const [thirdParty, setThirdParty] = useState(profile?.thirdParty ?? false);
  const [onWebsite, setOnWebsite] = useState(profile?.published ?? false);
  const [practices, setPractices] = useState<string[]>(profile?.practices ?? []);
  const [photo, setPhoto] = useState<File | null>(null);
  // Kept across a failed save, so a retry updates what was already created.
  const created = useRef<{ userId?: string; profileId?: string }>({});

  const hasAccount = !thirdParty && (admin || lawyer);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form) as Record<string, string>;
    if (onWebsite && form.get("featured") === "on" && !data.summary?.trim()) {
      setError("To feature someone on the home page, write their home page introduction first. It is the text shown beside the portrait.");
      return;
    }
    if (user && !admin && !lawyer) {
      setError("Tick Admin, Lawyer or both. To stop them signing in, set Account to Deactivated.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // 1. The sign-in account.
      let userId = user?.id ?? created.current.userId ?? null;
      if (hasAccount) {
        const account = { name: data.name, phone: data.phone, barEnrolment: data.enrolment, ...(user?.email ? {} : { email: data.email ?? "" }) };
        const access = { role: admin ? "ADMIN" : "LAWYER", isLawyer: lawyer };
        if (userId) {
          await api(`/admin/users/${userId}`, {
            method: "PATCH",
            // You cannot take away your own Admin tick or deactivate yourself.
            body: self ? { ...account, isLawyer: lawyer } : { ...account, ...access, isActive: data.isActive !== "false" },
          });
        } else {
          const result = await api<{ id: string }>("/admin/users", { method: "POST", body: { ...account, ...access } });
          userId = created.current.userId = result.id;
        }
      }

      // 2. The profile: position, portrait and what the website shows.
      const body: Record<string, unknown> = {
        name: data.name,
        designation: data.designation,
        phone: data.phone,
        enrolment: data.enrolment,
        published: onWebsite,
        userId,
        thirdParty,
        address: data.address,
        state: data.state,
        district: data.district,
        court: data.court,
      };
      if (!hasAccount) body.email = data.email;
      if (onWebsite) {
        Object.assign(body, {
          group: data.group,
          qualification: data.qualification,
          office: data.office,
          stateBar: data.stateBar,
          enrolledSince: data.enrolledSince,
          experience: data.experience,
          summary: data.summary,
          practices,
          education: lines(data.education ?? ""),
          memberships: lines(data.memberships ?? ""),
          bio: paragraphs(data.bio ?? ""),
          featured: form.get("featured") === "on",
          ...(data.sortOrder ? { sortOrder: Number(data.sortOrder) } : {}),
        });
        if (hasAccount) body.email = data.publicEmail;
      }
      const profileId = profile?.id ?? created.current.profileId;
      let saved = profileId
        ? await api<LawyerProfile>(`/admin/profiles/${profileId}`, { method: "PATCH", body })
        : await api<LawyerProfile>("/admin/profiles", { method: "POST", body });
      created.current.profileId = saved.id;
      if (photo) {
        const upload = new FormData();
        upload.set("photo", photo);
        saved = await api<LawyerProfile>(`/admin/profiles/${saved.id}/photo`, { method: "PUT", body: upload });
      }
      await refreshWebsite(["website-people"]);
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  }

  async function removeWebsiteOnly() {
    if (!profile || !window.confirm(`Remove ${profile.name} from the firm's list and the website?`)) return;
    try {
      await api(`/admin/profiles/${profile.id}`, { method: "DELETE" });
      await refreshWebsite(["website-people"]);
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const name = user?.name ?? profile?.name ?? "";

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center gap-4 sm:col-span-2">
        <Avatar name={name || "New"} src={photo ? URL.createObjectURL(photo) : (portrait(profile) ?? user?.avatarUrl ?? null)} size={64} />
        <div className="text-sm">
          <label className="cursor-pointer font-semibold text-gold-deep hover:underline">
            {portrait(profile) ? "Replace photo" : "Upload photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-slate">JPEG, PNG or WebP, up to 2 MB. Square or 4:5 portraits crop best. Shown on the website and to clients on their cases.</p>
        </div>
      </div>

      <Field label="Name" required hint="As it should appear, e.g. “Adv. K. L. Ganesh Raghavendra”.">
        <Input name="name" required minLength={2} maxLength={120} defaultValue={name} />
      </Field>
      <Field label="Position" required>
        <Input name="designation" required minLength={2} maxLength={160} placeholder="e.g. Senior Associate" defaultValue={profile?.designation ?? ""} />
      </Field>
      <Field label="Mobile number" required={hasAccount} hint={hasAccount ? "They sign in with an OTP sent to this number." : "Optional."}>
        <Input name="phone" type="tel" required={hasAccount} minLength={hasAccount ? 10 : undefined} maxLength={32} defaultValue={user?.phone ?? profile?.phone ?? ""} />
      </Field>
      <Field
        label="Email"
        hint={user?.email ? "The sign-in email cannot be changed." : hasAccount ? "Optional. With it, they can also sign in with Google." : "Optional."}
      >
        <Input name="email" type="email" disabled={Boolean(user?.email)} defaultValue={user?.email ?? profile?.email ?? ""} />
      </Field>
      <Field label="Bar Council enrolment no.">
        <Input name="enrolment" maxLength={80} placeholder="e.g. TS/1234/2015" defaultValue={user?.barEnrolment ?? profile?.enrolment ?? ""} />
      </Field>
      {/* A third-party lawyer is engaged case by case in another place: no
          account, so both access ticks are cleared. Someone who already
          signs in would have to be removed from the portal first. */}
      {!user && (
        <div className="rounded-lg border border-line bg-paper-warm px-4 py-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={thirdParty}
              onChange={(e) => {
                setThirdParty(e.target.checked);
                if (e.target.checked) {
                  setAdmin(false);
                  setLawyer(false);
                }
              }}
              className="accent-[var(--color-gold)]"
            />
            Third-party lawyer
          </label>
          <p className="mt-0.5 text-xs text-slate">
            A lawyer the firm engages in another place. They do not sign in to the portal; give their address, state, district and court below.
          </p>
        </div>
      )}
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Access to the portal</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            { label: "Admin", description: "The admin console: all cases, documents, clients, the team and the website.", checked: admin, set: setAdmin, locked: self },
            { label: "Lawyer", description: "The lawyer dashboard, and can be put on cases. Sees only the cases assigned to them.", checked: lawyer, set: setLawyer, locked: false },
          ].map((option) => (
            <label
              key={option.label}
              className={`flex gap-2.5 rounded-lg border px-4 py-3 ${option.checked && !thirdParty ? "border-gold bg-gold/10" : "border-line"} ${thirdParty || option.locked ? "opacity-60" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                checked={option.checked && !thirdParty}
                disabled={thirdParty || option.locked}
                onChange={(e) => option.set(e.target.checked)}
                className="mt-0.5 accent-[var(--color-gold)]"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{option.label}</span>
                <span className="block text-xs text-slate">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate">
          {thirdParty ? "A third-party lawyer does not sign in." : self ? "You cannot remove your own Admin access." : "Tick one or both."}
        </p>
      </div>
      {user && !self && (
        <Field label="Account" hint="Deactivating signs them out everywhere at once. Their case history is kept.">
          <Select name="isActive" defaultValue={String(user.isActive)} options={[{ value: "true", label: "Active" }, { value: "false", label: "Deactivated" }]} />
        </Field>
      )}

      <SectionTitle
        title="Where they practise"
        hint={thirdParty ? "Required for a third-party lawyer. For the firm's records only; never shown on the website." : "Optional. For the firm's records only; never shown on the website."}
      />
      <Field label="Address" required={thirdParty} className="sm:col-span-2">
        <Textarea name="address" rows={2} maxLength={500} required={thirdParty} placeholder="Chamber or office address" defaultValue={profile?.address ?? ""} />
      </Field>
      <Field label="State / UT" required={thirdParty}>
        <Select name="state" required={thirdParty} defaultValue={profile?.state ?? ""} placeholder="Select" options={STATES_AND_UTS.map((state) => ({ value: state, label: state }))} />
      </Field>
      <Field label="District" required={thirdParty}>
        <Input name="district" required={thirdParty} maxLength={100} placeholder="e.g. Guntur" defaultValue={profile?.district ?? ""} />
      </Field>
      <Field label="Court" required={thirdParty} className="sm:col-span-2" hint="The court they mainly appear in.">
        <Input name="court" required={thirdParty} maxLength={200} placeholder="e.g. District Court, Guntur" defaultValue={profile?.court ?? ""} />
      </Field>

      <div className="rounded-lg border border-line bg-paper-warm px-4 py-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={onWebsite} onChange={(e) => setOnWebsite(e.target.checked)} className="accent-[var(--color-gold)]" />
          Show on the website
        </label>
        <p className="mt-0.5 text-xs text-slate">On the About page and the practice pages they are ticked for. Untick to hide them without losing anything.</p>
      </div>

      {onWebsite && (
        <>
          <SectionTitle title="Website profile" hint="What visitors see. Factual only — no superlatives (BCI rules)." />
          <Field label="Listed under">
            <Select name="group" defaultValue={profile?.group ?? "LEGAL"} options={[{ value: "LEGAL", label: "Leadership & advocates" }, { value: "BUSINESS", label: "Business development & corporate relations" }]} />
          </Field>
          {hasAccount && (
            <Field label="Email shown on the website" hint="Leave empty to show none.">
              <Input name="publicEmail" type="email" defaultValue={profile ? (profile.email ?? "") : (user?.email ?? "")} />
            </Field>
          )}
          <Field label="Qualification">
            <Input name="qualification" maxLength={160} placeholder="e.g. B.A. LL.B. (Hons.)" defaultValue={profile?.qualification ?? ""} />
          </Field>
          <Field label="Experience">
            <Input name="experience" maxLength={200} placeholder="e.g. 12 years" defaultValue={profile?.experience ?? ""} />
          </Field>
          <Field label="Office">
            <Input name="office" maxLength={120} placeholder="e.g. Hyderabad" defaultValue={profile?.office ?? ""} />
          </Field>
          <Field label="State Bar Council">
            <Input name="stateBar" maxLength={120} placeholder="e.g. Bar Council of Telangana" defaultValue={profile?.stateBar ?? ""} />
          </Field>
          <Field label="Enrolled since">
            <Input name="enrolledSince" type="number" min={1950} max={2100} defaultValue={profile?.enrolledSince ?? ""} />
          </Field>
          <Field label="Display order" hint="Lower numbers come first.">
            <Input name="sortOrder" type="number" min={0} max={9999} defaultValue={profile?.sortOrder ?? ""} placeholder="Last" />
          </Field>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Practices</p>
            <p className="mb-2 mt-0.5 text-xs text-slate">They appear on the Team tab of each practice page ticked here.</p>
            <PracticePicker value={practices} onChange={setPractices} />
          </div>
          <Field label="Home page introduction" className="sm:col-span-2" hint="Three or four lines for the home page’s “Our people” slide.">
            <Textarea name="summary" rows={3} maxLength={1200} defaultValue={profile?.summary ?? ""} />
          </Field>
          <Field label="Biography" className="sm:col-span-2" hint="Separate paragraphs with a blank line. A biography earns a full profile on the About page.">
            <Textarea name="bio" rows={6} defaultValue={profile?.bio.join("\n\n")} />
          </Field>
          <Field label="Education" hint="One per line.">
            <Textarea name="education" rows={3} defaultValue={profile?.education.join("\n")} />
          </Field>
          <Field label="Memberships" hint="One per line.">
            <Textarea name="memberships" rows={3} defaultValue={profile?.memberships.join("\n")} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" name="featured" defaultChecked={profile?.featured ?? false} className="accent-[var(--color-gold)]" />
            Feature on the home page
          </label>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <div className="space-y-3">
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : person ? "Save" : "Add to the team"}</Button>
        </div>
        {profile && !user && (
          <Button tone="ghost" size="sm" onClick={() => void removeWebsiteOnly()}>
            Remove from the team
          </Button>
        )}
      </div>
    </form>
  );
}

export default function AdminStaff() {
  const me = useUser();
  const [users, setUsers] = useState<StaffRow[] | null>(null);
  const [profiles, setProfiles] = useState<LawyerProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Person | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState("");
  const [account, setAccount] = useState("");
  const [website, setWebsite] = useState("");
  const [kind, setKind] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [sort, setSort] = useState("name");

  const load = useCallback(() => {
    api<{ data: StaffRow[] }>("/admin/users")
      .then((result) => setUsers(result.data))
      .catch((cause: Error) => setError(cause.message));
    api<{ data: LawyerProfile[] }>("/admin/profiles")
      .then((result) => setProfiles(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(load, [load]);

  const people: Person[] | null =
    users && profiles
      ? [
          ...users.map((user) => ({ key: user.id, user, profile: profiles.find((p) => p.userId === user.id) ?? null })),
          ...profiles.filter((p) => !p.userId || !users.some((u) => u.id === p.userId)).map((profile) => ({ key: profile.id, user: null, profile })),
        ]
      : null;

  // State and district choices come from the team itself; districts follow the chosen state.
  const unique = (values: (string | null | undefined)[]) =>
    [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))].sort().map((value) => ({ value, label: value }));
  const stateOptions = unique((people ?? []).map((person) => person.profile?.state));
  const districtOptions = unique((people ?? []).filter((person) => !state || person.profile?.state === state).map((person) => person.profile?.district));

  // The team is loaded whole, so search, filters and sort run here.
  const nameOf = (person: Person) => person.user?.name ?? person.profile?.name ?? "";
  const shown = (people ?? [])
    .filter((person) => !access || (access === "admin" ? isAdmin(person.user) : isLawyer(person.user)))
    .filter((person) => !kind || (kind === "third-party") === Boolean(person.profile?.thirdParty))
    .filter((person) => !state || person.profile?.state === state)
    .filter((person) => !district || person.profile?.district?.toLowerCase() === district.toLowerCase())
    .filter((person) => !account || (account === "active" ? person.user?.isActive !== false : person.user?.isActive === false))
    .filter((person) =>
      !website
        ? true
        : website === "hidden"
          ? !person.profile?.published
          : website === "home"
            ? Boolean(person.profile?.published && person.profile.featured)
            : Boolean(person.profile?.published),
    )
    .filter((person) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const { user, profile } = person;
      return [user?.name, profile?.name, user?.email, profile?.email, user?.phone, profile?.phone, profile?.designation, user?.barEnrolment, profile?.court, profile?.district, profile?.address]
        .some((field) => field?.toLowerCase().includes(q));
    })
    .sort((a, b) =>
      sort === "cases"
        ? (b.user?._count.assignments ?? -1) - (a.user?._count.assignments ?? -1)
        : sort === "last-sign-in"
          ? (b.user?.lastLoginAt ?? "").localeCompare(a.user?.lastLoginAt ?? "")
          : sort === "newest"
            ? (b.user?.createdAt ?? "").localeCompare(a.user?.createdAt ?? "")
            : nameOf(a).localeCompare(nameOf(b)),
    );

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Team (Lawyers)"
        title="The firm's team"
        description="Everyone at the firm. Add a person here with their photo, position and contact details, tick what they can open in the portal (Admin, Lawyer or both), and whether the website shows them. Lawyers see only the cases they are assigned to; admins see everything."
        actions={<Button onClick={() => setEditing("new")}>Add a person</Button>}
      />

      {users && <SignInAccess users={users} />}

      <Card>
        <ListToolbar
          search={{ value: query, onChange: setQuery, placeholder: "Search name, email, phone, position, court or place" }}
          filters={[
            { key: "kind", label: "Lawyers", value: kind, options: KIND_FILTER, onChange: setKind },
            { key: "state", label: "State", value: state, options: stateOptions, onChange: (value) => { setState(value); setDistrict(""); } },
            { key: "district", label: "District", value: district, options: districtOptions, onChange: setDistrict },
            { key: "access", label: "Access", value: access, options: ACCESS_FILTER, onChange: setAccess },
            { key: "account", label: "Account", value: account, options: ACCOUNT_FILTER, onChange: setAccount },
            { key: "website", label: "Website", value: website, options: WEBSITE_FILTER, onChange: setWebsite },
          ]}
          sort={{ value: sort, options: TEAM_SORT, onChange: setSort }}
          count={people ? `${shown.length} of ${people.length} ${people.length === 1 ? "person" : "people"}` : undefined}
          onReset={() => {
            setQuery("");
            setAccess("");
            setAccount("");
            setWebsite("");
            setKind("");
            setState("");
            setDistrict("");
          }}
        />
        <ErrorNote>{error}</ErrorNote>
        {!people ? (
          <Spinner />
        ) : people.length === 0 ? (
          <EmptyState title="No one yet" />
        ) : shown.length === 0 ? (
          <EmptyState title="No one matches">Try a shorter search, or clear the filters.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Access</Th>
                <Th>Cases</Th>
                <Th>Website</Th>
                <Th>Sign-in</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {shown.map((person) => {
                const { user, profile } = person;
                return (
                  <tr key={person.key} className={user && !user.isActive ? "opacity-60" : ""}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={user?.name ?? profile?.name ?? "?"} src={portrait(profile) ?? user?.avatarUrl ?? null} size={36} />
                        <div>
                          <p className="font-semibold">
                            {user?.name ?? profile?.name}
                            {user?.id === me.id && <span className="font-normal text-slate"> (you)</span>}
                          </p>
                          {profile?.designation && <p className="text-xs text-slate">{profile.designation}</p>}
                          {profile?.thirdParty && <Badge tone="blue">Third-party lawyer</Badge>}
                          {(profile?.court || profile?.district || profile?.state) && (
                            <p className="text-xs text-ink-soft">{[profile.court, [profile.district, profile.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</p>
                          )}
                          <p className="text-xs text-slate">{[user?.email ?? profile?.email, user?.phone ?? profile?.phone].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <AccessBadges user={user} />
                      </div>
                      {user && !user.isActive && <div className="mt-1"><Badge tone="red">Deactivated</Badge></div>}
                    </Td>
                    <Td className="text-sm">{user ? user._count.assignments : "—"}</Td>
                    <Td className="text-xs">
                      <div className="flex flex-wrap gap-1">
                        {profile?.published ? <Badge tone="green">Shown</Badge> : <Badge>Not shown</Badge>}
                        {profile?.published && profile.featured && <Badge tone="gold">Home page</Badge>}
                      </div>
                    </Td>
                    <Td className="text-xs">
                      {user ? (
                        <>
                          <div className="flex flex-wrap gap-1">
                            {user.googleLinked && <Badge tone="green">Google</Badge>}
                            {user.hasPassword && <Badge>Password</Badge>}
                            {!user.googleLinked && !user.hasPassword && <Badge>Awaiting first sign-in</Badge>}
                          </div>
                          <p className="mt-1 text-slate">{user.lastLoginAt ? `Last ${formatDate(user.lastLoginAt)}` : "Never signed in"}</p>
                        </>
                      ) : (
                        <span className="text-slate">—</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Button tone="secondary" size="sm" onClick={() => setEditing(person)}>Edit</Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add a person" : `Edit ${editing?.user?.name ?? editing?.profile?.name ?? ""}`}
        wide
      >
        {editing !== null && (
          <PersonForm
            person={editing === "new" ? null : editing}
            self={editing !== "new" && editing.user?.id === me.id}
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
