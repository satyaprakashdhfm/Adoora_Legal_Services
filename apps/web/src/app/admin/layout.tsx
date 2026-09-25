import type { Metadata } from "next";
import { AdminShell } from "@/components/portal/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin console", template: "%s | Admin console" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
