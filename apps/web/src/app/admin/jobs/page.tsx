"use client";

import { use, useCallback, useEffect, useState } from "react";
import { api, refreshWebsite, type JobOpening, type Page } from "@/lib/portal/api";
import { formatDate, formatDateTime, toDateInput } from "@/lib/portal/format";
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

function OpeningsTab({
  rows,
  error,
  setError,
  load,
  editing,
  setEditing,
  showApplications,
}: {
  rows: JobOpening[] | null;
  error: string | null;
  setError: (message: string | null) => void;
  load: () => void;
  editing: JobOpening | "new" | null;
  setEditing: (value: JobOpening | "new" | null) => void;
  showApplications: () => void;
}) {
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
    <>
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
                      <button type="button" onClick={showApplications} className="font-semibold text-gold-deep hover:underline">{job.applications}</button>
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
    </>
  );
}

type Application = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  experience: string;
  enrolment: string | null;
  message: string;
  status: string;
  internalNote: string | null;
  createdAt: string;
};

const APPLICATION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

function ApplicationsTab({ onChange }: { onChange: () => void }) {
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Application[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [open, setOpen] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Page<Application>>(`/admin/applications?limit=50${status ? `&status=${status}` : ""}`)
      .then((page) => {
        setRows(page.data);
        setCursor(page.nextCursor);
      })
      .catch((cause: Error) => setError(cause.message));
  }, [status]);

  useEffect(load, [load]);

  async function more() {
    if (!cursor) return;
    const page = await api<Page<Application>>(`/admin/applications?limit=50&cursor=${cursor}${status ? `&status=${status}` : ""}`);
    setRows((current) => [...(current ?? []), ...page.data]);
    setCursor(page.nextCursor);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!open) return;
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try {
      await api(`/admin/applications/${open.id}`, { method: "PATCH", body: data });
      setOpen(null);
      load();
      onChange();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <>
      <Card>
        <div className="border-b border-line p-4 sm:max-w-xs">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={APPLICATION_STATUSES} />
        </div>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No career applications" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Received</Th>
                <Th>Candidate</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td className="text-xs">
                    <span className="font-mono text-gold-deep">{row.reference}</span>
                    <br />
                    {formatDateTime(row.createdAt)}
                  </Td>
                  <Td className="text-xs">
                    <p className="text-sm font-semibold">{row.name}</p>
                    {row.email}<br />{row.phone}
                  </Td>
                  <Td className="text-sm">
                    {row.role}
                    <p className="text-xs text-slate">{row.experience}{row.enrolment ? ` · ${row.enrolment}` : ""}</p>
                  </Td>
                  <Td className="text-xs">{APPLICATION_STATUSES.find((s) => s.value === row.status)?.label}</Td>
                  <Td className="text-right">
                    <Button tone="secondary" size="sm" onClick={() => setOpen(row)}>Open</Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {cursor && (
          <div className="border-t border-line p-4 text-center">
            <Button tone="secondary" size="sm" onClick={() => void more()}>Load more</Button>
          </div>
        )}
      </Card>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.reference} — ${open.name}` : ""} wide>
        {open && (
          <form onSubmit={save} className="space-y-4">
            <div className="rounded-lg bg-paper-warm p-4 text-sm">
              <p className="text-xs text-slate">{open.role} · {open.experience} · {open.email} · {open.phone}</p>
              <p className="mt-2 whitespace-pre-line text-ink">{open.message}</p>
            </div>
            <Field label="Status">
              <Select name="status" defaultValue={open.status} options={APPLICATION_STATUSES} />
            </Field>
            <Field label="Internal note">
              <Textarea name="internalNote" defaultValue={open.internalNote ?? ""} rows={4} />
            </Field>
            <Button type="submit">Save</Button>
          </form>
        )}
      </Modal>
    </>
  );
}

type Tab = "openings" | "applications";

/**
 * Jobs, in one place: the roles on the careers page and the applications
 * they bring in. Candidates apply from the careers page and email their CV
 * quoting the reference.
 */
export default function AdminJobs({ searchParams }: PageProps<"/admin/jobs">) {
  // A link from elsewhere (the overview's tile) opens the applications tab.
  const [tab, setTab] = useState<Tab>(use(searchParams).tab === "applications" ? "applications" : "openings");
  const [rows, setRows] = useState<JobOpening[] | null>(null);
  const [newApplications, setNewApplications] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<JobOpening | "new" | null>(null);

  const load = useCallback(() => {
    api<{ data: JobOpening[] }>("/admin/jobs")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
    api<Page<Application>>("/admin/applications?limit=200&status=NEW")
      .then((page) => setNewApplications(page.data.length))
      .catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  const openRoles = rows?.filter((job) => job.status === "OPEN").length ?? 0;
  const received = rows?.reduce((sum, job) => sum + (job.applications ?? 0), 0) ?? 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "openings", label: `Job openings${rows ? ` (${rows.length})` : ""}` },
    { id: "applications", label: `Applications${newApplications ? ` (${newApplications} new)` : ""}` },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Jobs"
        description="Post roles for the careers page and review the applications they bring in."
        actions={
          <Button
            onClick={() => {
              setTab("openings");
              setEditing("new");
            }}
          >
            Post a job
          </Button>
        }
      />

      {rows && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Open roles on the website", value: openRoles },
            { label: "Applications received", value: received },
            { label: "New, not yet reviewed", value: newApplications ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-line bg-white px-4 py-3">
              <p className="font-serif text-2xl font-semibold text-ink">{stat.value}</p>
              <p className="text-xs text-slate">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <nav aria-label="Jobs sections" className="flex gap-1 border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${
              tab === item.id ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "openings" ? (
        <OpeningsTab
          rows={rows}
          error={error}
          setError={setError}
          load={load}
          editing={editing}
          setEditing={setEditing}
          showApplications={() => setTab("applications")}
        />
      ) : (
        <ApplicationsTab onChange={load} />
      )}
    </div>
  );
}
