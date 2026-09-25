"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type StaffRole } from "@/lib/portal/api";
import { useUser } from "@/lib/portal/session";
import { formatDate } from "@/lib/portal/format";
import { Avatar, Badge, Button, Card, ErrorNote, Field, Input, Modal, PageTitle, Select, Spinner, Table, Td, Th } from "@/components/portal/ui";

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
  phone: string | null;
  barEnrolment: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  hasPassword: boolean;
  googleLinked: boolean;
  _count: { assignments: number };
};

const ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: "OWNER", label: "Owner", description: "Everything, including managing owners and admins." },
  { value: "ADMIN", label: "Admin", description: "All cases, documents, clients, lawyers and the console." },
  { value: "LAWYER", label: "Lawyer", description: "Only the cases they are assigned to, from the dashboard." },
  { value: "EDITOR", label: "Editor", description: "Website content only. No case access." },
];

function StaffForm({ initial, canManageSenior, onSaved }: { initial?: StaffRow; canManageSenior: boolean; onSaved: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const roles = ROLES.filter((role) => canManageSenior || (role.value !== "OWNER" && role.value !== "ADMIN"));
  const locked = Boolean(initial && !canManageSenior && (initial.role === "OWNER" || initial.role === "ADMIN"));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await api(`/admin/users/${initial.id}`, {
          method: "PATCH",
          body: { name: data.name, role: data.role, phone: data.phone, barEnrolment: data.barEnrolment, isActive: data.isActive === "true" },
        });
      } else {
        await api("/admin/users", { method: "POST", body: data });
      }
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
      setSaving(false);
    }
  }

  if (locked) {
    return <p className="text-sm text-slate">Only an owner can change owner and admin accounts.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Google email" required className="sm:col-span-2" hint={initial ? undefined : "They sign in with “Continue with Google” using this address — no password to send."}>
        <Input name="email" type="email" required defaultValue={initial?.email} disabled={Boolean(initial)} />
      </Field>
      <Field label="Name" required>
        <Input name="name" required minLength={2} defaultValue={initial?.name} />
      </Field>
      <Field label="Role" hint={ROLES.find((r) => r.value === (initial?.role ?? "LAWYER"))?.description}>
        <Select name="role" defaultValue={initial?.role ?? "LAWYER"} options={roles} />
      </Field>
      <Field label="Bar Council enrolment no.">
        <Input name="barEnrolment" defaultValue={initial?.barEnrolment ?? ""} placeholder="e.g. TS/1234/2015" />
      </Field>
      <Field label="Phone">
        <Input name="phone" type="tel" defaultValue={initial?.phone ?? ""} />
      </Field>
      {initial && (
        <Field label="Account" className="sm:col-span-2" hint="Deactivating signs them out everywhere at once. Their case history is kept.">
          <Select name="isActive" defaultValue={String(initial.isActive)} options={[{ value: "true", label: "Active" }, { value: "false", label: "Deactivated" }]} />
        </Field>
      )}
      <div className="space-y-3 sm:col-span-2">
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initial ? "Save" : "Add to the firm"}</Button>
      </div>
    </form>
  );
}

export default function AdminStaff() {
  const user = useUser();
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffRow | "new" | null>(null);
  const canManageSenior = user.role === "OWNER";

  const load = useCallback(() => {
    api<{ data: StaffRow[] }>("/admin/users")
      .then((result) => setRows(result.data))
      .catch((cause: Error) => setError(cause.message));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Lawyers & staff"
        title="The firm's accounts"
        description="Lawyers see only the cases they are assigned to. Admins and owners see everything."
        actions={<Button onClick={() => setEditing("new")}>Add lawyer or staff</Button>}
      />

      <Card>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Cases</Th>
                <Th>Sign-in</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.isActive ? "" : "opacity-60"}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} src={row.avatarUrl} size={32} />
                      <div>
                        <p className="font-semibold">{row.name}{row.id === user.id && <span className="font-normal text-slate"> (you)</span>}</p>
                        <p className="text-xs text-slate">{row.email}</p>
                        {row.barEnrolment && <p className="text-xs text-slate">Enrolment {row.barEnrolment}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={row.role === "OWNER" ? "ink" : row.role === "ADMIN" ? "gold" : row.role === "LAWYER" ? "blue" : "grey"}>
                      {ROLES.find((r) => r.value === row.role)?.label}
                    </Badge>
                    {!row.isActive && <div className="mt-1"><Badge tone="red">Deactivated</Badge></div>}
                  </Td>
                  <Td className="text-sm">{row._count.assignments}</Td>
                  <Td className="text-xs">
                    <div className="flex flex-wrap gap-1">
                      {row.googleLinked && <Badge tone="green">Google</Badge>}
                      {row.hasPassword && <Badge>Password</Badge>}
                      {!row.googleLinked && !row.hasPassword && <Badge>Awaiting first sign-in</Badge>}
                    </div>
                    <p className="mt-1 text-slate">{row.lastLoginAt ? `Last ${formatDate(row.lastLoginAt)}` : "Never signed in"}</p>
                  </Td>
                  <Td className="text-right">
                    {row.id !== user.id && (
                      <Button tone="secondary" size="sm" onClick={() => setEditing(row)}>Edit</Button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a lawyer or staff member" : "Edit account"}>
        {editing !== null && (
          <StaffForm
            initial={editing === "new" ? undefined : editing}
            canManageSenior={canManageSenior}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
