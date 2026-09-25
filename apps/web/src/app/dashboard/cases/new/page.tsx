"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { CaseForm } from "@/components/portal/case-form";
import { Card, PageTitle } from "@/components/portal/ui";

export default function NewMatter() {
  const user = useUser();
  const router = useRouter();
  const client = user.kind === "client";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTitle
        eyebrow={client ? "New matter" : "New case"}
        title={client ? "Tell us about your matter" : "Open a case"}
        description={
          client
            ? "Fill in what you know — the firm will complete the court details. Once it is open you can upload documents to it."
            : "You will be recorded as lead counsel. An administrator links the client's account."
        }
      />
      <Card className="p-5 sm:p-7">
        <CaseForm
          mode={client ? "client" : "staff"}
          submitLabel={client ? "Open matter" : "Open case"}
          onSubmit={async (payload) => {
            const created = await api<{ reference: string }>("/cases", { method: "POST", body: payload });
            router.push(`/dashboard/cases/${created.reference}`);
          }}
        />
      </Card>
    </div>
  );
}
