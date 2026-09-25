"use client";

import { useState } from "react";
import { DocumentDrive } from "@/components/portal/document-drive";
import { UploadButton } from "@/components/portal/upload-button";
import { PageTitle } from "@/components/portal/ui";

/**
 * Documents as folders — a folder per case, each split into what the
 * client sent, what the firm shared, and internal papers, plus the firm's
 * "Team shared" folder. The same files the client and lawyer dashboards
 * show: an upload here appears there, and theirs appear here.
 */
export default function AdminDocuments() {
  const [refresh, setRefresh] = useState(0);
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Documents"
        title="Documents"
        description="Open a case folder to see what the client sent, what the firm has shared with them, and internal papers. Upload into any folder, or to a case from here."
        actions={<UploadButton onUploaded={() => setRefresh((n) => n + 1)} />}
      />
      <DocumentDrive key={refresh} basePath="/admin" staff />
    </div>
  );
}
