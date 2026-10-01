"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { usePortalBase, useUser } from "@/lib/portal/session";
import { courtNumber, daysUntil, firstName, formatDate } from "@/lib/portal/format";
import { CaseList } from "@/components/portal/case-list";
import { DocumentList } from "@/components/portal/document-list";
import { UploadButton } from "@/components/portal/upload-button";
import { NoCaseYet } from "@/components/portal/no-case-yet";
import { Card, CardHeader, PageTitle, StatTile } from "@/components/portal/ui";

export default function DashboardOverview() {
  const user = useUser();
  const client = user.kind === "client";
  const base = usePortalBase();
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
        eyebrow={client ? "Client dashboard" : "Lawyer workspace"}
        title={`Welcome, ${firstName(user.name)}`}
        description={
          client
            ? "Follow your cases, upload documents for your lawyers, and see every hearing and order as the firm records it. Questions go to the firm under Queries."
            : "The cases assigned to you: update them from the court, keep their documents, and answer your clients' queries."
        }
        actions={
          <>
            {(!client || (cases?.length ?? 0) > 0) && <UploadButton onUploaded={() => setRefresh((n) => n + 1)} />}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label={"Open cases"} value={cases ? open.length : "…"} href={`${base}/cases`} />
        <StatTile label="Documents" value={cases ? documents : "…"} href={`${base}/documents`} />
        <StatTile
          label="Next hearing"
          value={upcoming[0] ? formatDate(upcoming[0].nextHearingDate) : "—"}
          hint={upcoming[0] ? upcoming[0].title : "Nothing listed"}
          href={upcoming[0] ? `${base}/cases/${upcoming[0].reference}` : undefined}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader title="Upcoming hearings" />
          <ul className="divide-y divide-line">
            {upcoming.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`${base}/cases/${c.reference}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-paper-warm">
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
        <h2 className="mb-3 font-serif text-xl font-semibold text-ink">Your cases</h2>
        <CaseList
          key={refresh}
          basePath={base}
          staff={!client}
          emptyAction={client ? <NoCaseYet /> : undefined}
        />
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Recent documents</h2>
          <Link href={`${base}/documents`} className="text-sm font-semibold text-gold-deep hover:underline">All documents →</Link>
        </div>
        <DocumentList basePath={base} staff={!client} compact limit={5} refreshKey={refresh} />
      </div>

    </div>
  );
}
