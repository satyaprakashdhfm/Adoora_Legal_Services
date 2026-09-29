"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, refreshWebsite, type LawyerProfile, type StaffRole } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { formatDate } from "@/lib/portal/format";
import { practiceAreas } from "@/content/practice-areas";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, Field, Input, Modal, PageTitle, Select, Spinner, Table, Td, Textarea, Th } from "@/components/portal/ui";

/**
 * Everyone at the firm, in one list: people with a sign-in account and people
 * shown on the website only. One form covers both — who they are, what they
 * can open in the portal, and whether (and how) the website shows them.
 * Website → Lawyer profiles is a read-only view of the same records.
 */

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
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

type Access = StaffRole | "NONE";

const ROLES: { value: Access; label: string; description: string }[] = [
  { value: "OWNER", label: "Owner", description: "Everything, including managing owners and admins." },
  { value: "ADMIN", label: "Admin", description: "All cases, documents, clients, lawyers and the console." },
  { value: "LAWYER", label: "Lawyer", description: "Only the cases they are assigned to, from the dashboard." },
  { value: "EDITOR", label: "Editor", description: "Website content only. No case access." },
  { value: "NONE", label: "No sign-in", description: "Shown on the website only; cannot open the portal." },
];

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

function PersonForm({
  person,
  self,
  canManageSenior,
  onSaved,
}: {
  person: Person | null;
  self: boolean;
  canManageSenior: boolean;
  onSaved: () => void;
}) {
  const user = person?.user ?? null;
  const profile = person?.profile ?? null;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [access, setAccess] = useState<Access>(user?.role ?? (profile ? "NONE" : "LAWYER"));
  const [onWebsite, setOnWebsite] = useState(profile?.published ?? false);
  const [practices, setPractices] = useState<string[]>(profile?.practices ?? []);
  const [photo, setPhoto] = useState<File | null>(null);
  // Kept across a failed save, so a retry updates what was already created.
  const created = useRef<{ userId?: string; profileId?: string }>({});

  const seniorLocked = Boolean(user && !canManageSenior && (user.role === "OWNER" || user.role === "ADMIN"));
  const roles = ROLES.filter((role) => (canManageSenior || (role.value !== "OWNER" && role.value !== "ADMIN")) && (role.value !== "NONE" || !user));
  const hasAccount = access !== "NONE";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form) as Record<string, string>;
    setSaving(true);
    setError(null);
    try {
      // 1. The sign-in account.
      let userId = user?.id ?? created.current.userId ?? null;
      if (hasAccount && !seniorLocked) {
        const account = { name: data.name, phone: data.phone, barEnrolment: data.enrolment };
        if (userId) {
          await api(`/admin/users/${userId}`, {
            method: "PATCH",
            body: self ? account : { ...account, role: access, isActive: data.isActive !== "false" },
          });
        } else {
          const result = await api<{ id: string }>("/admin/users", { method: "POST", body: { ...account, email: data.email, role: access } });
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
          sortOrder: Number(data.sortOrder || 0),
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
      <Field
        label="Email"
        required={hasAccount}
        hint={user ? "The sign-in email cannot be changed." : hasAccount ? "They sign in with this address — no password to send." : "Optional."}
      >
        <Input name="email" type="email" required={hasAccount} disabled={Boolean(user)} defaultValue={user?.email ?? profile?.email ?? ""} />
      </Field>
      <Field label="Phone">
        <Input name="phone" type="tel" maxLength={32} defaultValue={user?.phone ?? profile?.phone ?? ""} />
      </Field>
      <Field label="Bar Council enrolment no.">
        <Input name="enrolment" maxLength={80} placeholder="e.g. TS/1234/2015" defaultValue={user?.barEnrolment ?? profile?.enrolment ?? ""} />
      </Field>
      {seniorLocked ? (
        <p className="self-end text-xs text-slate">Only an owner can change an owner’s or admin’s access.</p>
      ) : (
        <Field label="Access to the portal" hint={self ? "You cannot change your own access." : ROLES.find((r) => r.value === access)?.description}>
          <Select value={access} onChange={(e) => setAccess(e.target.value as Access)} disabled={self} options={roles} />
        </Field>
      )}
      {user && !self && !seniorLocked && (
        <Field label="Account" hint="Deactivating signs them out everywhere at once. Their case history is kept.">
          <Select name="isActive" defaultValue={String(user.isActive)} options={[{ value: "true", label: "Active" }, { value: "false", label: "Deactivated" }]} />
        </Field>
      )}

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
            <Input name="sortOrder" type="number" min={0} max={9999} defaultValue={profile?.sortOrder ?? 0} />
          </Field>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Practices</p>
            <p className="mb-2 mt-0.5 text-xs text-slate">They appear on the Team tab of each practice page ticked here.</p>
            <PracticePicker value={practices} onChange={setPractices} />
          </div>
          <Field label="Home page introduction" className="sm:col-span-2" hint="Two or three sentences for the “Our people” slides.">
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
  const canManageSenior = me.role === "OWNER";

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

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Team (Lawyers)"
        title="The firm's team"
        description="Everyone at the firm. Add a person here with their photo, position and contact details, choose what they can open in the portal, and whether the website shows them. Lawyers see only the cases they are assigned to; admins and owners see everything."
        actions={<Button onClick={() => setEditing("new")}>Add a person</Button>}
      />

      <Card>
        <ErrorNote>{error}</ErrorNote>
        {!people ? (
          <Spinner />
        ) : people.length === 0 ? (
          <EmptyState title="No one yet" />
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
              {people.map((person) => {
                const { user, profile } = person;
                const role = ROLES.find((r) => r.value === (user?.role ?? "NONE"));
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
                          <p className="text-xs text-slate">{[user?.email ?? profile?.email, user?.phone ?? profile?.phone].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={user?.role === "OWNER" ? "ink" : user?.role === "ADMIN" ? "gold" : user?.role === "LAWYER" ? "blue" : "grey"}>{role?.label}</Badge>
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
            canManageSenior={canManageSenior}
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
