"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, refreshWebsite, type JobOpening } from "@/lib/portal/api";
import { formatDate, toDateInput } from "@/lib/portal/format";
import { practiceAreas } from "@/content/practice-areas";
import { Badge, Button, Card, EmptyState, ErrorNote, Field, Input, Modal, PageTitle, Select, Spinner, Table, Td, Textarea, Th } from "@/components/portal/ui";

const STATUSES = [
  { value: "DRAFT", label: "Draft — not on the website" },
  { value: "OPEN", label: "Open — listed on the careers page" },
  { value: "CLOSED", label: "Closed — taken down" },
];

const TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Articled clerkship"].map((t) => ({ value: t, label: t }));

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

function JobForm({ initial, onSaved }: { initial?: JobOpening; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const body = {
      ...data,
      responsibilities: lines(data.responsibilities ?? ""),
      requirements: lines(data.requirements ?? ""),
      sortOrder: data.sortOrder ? Number(data.sortOrder) : undefined,
    };
    setSaving(true);
    setError(null);
    try {
      if (initial) await api(`/admin/jobs/${initial.id}`, { method: "PATCH", body });
      else await api("/admin/jobs", { method: "POST", body });
      await refreshWebsite(["website-jobs"]);
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Role title" required className="sm:col-span-2" hint="As it should appear on the careers page, e.g. “Associate — Dispute Resolution”.">
        <Input name="title" required minLength={3} maxLength={160} defaultValue={initial?.title} />
      </Field>
      <Field label="Employment type">
        <Select name="employmentType" defaultValue={initial?.employmentType ?? "Full-time"} options={TYPES} />
      </Field>
      <Field label="Practice area">
        <Select name="practiceArea" defaultValue={initial?.practiceArea ?? ""} placeholder="Firm-wide / not specific" options={practiceAreas.map((a) => ({ value: a.slug, label: a.name }))} />
      </Field>
      <Field label="Location">
        <Input name="location" maxLength={160} placeholder="e.g. Hyderabad" defaultValue={initial?.location ?? ""} />
      </Field>
      <Field label="Experience">
        <Input name="experience" maxLength={160} placeholder="e.g. 2–4 years' post-qualification" defaultValue={initial?.experience ?? ""} />
      </Field>
      <Field label="About the role" required className="sm:col-span-2" hint="A few sentences on the work and the team. Shown on the listing.">
        <Textarea name="summary" required minLength={20} maxLength={4000} rows={4} defaultValue={initial?.summary} />
      </Field>
      <Field label="Responsibilities" hint="One per line.">
        <Textarea name="responsibilities" rows={5} defaultValue={initial?.responsibilities.join("\n")} />
      </Field>
      <Field label="Requirements" hint="One per line, e.g. “Enrolled with a State Bar Council”.">
        <Textarea name="requirements" rows={5} defaultValue={initial?.requirements.join("\n")} />
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue={initial?.status ?? "OPEN"} options={STATUSES} />
      </Field>
      <Field label="Applications close" hint="Optional. The role comes off the website after this date.">
        <Input name="closesOn" type="date" defaultValue={toDateInput(initial?.closesOn)} />
      </Field>
      <Field label="Display order" hint="Lower numbers are listed first.">
        <Input name="sortOrder" type="number" min={0} max={9999} defaultValue={initial?.sortOrder ?? 0} />
      </Field>
      <div className="space-y-3 sm:col-span-2">
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save changes" : "Post job"}</Button>
      </div>
    </form>
  );
}

export default function AdminJobs() {
  const [rows, setRows] = useState<JobOpening[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<JobOpening | "new" | null>(null);

  const load = useCallback(() => {
    api<{ data: JobOpening[] }>("/admin/jobs")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(load, [load]);

  async function remove(job: JobOpening) {
    if (!window.confirm(`Delete “${job.title}”? Closing it keeps it on record instead.`)) return;
    try {
      await api(`/admin/jobs/${job.id}`, { method: "DELETE" });
      await refreshWebsite(["website-jobs"]);
      load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Job openings"
        description="Roles posted here appear on the careers page while they are Open. Applications arrive under Career applications."
        actions={<Button onClick={() => setEditing("new")}>Post a job</Button>}
      />

      <Card>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No job openings yet" action={<Button onClick={() => setEditing("new")}>Post a job</Button>}>
            Until a role is posted, the careers page says there are no vacancies and invites speculative applications.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Posted</Th>
                <Th>Applications</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => (
                <tr key={job.id}>
                  <Td>
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-xs text-slate">{[job.employmentType, job.location, job.experience].filter(Boolean).join(" · ")}</p>
                  </Td>
                  <Td>
                    <Badge tone={job.status === "OPEN" ? "green" : job.status === "DRAFT" ? "gold" : "grey"}>
                      {job.status === "OPEN" ? "Open" : job.status === "DRAFT" ? "Draft" : "Closed"}
                    </Badge>
                    {job.closesOn && <p className="mt-1 text-xs text-slate">Closes {formatDate(job.closesOn)}</p>}
                  </Td>
                  <Td className="text-xs">{job.publishedAt ? formatDate(job.publishedAt) : "—"}</Td>
                  <Td className="text-sm">
                    {job.applications ? (
                      <Link href="/admin/applications" className="font-semibold text-gold-deep hover:underline">{job.applications}</Link>
                    ) : (
                      0
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-right">
                    <Button tone="secondary" size="sm" onClick={() => setEditing(job)}>Edit</Button>{" "}
                    <Button tone="ghost" size="sm" onClick={() => void remove(job)}>Delete</Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Post a job" : "Edit job opening"} wide>
        {editing !== null && (
          <JobForm
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
