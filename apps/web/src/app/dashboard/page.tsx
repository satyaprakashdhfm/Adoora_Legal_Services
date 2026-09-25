"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { courtNumber, daysUntil, firstName, formatDate } from "@/lib/portal/format";
import { CaseList } from "@/components/portal/case-list";
import { DocumentList } from "@/components/portal/document-list";
import { UploadButton } from "@/components/portal/upload-button";
import { ButtonLink, Card, CardHeader, PageTitle, StatTile } from "@/components/portal/ui";

export default function DashboardOverview() {
  const user = useUser();
  const client = user.kind === "client";
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  /* Bumped after an upload, so the counts and Recent documents refresh. */
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    api<Page<CaseSummary>>("/cases?limit=100")
      .then((page) => setCases(page.data))
      .catch(() => setCases([]));
  }, [refresh]);

  const open = cases?.filter((c) => !["CLOSED", "DISPOSED", "WITHDRAWN"].includes(c.status)) ?? [];
  const documents = cases?.reduce((sum, c) => sum + c._count.documents, 0) ?? 0;
  const upcoming = (cases ?? [])
    .filter((c) => {
      const days = daysUntil(c.nextHearingDate);
      return days !== null && days >= 0;
    })
    .sort((a, b) => a.nextHearingDate!.localeCompare(b.nextHearingDate!));

  return (
    <div className="space-y-8">
      <PageTitle
        eyebrow={client ? "Client dashboard" : "Case dashboard"}
        title={`Welcome, ${firstName(user.name)}`}
        description={
          client
            ? "Follow your matters, upload documents for your lawyers, and see every hearing and order as the firm records it."
            : "The cases assigned to you, with the client's documents and the full timeline."
        }
        actions={
          <>
            <UploadButton onUploaded={() => setRefresh((n) => n + 1)} />
            <ButtonLink href="/dashboard/cases/new" tone="secondary">{client ? "Open a new matter" : "Open a case"}</ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={client ? "Open matters" : "Open cases"} value={cases ? open.length : "…"} href="/dashboard/cases" />
        <StatTile label="Documents" value={cases ? documents : "…"} href="/dashboard/documents" />
        <StatTile
          label="Next hearing"
          value={upcoming[0] ? formatDate(upcoming[0].nextHearingDate) : "—"}
          hint={upcoming[0] ? upcoming[0].title : "Nothing listed"}
          href={upcoming[0] ? `/dashboard/cases/${upcoming[0].reference}` : undefined}
        />
      </div>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader title="Upcoming hearings" />
          <ul className="divide-y divide-line">
            {upcoming.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/dashboard/cases/${c.reference}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-paper-warm">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                    <p className="truncate text-xs text-slate">{[courtNumber(c), c.courtName].filter(Boolean).join(" · ")}</p>
                  </div>
                  <p className="text-sm font-semibold text-gold-deep">
                    {formatDate(c.nextHearingDate)}
                    {c.nextHearingPurpose && <span className="font-normal text-slate"> · {c.nextHearingPurpose}</span>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-serif text-xl font-semibold text-ink">{client ? "Your matters" : "Your cases"}</h2>
        <CaseList
          key={refresh}
          basePath="/dashboard"
          staff={!client}
          emptyAction={<ButtonLink href="/dashboard/cases/new">{client ? "Open a new matter" : "Open a case"}</ButtonLink>}
        />
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Recent documents</h2>
          <Link href="/dashboard/documents" className="text-sm font-semibold text-gold-deep hover:underline">All documents →</Link>
        </div>
        <DocumentList basePath="/dashboard" staff={!client} compact limit={5} refreshKey={refresh} />
      </div>

      {client && (
        <p className="text-xs leading-relaxed text-slate">
          Opening a matter here does not by itself create a lawyer–client relationship. The firm first
          runs a conflicts check and confirms any engagement in writing.
        </p>
      )}
    </div>
  );
}
