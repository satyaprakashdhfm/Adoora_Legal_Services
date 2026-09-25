"use client";

import { useState } from "react";
import { useUser } from "@/lib/portal/session";
import { QueryList, RaiseQueryButton } from "@/components/portal/query-list";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardQueries() {
  const user = useUser();
  const client = user.kind === "client";
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="space-y-6">
      <PageTitle
        title={client ? "My queries" : "Client queries"}
        description={
          client
            ? "Ask your lawyers a question about your cases. Their reply appears here."
            : "Questions clients have raised about the cases assigned to you."
        }
        actions={client ? <RaiseQueryButton onRaised={() => setRefresh((n) => n + 1)} /> : undefined}
      />
      <QueryList staff={!client} basePath="/dashboard" refreshKey={refresh} />
    </div>
  );
}
