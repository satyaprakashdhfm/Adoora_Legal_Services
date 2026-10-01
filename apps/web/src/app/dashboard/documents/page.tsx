"use client";

import { useState } from "react";
import { usePortalBase, useUser } from "@/lib/portal/session";
import { DocumentDrive } from "@/components/portal/document-drive";
import { UploadButton } from "@/components/portal/upload-button";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardDocuments() {
  const user = useUser();
  const client = user.kind === "client";
  const base = usePortalBase();
  const [refresh, setRefresh] = useState(0);
  const [openCase, setOpenCase] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Documents"
        description={
          client
            ? "A folder for each of your cases, with what you have sent to the firm and what your lawyers have shared with you."
            : "A folder for each case assigned to you, plus the firm's Team shared folder."
        }
        actions={<UploadButton caseReference={openCase} onUploaded={() => setRefresh((n) => n + 1)} />}
      />
      <DocumentDrive key={refresh} basePath={base} staff={!client} onCaseChange={setOpenCase} />
    </div>
  );
}
