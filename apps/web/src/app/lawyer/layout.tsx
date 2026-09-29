import type { Metadata } from "next";
import { DashboardShell } from "@/components/portal/dashboard-shell";

export const metadata: Metadata = {
  title: { default: "Lawyer workspace", template: "%s | Lawyer workspace" },
  robots: { index: false, follow: false },
};

export default function LawyerLayout({ children }: LayoutProps<"/lawyer">) {
  return <DashboardShell area="lawyer">{children}</DashboardShell>;
}
