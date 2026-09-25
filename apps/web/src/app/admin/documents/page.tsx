"use client";

import { DocumentList } from "@/components/portal/document-list";
import { PageTitle } from "@/components/portal/ui";

export default function AdminDocuments() {
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Documents"
        title="All documents"
        description="Every document on every case, internal ones included. References run per case: ALS-2026-K7Q3X9-D004 is the fourth document on that case."
      />
      <DocumentList basePath="/admin" staff />
    </div>
  );
}
