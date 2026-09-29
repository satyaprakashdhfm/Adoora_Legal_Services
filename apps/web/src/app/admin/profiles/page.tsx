"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, refreshWebsite, type LawyerProfile } from "@/lib/portal/api";
import { people as websiteRoster } from "@/content/people";
import { practiceAreas } from "@/content/practice-areas";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, PageTitle, Spinner, Table, Td, Th } from "@/components/portal/ui";

/**
 * What the website shows, read-only. People are added and edited in one
 * place — Team (Lawyers) — so their account, photo and website profile
 * never drift apart.
 */

/** Uploaded portrait, or one bundled with the website (all shipped as .jpg). */
const portrait = (p: LawyerProfile) => p.photoUrl ?? (p.photo ? `/${p.photo}.jpg` : null);

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

export default function AdminProfiles() {
  const [rows, setRows] = useState<LawyerProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(() => {
    api<{ data: LawyerProfile[] }>("/admin/profiles").then((r) => setRows(r.data)).catch((cause: Error) => setError(cause.message));
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

  const shown = rows?.filter((profile) => profile.published) ?? null;
  const hidden = rows ? rows.length - (shown?.length ?? 0) : 0;
  const practiceName = (slug: string) => practiceAreas.find((area) => area.slug === slug)?.shortName ?? slug;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Lawyer profiles"
        description="The people the website shows now, in the order it shows them — the home page slides and the About page roster."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
        <p>
          This page is view-only. To add someone, change a profile, or show or hide a person on the website, go to{" "}
          <span className="font-semibold">Team (Lawyers)</span>.
        </p>
        <Link href="/admin/staff" className="font-semibold text-gold-deep hover:underline">
          Open Team (Lawyers) →
        </Link>
      </div>

      <Card>
        <ErrorNote>{error}</ErrorNote>
        {!rows || !shown ? (
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
            Until profiles are added, the website keeps showing its built-in roster. Import it, then edit people from Team (Lawyers).
          </EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState title="No one is shown on the website">Tick “Show on the website” for a person in Team (Lawyers).</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lawyer</Th>
                <Th>Practices</Th>
                <Th>On the website</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((profile) => (
                <tr key={profile.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={profile.name} src={portrait(profile)} size={40} />
                      <div>
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-xs text-slate">{[profile.designation, profile.qualification, profile.office].filter(Boolean).join(" · ")}</p>
                        {profile.email && <p className="text-xs text-slate">{profile.email}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs text-ink-soft">{profile.practices.map(practiceName).join(", ") || "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {profile.featured && <Badge tone="gold">Home page</Badge>}
                      {profile.bio.length > 0 ? <Badge tone="blue">Full profile</Badge> : <Badge>Roster only</Badge>}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {hidden > 0 && (
          <p className="border-t border-line px-5 py-3 text-xs text-slate">
            {hidden} more {hidden === 1 ? "person is" : "people are"} on the team but not shown on the website.
          </p>
        )}
      </Card>
    </div>
  );
}
