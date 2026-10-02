"use client";

import { useState } from "react";
import { DocumentDrive } from "@/components/portal/document-drive";
import { UploadButton, type Place } from "@/components/portal/upload-button";
import { PageTitle } from "@/components/portal/ui";

/**
 * Documents as folders: a folder per case, each with Internal, Client
 * and From court inside, plus the firm-wide Internal folder. The same files
 * the client and lawyer dashboards show: an upload here appears there, and
 * theirs appear here. Uploading is only done here and in a case's Documents
 * tab, and always asks which folder.
 */
export default function AdminDocuments() {
  const [refresh, setRefresh] = useState(0);
  const [place, setPlace] = useState<Place | null>(null);
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Documents"
        title="Documents"
        description="Every case has three folders: Internal (the firm only), Client and From court. Internal at the top is for the whole firm. Upload document asks which case and which folders."
        actions={<UploadButton place={place} onUploaded={() => setRefresh((n) => n + 1)} />}
      />
      <DocumentDrive key={refresh} basePath="/admin" staff onPlaceChange={setPlace} />
    </div>
  );
}
