import type { Metadata } from "next";
import { LoginPanel } from "@/components/portal/login-panel";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" ? params.next : "";

  return (
    <div className="bg-paper-warm">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <LoginPanel error={error} next={next} />
      </div>
    </div>
  );
}
