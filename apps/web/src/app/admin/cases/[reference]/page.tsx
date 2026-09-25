"use client";

import { useParams } from "next/navigation";
import { useUser } from "@/lib/portal/session";
import { CaseWorkspace } from "@/components/portal/case-workspace";

export default function AdminCase() {
  const user = useUser();
  const { reference } = useParams<{ reference: string }>();
  return <CaseWorkspace key={reference} reference={decodeURIComponent(reference)} user={user} basePath="/admin" />;
}
