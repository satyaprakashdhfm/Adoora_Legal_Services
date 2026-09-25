"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/portal/api";
import { courtNumber, formatDate } from "@/lib/portal/format";
import { NewCaseButton } from "@/components/portal/new-case-dialog";
import { ButtonLink, Card, CardHeader, EmptyState, ErrorNote, PageTitle, Spinner, StatTile } from "@/components/portal/ui";

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Open cases" value={open} hint={`${stats.cases.DISPOSED ?? 0} disposed · ${stats.cases.CLOSED ?? 0} closed`} href="/admin/cases" />
        <StatTile label="Intake to review" value={stats.cases.INTAKE ?? 0} hint="Opened by clients or awaiting take-on" href="/admin/cases" />
        <StatTile label="Unassigned" value={stats.casesUnassigned} hint="Open cases with no lawyer" href="/admin/cases" />
        <StatTile label="Client queries" value={stats.queries.open} hint="Raised from the client dashboard, not yet answered" href="/admin/queries" />
        <StatTile label="Clients" value={stats.clients} hint="Active client accounts" href="/admin/clients" />
        <StatTile label="Lawyers" value={stats.lawyers} hint="Active lawyer accounts" href="/admin/staff" />
        <StatTile label="Website enquiries" value={stats.enquiries.new} hint={`New · ${stats.enquiries.total} in total`} href="/admin/enquiries" />
        <StatTile label="Career applications" value={stats.applications.new} hint="New, not yet reviewed" href="/admin/applications" />
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
    </div>
  );
}
