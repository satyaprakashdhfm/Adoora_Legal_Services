import type { Metadata } from "next";
import { LoginPanel } from "@/components/portal/login-panel";

export const metadata: Metadata = {
  title: "Lawyer sign in",
  robots: { index: false, follow: false },
};

/** Lawyers' sign-in. The console is at /admin/login and clients sign in at /login. */
export default async function LawyerLoginPage({ searchParams }: PageProps<"/lawyer/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" && params.next.startsWith("/lawyer") ? params.next : "";

  return (
    <div className="bg-paper-warm">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <LoginPanel error={error} next={next} audience="lawyer" />
      </div>
    </div>
  );
}
