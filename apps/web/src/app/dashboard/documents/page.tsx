"use client";

import { useState } from "react";
import { usePortalBase, useUser } from "@/lib/portal/session";
import { DocumentDrive } from "@/components/portal/document-drive";
import { UploadButton, type Place } from "@/components/portal/upload-button";
import { PageTitle } from "@/components/portal/ui";

export default function DashboardDocuments() {
  const user = useUser();
  const client = user.kind === "client";
  const base = usePortalBase();
  const [refresh, setRefresh] = useState(0);
  const [place, setPlace] = useState<Place | null>(null);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Documents"
        description={
          client
            ? "A folder for each of your cases, with From court (orders and filed papers) and Client files (what you send and what your lawyers share with you)."
            : "A folder for each case assigned to you, with Internal, From client and From court inside, plus the firm-wide Internal folder."
        }
        actions={<UploadButton place={place} onUploaded={() => setRefresh((n) => n + 1)} />}
      />
      <DocumentDrive key={refresh} basePath={base} staff={!client} onPlaceChange={setPlace} />
    </div>
  );
}
