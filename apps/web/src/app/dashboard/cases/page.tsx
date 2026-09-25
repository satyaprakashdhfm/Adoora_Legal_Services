"use client";

import { useUser } from "@/lib/portal/session";
import { CaseList } from "@/components/portal/case-list";
import { NewCaseButton } from "@/components/portal/new-case-dialog";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardCases() {
  const user = useUser();
  const client = user.kind === "client";

  return (
    <div className="space-y-6">
      <PageTitle
        title={client ? "My matters" : "My cases"}
        description={client ? "Every matter the firm handles for you." : "Cases you are assigned to."}
        actions={<NewCaseButton />}
      />
      <CaseList basePath="/dashboard" staff={!client} />
    </div>
  );
}
