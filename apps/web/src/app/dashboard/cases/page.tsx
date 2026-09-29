"use client";

import { usePortalBase, useUser } from "@/lib/portal/session";
import { CaseList } from "@/components/portal/case-list";
import { NoCaseYet } from "@/components/portal/no-case-yet";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardCases() {
  const user = useUser();
  const client = user.kind === "client";
  const base = usePortalBase();

  return (
    <div className="space-y-6">
      <PageTitle
        title="My cases"
        description={client ? "Every case the firm handles for you." : "Cases you are assigned to."}
      />
      {/* Cases are opened by the firm's admins, who link clients and assign lawyers. */}
      <CaseList basePath={base} staff={!client} emptyAction={client ? <NoCaseYet /> : undefined} />
    </div>
  );
}
