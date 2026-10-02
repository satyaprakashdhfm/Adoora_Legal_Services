"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { courtNumber, formatDate } from "@/lib/portal/format";
import { NewCaseButton } from "@/components/portal/new-case-dialog";
import { UrgentBanner, usePipeline } from "@/components/portal/trending";
import { Button, ButtonLink, Card, CardHeader, EmptyState, ErrorNote, PageTitle, Spinner, StatTile } from "@/components/portal/ui";

type Stats = {
  enquiries: { new: number; total: number };
  applications: { new: number };
  subscribers: { confirmed: number };
  cases: Record<string, number>;
  casesUnassigned: number;
  queries: { open: number };
  clients: number;
  lawyers: number;
  upcomingHearings: {
    reference: string;
    title: string;
    courtName: string | null;
    caseTypeCode: string | null;
    caseNumber: string | null;
    caseYear: number | null;
    nextHearingDate: string;
    nextHearingPurpose: string | null;
  }[];
};

export default function AdminOverview() {
  const user = useUser();
  const pipeline = usePipeline();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>("/admin/stats").then(setStats).catch((cause: Error) => setError(cause.message));
  }, []);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!stats) return <Spinner />;

  const open = (stats.cases.ACTIVE ?? 0) + (stats.cases.ON_HOLD ?? 0);

  return (
    <div className="space-y-8">
      <UrgentBanner count={pipeline?.urgent ?? 0} onOpen={() => router.push("/admin/articles")} />
      <PageTitle
        eyebrow="Overview"
        title="The firm at a glance"
        actions={
          <>
            <NewCaseButton admin />
            <ButtonLink href="/admin/clients" tone="secondary">Add client</ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Open cases" value={open} hint={`${stats.cases.DISPOSED ?? 0} disposed · ${stats.cases.CLOSED ?? 0} closed`} href="/admin/cases" />
        <StatTile label="Intake to review" value={stats.cases.INTAKE ?? 0} hint="Opened by clients or awaiting take-on" href="/admin/cases" />
        <StatTile label="Unassigned" value={stats.casesUnassigned} hint="Open cases with no lawyer" href="/admin/cases" />
        <StatTile label="Client queries" value={stats.queries.open} hint="Raised from the client dashboard, not yet answered" href="/admin/queries" />
        <StatTile label="Clients" value={stats.clients} hint="Active client accounts" href="/admin/clients" />
        <StatTile label="Lawyers" value={stats.lawyers} hint="Active lawyer accounts" href="/admin/staff" />
        <StatTile label="Website enquiries" value={stats.enquiries.new} hint={`New · ${stats.enquiries.total} in total`} href="/admin/enquiries" />
        <StatTile label="Career applications" value={stats.applications.new} hint="New, not yet reviewed" href="/admin/jobs?tab=applications" />
      </div>

      <Card>
        <CardHeader title="Hearings in the next 14 days" />
        {stats.upcomingHearings.length === 0 ? (
          <EmptyState title="Nothing listed in the next fortnight" />
        ) : (
          <ul className="divide-y divide-line">
            {stats.upcomingHearings.map((hearing) => (
              <li key={hearing.reference}>
                <Link href={`/admin/cases/${hearing.reference}`} className="grid gap-2 px-5 py-3 hover:bg-paper-warm sm:grid-cols-[8rem_1fr]">
                  <p className="text-sm font-semibold text-gold-deep">{formatDate(hearing.nextHearingDate)}</p>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{hearing.title}</p>
                    <p className="truncate text-xs text-slate">
                      {[hearing.reference, courtNumber(hearing), hearing.courtName, hearing.nextHearingPurpose].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {user.role === "OWNER" && <SampleDataCard />}
    </div>
  );
}

type SampleStatus = { cases: number; clients: number; staff: number; jobs: number; applications: number; enquiries: number; present: boolean };

/**
 * Owners only: one fictional sample case (title starting "[Demo]") with a
 * job, an application and an enquiry, for showing the system; a button to
 * share it with everyone; and one to take it all out before real work starts.
 */
function SampleDataCard() {
  const [status, setStatus] = useState<SampleStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api<SampleStatus>("/admin/sample-data")
      .then(setStatus)
      .catch((cause: Error) => setError(cause.message));
  useEffect(() => {
    void load();
  }, []);

  async function run(method: "POST" | "DELETE" | "SHARE") {
    if (method === "DELETE" && !window.confirm("Remove all sample data? Only records marked (Demo) / [Demo] are deleted; real records are not touched.")) return;
    setBusy(true);
    setError(null);
    try {
      if (method === "SHARE") {
        const shared = await api<{ staff: number; clients: number; linked: number }>("/admin/sample-data/share", { method: "POST" });
        setMessage(
          shared.linked
            ? `Shared: the sample case is now with all ${shared.staff} firm members and ${shared.clients} clients.`
            : "Everyone already has the sample case.",
        );
        return;
      }
      const result = await api<{ message?: string }>("/admin/sample-data", { method });
      setMessage(method === "DELETE" ? "Sample data removed." : (result.message ?? "Sample data added."));
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Sample data"
        description="One fictional case, “[Demo] Sri Lakshmi Traders”, with files from the court, the client and the firm, shared with every firm member and client so everyone can try the portals. Remove it before real work starts."
      />
      <div className="space-y-3 px-5 py-4 text-sm">
        {status && (
          <p className="text-ink-soft">
            {status.present
              ? `In the system now: ${status.cases} sample case, ${status.clients} sample client, ${status.staff} sample lawyers, ${status.enquiries} enquiry, ${status.jobs} job opening, ${status.applications} application.`
              : "No sample data in the system."}
          </p>
        )}
        {message && <p className="text-emerald-800">{message}</p>}
        <ErrorNote>{error}</ErrorNote>
        <div className="flex flex-wrap gap-2">
          {status && status.cases > 0 && (
            <Button size="sm" disabled={busy} onClick={() => void run("SHARE")}>
              {busy ? "Working…" : "Share with everyone"}
            </Button>
          )}
          {status && status.cases === 0 && (
            <Button size="sm" tone="secondary" disabled={busy} onClick={() => void run("POST")}>
              {busy ? "Working…" : "Add sample data"}
            </Button>
          )}
          {status?.present && (
            <Button size="sm" tone="danger" disabled={busy} onClick={() => void run("DELETE")}>
              {busy ? "Working…" : "Remove all sample data"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
