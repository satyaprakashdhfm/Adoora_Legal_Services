"use client";

import { useState } from "react";
import { useUser } from "@/lib/portal/session";
import { DocumentDrive } from "@/components/portal/document-drive";
import { UploadButton } from "@/components/portal/upload-button";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardDocuments() {
  const user = useUser();
  const client = user.kind === "client";
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Documents"
        description={
          client
            ? "A folder for each of your matters, with what you have sent to the firm and what your lawyers have shared with you."
            : "A folder for each case assigned to you, plus the firm's Team shared folder."
        }
        actions={<UploadButton onUploaded={() => setRefresh((n) => n + 1)} />}
      />
      <DocumentDrive key={refresh} basePath="/dashboard" staff={!client} />
    </div>
  );
}
