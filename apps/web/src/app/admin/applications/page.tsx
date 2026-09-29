import { redirect } from "next/navigation";

/** Applications live under Jobs now, as its second tab. */
export default function AdminApplications() {
  redirect("/admin/jobs?tab=applications");
}
