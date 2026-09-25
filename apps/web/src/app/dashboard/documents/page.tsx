"use client";

import { useUser } from "@/lib/portal/session";
import { DocumentList } from "@/components/portal/document-list";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardDocuments() {
  const user = useUser();
  return (
    <div className="space-y-6">
      <PageTitle
        title="Documents"
        description={
          user.kind === "client"
            ? "Everything shared on your matters. To upload, open the matter and use its Documents tab."
            : "Documents across the cases assigned to you."
        }
      />
      <DocumentList basePath="/dashboard" staff={user.kind === "staff"} />
    </div>
  );
}
