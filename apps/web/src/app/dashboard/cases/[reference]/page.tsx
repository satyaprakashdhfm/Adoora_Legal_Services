"use client";

import { useParams } from "next/navigation";
import { usePortalBase, useUser } from "@/lib/portal/session";
import { CaseWorkspace } from "@/components/portal/case-workspace";

export default function DashboardCase() {
  const user = useUser();
  const base = usePortalBase();
  const { reference } = useParams<{ reference: string }>();
  return <CaseWorkspace key={reference} reference={decodeURIComponent(reference)} user={user} basePath={base} />;
}
