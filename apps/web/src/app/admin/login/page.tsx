import type { Metadata } from "next";
import { LoginPanel } from "@/components/portal/login-panel";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/** The console's sign-in: admins. Lawyers sign in at /lawyer/login, clients at /login. */
export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" && params.next.startsWith("/admin") ? params.next : "";

  return (
    <div className="bg-paper-warm">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <LoginPanel error={error} next={next} audience="admin" />
      </div>
    </div>
  );
}
