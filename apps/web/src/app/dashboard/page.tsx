"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CaseSummary, type Page } from "@/lib/portal/api";
import { usePortalBase, useUser } from "@/lib/portal/session";
import { firstName, upcomingHearings } from "@/lib/portal/format";
import { CaseList } from "@/components/portal/case-list";
import { DocumentList } from "@/components/portal/document-list";
import { UpcomingHearingsPanel } from "@/components/portal/next-hearing";
import { NoCaseYet } from "@/components/portal/no-case-yet";
import { PageTitle, StatTile } from "@/components/portal/ui";

export default function DashboardOverview() {
  const user = useUser();
  const client = user.kind === "client";
  const base = usePortalBase();
  const [cases, setCases] = useState<CaseSummary[] | null>(null);

  useEffect(() => {
    api<Page<CaseSummary>>("/cases?limit=100")
      .then((page) => setCases(page.data))
      .catch(() => setCases([]));
  }, []);

  const open = cases?.filter((c) => !["CLOSED", "DISPOSED", "WITHDRAWN"].includes(c.status)) ?? [];
  const documents = cases?.reduce((sum, c) => sum + c._count.documents, 0) ?? 0;
  const upcoming = upcomingHearings(cases ?? []);

  return (
    <div className="space-y-8">
      {/* The next hearings sit top right beside the welcome; on phones they
          come straight after it, ahead of everything else. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-8">
        <PageTitle
          eyebrow={client ? "Client dashboard" : "Lawyer workspace"}
          title={`Welcome, ${firstName(user.name)}`}
          description={
            client
              ? "Follow your cases and see every hearing and order as the firm records it. Send papers to your lawyers under Documents, and questions under Queries."
              : "The cases assigned to you: update them from the court, keep their documents, and answer your clients' queries."
          }
        />
        {cases && <UpcomingHearingsPanel hearings={upcoming} basePath={base} />}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatTile label={"Open cases"} value={cases ? open.length : "…"} href={`${base}/cases`} />
        <StatTile label="Documents" value={cases ? documents : "…"} href={`${base}/documents`} />
      </div>

      <div>
        <h2 className="mb-3 font-serif text-xl font-semibold text-ink">Your cases</h2>
        <CaseList
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
        <DocumentList basePath={base} staff={!client} compact limit={5} />
      </div>

    </div>
  );
}
