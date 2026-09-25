"use client";

import { useCallback, useEffect, useState } from "react";
import { api, refreshWebsite, type LawyerProfile } from "@/lib/portal/api";
import { people as websiteRoster } from "@/content/people";
import { practiceAreas } from "@/content/practice-areas";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, Field, Input, Modal, PageTitle, Select, Spinner, Table, Td, Textarea, Th } from "@/components/portal/ui";

type Account = { id: string; name: string; email: string; role: string; isActive: boolean; profile: { id: string } | null };

/** Uploaded portrait, or one bundled with the website (all shipped as .jpg). */
const portrait = (p: LawyerProfile) => p.photoUrl ?? (p.photo ? `/${p.photo}.jpg` : null);

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
/** Paragraphs are separated by a blank line. */
const paragraphs = (value: string) => value.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);

/** The roster the website shipped with, in the shape the API takes. */
const HOME_TRIO = ["ganesh-raghavendra", "vidya-sagar", "kondal-rao"];
function rosterForImport() {
  return websiteRoster.map((person, index) => ({
    slug: person.slug,
    name: person.name,
    designation: person.designation,
    group: person.group === "business" ? "BUSINESS" : "LEGAL",
    qualification: person.qualification ?? null,
    office: person.office ?? null,
    enrolment: person.enrolment ?? null,
    stateBar: person.stateBar ?? null,
    enrolledSince: person.enrolledSince ?? null,
    experience: person.experience ?? null,
    practices: person.practices ?? [],
    education: person.education ?? [],
    bio: person.bio ?? [],
    memberships: person.memberships ?? [],
    email: person.email ?? null,
    summary: person.spotlight?.summary ?? null,
    photo: person.photo ?? null,
    featured: HOME_TRIO.includes(person.slug),
    published: true,
    sortOrder: index * 10,
  }));
}

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

function ProfileForm({ initial, accounts, onSaved }: { initial?: LawyerProfile; accounts: Account[]; onSaved: (profile: LawyerProfile) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [practices, setPractices] = useState<string[]>(initial?.practices ?? []);
  const [photo, setPhoto] = useState<File | null>(null);

  const linkable = accounts.filter((a) => a.isActive && a.role !== "EDITOR" && (!a.profile || a.profile.id === initial?.id));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form) as Record<string, string>;
    const body = {
      name: data.name,
      designation: data.designation,
      group: data.group,
      qualification: data.qualification,
      office: data.office,
      enrolment: data.enrolment,
      stateBar: data.stateBar,
      enrolledSince: data.enrolledSince,
      experience: data.experience,
      email: data.email,
      summary: data.summary,
      practices,
      education: lines(data.education ?? ""),
      memberships: lines(data.memberships ?? ""),
      bio: paragraphs(data.bio ?? ""),
      featured: form.get("featured") === "on",
      published: form.get("published") === "on",
      sortOrder: Number(data.sortOrder || 0),
      userId: data.userId,
    };
    setSaving(true);
    setError(null);
    try {
      let saved = initial
        ? await api<LawyerProfile>(`/admin/profiles/${initial.id}`, { method: "PATCH", body })
        : await api<LawyerProfile>("/admin/profiles", { method: "POST", body });
      if (photo) {
        const upload = new FormData();
        upload.set("photo", photo);
        saved = await api<LawyerProfile>(`/admin/profiles/${saved.id}/photo`, { method: "PUT", body: upload });
      }
      await refreshWebsite(["website-people"]);
      onSaved(saved);
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center gap-4 sm:col-span-2">
        <Avatar name={initial?.name ?? "New"} src={photo ? URL.createObjectURL(photo) : initial ? portrait(initial) : null} size={64} />
        <div className="text-sm">
          <label className="font-semibold text-gold-deep hover:underline">
            {initial?.photoUrl || initial?.photo ? "Replace portrait" : "Upload portrait"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-slate">JPEG, PNG or WebP, up to 2 MB. Square or 4:5 portraits crop best.</p>
        </div>
      </div>

      <Field label="Name" required hint="As it should appear, e.g. “Adv. K. L. Ganesh Raghavendra”.">
        <Input name="name" required minLength={2} maxLength={160} defaultValue={initial?.name} />
      </Field>
      <Field label="Designation" required>
        <Input name="designation" required maxLength={160} placeholder="e.g. Senior Associate" defaultValue={initial?.designation} />
      </Field>
      <Field label="Roster">
        <Select name="group" defaultValue={initial?.group ?? "LEGAL"} options={[{ value: "LEGAL", label: "Leadership & advocates" }, { value: "BUSINESS", label: "Business development & corporate relations" }]} />
      </Field>
      <Field label="Sign-in account" hint="Links this profile to the lawyer's account, so clients see the same person on their cases.">
        <Select name="userId" defaultValue={initial?.userId ?? ""} placeholder="Not linked" options={linkable.map((a) => ({ value: a.id, label: `${a.name} — ${a.email}` }))} />
      </Field>
      <Field label="Qualification">
        <Input name="qualification" maxLength={160} placeholder="e.g. B.A. LL.B. (Hons.)" defaultValue={initial?.qualification ?? ""} />
      </Field>
      <Field label="Experience">
        <Input name="experience" maxLength={200} placeholder="e.g. 12 years" defaultValue={initial?.experience ?? ""} />
      </Field>
      <Field label="Office">
        <Input name="office" maxLength={120} placeholder="e.g. Hyderabad" defaultValue={initial?.office ?? ""} />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" defaultValue={initial?.email ?? ""} />
      </Field>
      <Field label="Bar Council enrolment no.">
        <Input name="enrolment" maxLength={80} defaultValue={initial?.enrolment ?? ""} />
      </Field>
      <Field label="State Bar Council">
        <Input name="stateBar" maxLength={120} placeholder="e.g. Bar Council of Telangana" defaultValue={initial?.stateBar ?? ""} />
      </Field>
      <Field label="Enrolled since">
        <Input name="enrolledSince" type="number" min={1950} max={2100} defaultValue={initial?.enrolledSince ?? ""} />
      </Field>
      <Field label="Display order" hint="Lower numbers come first.">
        <Input name="sortOrder" type="number" min={0} max={9999} defaultValue={initial?.sortOrder ?? 0} />
      </Field>

      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Practices</p>
        <p className="mb-2 mt-0.5 text-xs text-slate">They appear on the Team tab of each practice page ticked here.</p>
        <PracticePicker value={practices} onChange={setPractices} />
      </div>

      <Field label="Home page introduction" className="sm:col-span-2" hint="Two or three sentences for the “Our people” slides. Factual — no superlatives (BCI rules).">
        <Textarea name="summary" rows={3} maxLength={1200} defaultValue={initial?.summary ?? ""} />
      </Field>
      <Field label="Biography" className="sm:col-span-2" hint="Separate paragraphs with a blank line. A biography earns a full profile on the About page.">
        <Textarea name="bio" rows={6} defaultValue={initial?.bio.join("\n\n")} />
      </Field>
      <Field label="Education" hint="One per line.">
        <Textarea name="education" rows={3} defaultValue={initial?.education.join("\n")} />
      </Field>
      <Field label="Memberships" hint="One per line.">
        <Textarea name="memberships" rows={3} defaultValue={initial?.memberships.join("\n")} />
      </Field>

      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="accent-[var(--color-gold)]" />
          Show on the website
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured ?? false} className="accent-[var(--color-gold)]" />
          Feature on the home page
        </label>
      </div>

      <div className="space-y-3 sm:col-span-2">
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save profile" : "Add profile"}</Button>
      </div>
    </form>
  );
}

export default function AdminProfiles() {
  const [rows, setRows] = useState<LawyerProfile[] | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LawyerProfile | "new" | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(() => {
    api<{ data: LawyerProfile[] }>("/admin/profiles").then((r) => setRows(r.data)).catch((cause: Error) => setError(cause.message));
    api<{ data: Account[] }>("/admin/users").then((r) => setAccounts(r.data)).catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  async function importRoster() {
    setImporting(true);
    setError(null);
    try {
      await api("/admin/profiles/import", { method: "POST", body: { profiles: rosterForImport() } });
      await refreshWebsite(["website-people"]);
      load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setImporting(false);
    }
  }

  async function remove(profile: LawyerProfile) {
    if (!window.confirm(`Remove ${profile.name} from the website? To hide the profile but keep it, untick “Show on the website” instead.`)) return;
    try {
      await api(`/admin/profiles/${profile.id}`, { method: "DELETE" });
      await refreshWebsite(["website-people"]);
      load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Lawyer profiles"
        description="The people the website shows — the home page slides and the About page roster. Link a profile to a lawyer's sign-in account and clients see the same photo and title on their cases."
        actions={<Button onClick={() => setEditing("new")}>Add a lawyer</Button>}
      />

      <Card>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No profiles yet"
            action={
              <Button onClick={() => void importRoster()} disabled={importing}>
                {importing ? "Importing…" : `Import the ${websiteRoster.length} profiles the website shows now`}
              </Button>
            }
          >
            Until profiles are added here, the website keeps showing its built-in roster. Import it to start editing from there.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lawyer</Th>
                <Th>On the website</Th>
                <Th>Account</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((profile) => (
                <tr key={profile.id} className={profile.published ? "" : "opacity-60"}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={profile.name} src={portrait(profile)} size={36} />
                      <div>
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-xs text-slate">{profile.designation}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {profile.published ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}
                      {profile.featured && <Badge tone="gold">Home page</Badge>}
                      {profile.bio.length > 0 && <Badge tone="blue">Full profile</Badge>}
                    </div>
                  </Td>
                  <Td className="text-xs">{profile.user ? `${profile.user.name} (${profile.user.role.toLowerCase()})` : <span className="text-slate">Not linked</span>}</Td>
                  <Td className="whitespace-nowrap text-right">
                    <Button tone="secondary" size="sm" onClick={() => setEditing(profile)}>Edit</Button>{" "}
                    <Button tone="ghost" size="sm" onClick={() => void remove(profile)}>Remove</Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a lawyer to the website" : "Edit profile"} wide>
        {editing !== null && (
          <ProfileForm
            initial={editing === "new" ? undefined : editing}
            accounts={accounts}
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
