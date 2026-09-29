"use client";

import { useUser } from "@/lib/portal/session";
import { CaseList } from "@/components/portal/case-list";
import { NewCaseButton } from "@/components/portal/new-case-dialog";
import { NoCaseYet } from "@/components/portal/no-case-yet";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardCases() {
  const user = useUser();
  const client = user.kind === "client";

  return (
    <div className="space-y-6">
      <PageTitle
        title="My cases"
        description={client ? "Every case the firm handles for you." : "Cases you are assigned to."}
        actions={client ? undefined : <NewCaseButton />}
      />
      {/* Clients do not add cases: the firm links them. */}
      <CaseList basePath="/dashboard" staff={!client} emptyAction={client ? <NoCaseYet /> : undefined} />
    </div>
  );
}
