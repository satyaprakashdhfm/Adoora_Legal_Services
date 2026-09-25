"use client";

import { CaseList } from "@/components/portal/case-list";
import { NewCaseButton } from "@/components/portal/new-case-dialog";
import { PageTitle } from "@/components/portal/ui";

export default function AdminCases() {
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Cases"
        title="All cases"
        description="Every matter in the firm. Search by the firm's reference, the court's case number, the CNR, a party or a client."
        actions={<NewCaseButton admin />}
      />
      <CaseList basePath="/admin" staff />
    </div>
  );
}
