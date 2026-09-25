"use client";

import { useState } from "react";
import { useUser } from "@/lib/portal/session";
import { DocumentList } from "@/components/portal/document-list";
import { UploadButton } from "@/components/portal/upload-button";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardDocuments() {
  const user = useUser();
  const [refresh, setRefresh] = useState(0);
  const upload = <UploadButton onUploaded={() => setRefresh((n) => n + 1)} />;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Documents"
        description={
          user.kind === "client"
            ? "Everything on your matters — what you have uploaded and what the firm has shared with you."
            : "Documents across the cases assigned to you."
        }
        actions={upload}
      />
      <DocumentList basePath="/dashboard" staff={user.kind === "staff"} refreshKey={refresh} emptyAction={upload} />
    </div>
  );
}
