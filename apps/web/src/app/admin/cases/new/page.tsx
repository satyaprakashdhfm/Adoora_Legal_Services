"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/portal/api";
import { CaseForm } from "@/components/portal/case-form";
import { Card, Field, PageTitle, Select } from "@/components/portal/ui";

type Person = { id: string; name: string; email: string; role?: string; isActive: boolean };

export default function AdminNewCase() {
  const router = useRouter();
  const [lawyers, setLawyers] = useState<Person[]>([]);
  const [clients, setClients] = useState<Person[]>([]);
  const [lead, setLead] = useState("");
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    api<{ data: Person[] }>("/admin/users").then((r) => setLawyers(r.data.filter((u) => u.isActive && u.role !== "EDITOR"))).catch(() => undefined);
    api<{ data: Person[] }>("/admin/clients?limit=200").then((r) => setClients(r.data.filter((c) => c.isActive))).catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTitle eyebrow="Cases" title="New case" description="The firm's reference (ALS-year-code) is generated when the case is saved." />
      <Card className="p-5 sm:p-7">
        <CaseForm
          mode="staff"
          submitLabel="Create case"
          before={
            <fieldset className="border-t border-line pt-6">
              <legend className="font-serif text-base font-semibold text-ink">Team and client</legend>
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                <Field label="Lead lawyer" hint="More lawyers can be added from the case page.">
                  <Select value={lead} onChange={(e) => setLead(e.target.value)} placeholder="Assign later" options={lawyers.map((u) => ({ value: u.id, label: `${u.name} (${u.role?.toLowerCase()})` }))} />
                </Field>
                <Field label="Client account" hint="The client sees the case on their dashboard once linked.">
                  <Select value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Link later" options={clients.map((c) => ({ value: c.id, label: `${c.name} — ${c.email}` }))} />
                </Field>
              </div>
            </fieldset>
          }
          onSubmit={async (payload) => {
            const created = await api<{ reference: string }>("/cases", {
              method: "POST",
              body: {
                ...payload,
                assignments: lead ? [{ userId: lead, role: "LEAD" }] : [],
                clientIds: clientId ? [clientId] : [],
              },
            });
            router.push(`/admin/cases/${created.reference}`);
          }}
        />
      </Card>
    </div>
  );
}
