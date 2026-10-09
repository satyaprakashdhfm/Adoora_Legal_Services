"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, refreshWebsite } from "@/lib/portal/api";
import { checkLogo, LOGO_GUIDE, LOGO_TYPES } from "@/lib/portal/partner-logo";
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorNote, Field, Input, Modal, PageTitle, Spinner, Table, Td, Th } from "@/components/portal/ui";

/**
 * Website → Our Partners: the logos in the home page's honeycomb, in the
 * order shown here. Logos must be square (the hexagons are), which the API
 * enforces too; this page checks first so the admin gets the answer before
 * the upload rather than after.
 */

type Partner = {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  published: boolean;
  sortOrder: number;
  /** Set when it comes from an organisation in Clients ("Show on the home page"). */
  clientId: string | null;
};

export default function AdminPartners() {
  const [rows, setRows] = useState<Partner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partner | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ data: Partner[] }>("/admin/partners").then((r) => setRows(r.data)).catch((cause: Error) => setError(cause.message));
  }, []);
  useEffect(load, [load]);

  async function saved() {
    setEditing(null);
    await refreshWebsite(["website-partners"]);
    load();
  }

  async function move(index: number, step: -1 | 1) {
    if (!rows) return;
    const next = [...rows];
    const [item] = next.splice(index, 1);
    next.splice(index + step, 0, item!);
    setRows(next);
    setBusy(true);
    setError(null);
    try {
      await api("/admin/partners/order", { method: "PUT", body: { ids: next.map((p) => p.id) } });
      await refreshWebsite(["website-partners"]);
    } catch (cause) {
      setError((cause as Error).message);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(partner: Partner) {
    if (!window.confirm(`Remove ${partner.name} and its logo from the website? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/partners/${partner.id}`, { method: "DELETE" });
      await saved();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const shown = rows?.filter((p) => p.published).length ?? 0;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Our Partners"
        description="The client and partner logos in the honeycomb on the home page, after Our Approach, in the order listed here. Any number works, odd or even; half go either side of the firm's mark."
        actions={
          <>
            <ButtonLink href="/#partners" tone="secondary">View on the website</ButtonLink>
            <Button onClick={() => setEditing("new")}>Add partner</Button>
          </>
        }
      />

      <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
        <p className="font-semibold">Logo size</p>
        <p className="mt-0.5 text-ink-soft">{LOGO_GUIDE}</p>
      </div>

      <Card>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No partners yet" action={<Button onClick={() => setEditing("new")}>Add partner</Button>}>
            Until the first partner is added, the home page shows six sample names as placeholders.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Partner</Th>
                <Th>On the website</Th>
                <Th className="text-right">Order and actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((partner, index) => (
                <tr key={partner.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white">
                        {partner.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- an uploaded logo served by the API
                          <img src={partner.logoUrl} alt="" className="h-10 w-10 object-contain" />
                        ) : (
                          <span className="text-[10px] font-semibold uppercase text-slate">No logo</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{partner.name}</p>
                        {partner.website && <p className="truncate text-xs text-slate">{partner.website}</p>}
                        {partner.clientId && <p className="text-xs text-slate">From Clients</p>}
                      </div>
                    </div>
                  </Td>
                  <Td>{partner.published ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}</Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Button size="sm" tone="secondary" disabled={busy || index === 0} onClick={() => void move(index, -1)} aria-label={`Move ${partner.name} up`}>
                        ↑
                      </Button>
                      <Button size="sm" tone="secondary" disabled={busy || index === rows.length - 1} onClick={() => void move(index, 1)} aria-label={`Move ${partner.name} down`}>
                        ↓
                      </Button>
                      <Button size="sm" tone="secondary" disabled={busy} onClick={() => setEditing(partner)}>
                        Edit
                      </Button>
                      <Button size="sm" tone="danger" disabled={busy} onClick={() => void remove(partner)}>
                        Remove
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {rows && rows.length > 0 && (
          <p className="border-t border-line px-5 py-3 text-xs text-slate">
            {shown} of {rows.length} shown on the website.
          </p>
        )}
      </Card>

      {editing && (
        <PartnerDialog partner={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => void saved()} />
      )}
    </div>
  );
}

function PartnerDialog({ partner, onClose, onSaved }: { partner: Partner | null; onClose: () => void; onSaved: () => void }) {
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function pick(file: File | undefined) {
    setLogo(null);
    setPreview(null);
    setLogoError(null);
    if (!file) return;
    const problem = await checkLogo(file);
    if (problem) {
      setLogoError(problem);
      return;
    }
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      website: String(form.get("website") ?? ""),
      published: form.get("published") === "on",
    };
    setSaving(true);
    setError(null);
    try {
      const saved = partner
        ? await api<Partner>(`/admin/partners/${partner.id}`, { method: "PATCH", body })
        : await api<Partner>("/admin/partners", { method: "POST", body });
      if (logo) {
        const upload = new FormData();
        upload.set("logo", logo);
        await api(`/admin/partners/${saved.id}/logo`, { method: "PUT", body: upload });
      }
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeLogo() {
    if (!partner) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/admin/partners/${partner.id}/logo`, { method: "DELETE" });
      onSaved();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const current = preview ?? partner?.logoUrl ?? null;

  return (
    <Modal open onClose={onClose} title={partner ? `Edit ${partner.name}` : "Add partner"}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <Field label="Name" required hint="Shown to screen readers, and on the hexagon itself when there is no logo.">
          <Input name="name" defaultValue={partner?.name ?? ""} required minLength={2} maxLength={120} />
        </Field>
        <Field label="Website" hint="Optional. The logo links here, opening in a new tab.">
          <Input name="website" type="url" placeholder="https://" defaultValue={partner?.website ?? ""} maxLength={300} />
        </Field>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Logo</p>
          <div className="mt-1.5 flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-[repeating-conic-gradient(var(--color-paper-tint)_0_25%,white_0_50%)] bg-[length:12px_12px]">
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local preview or an uploaded logo
                <img src={current} alt="" className="h-16 w-16 object-contain" />
              ) : (
                <span className="text-[10px] font-semibold uppercase text-slate">None</span>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-line-strong bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-gold">
                {current ? "Choose another logo" : "Upload logo"}
                <input type="file" accept={LOGO_TYPES.join(",")} className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
              </label>
              {partner?.logoUrl && !preview && (
                <button type="button" onClick={() => void removeLogo()} disabled={saving} className="ml-3 text-sm font-semibold text-red-700 hover:underline">
                  Remove logo
                </button>
              )}
              <p className="text-xs text-slate">{LOGO_GUIDE}</p>
              {logoError && <p className="text-xs font-semibold text-red-700">{logoError}</p>}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={partner?.published ?? true} className="h-4 w-4 accent-gold" />
          Show on the website
        </label>

        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" tone="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : partner ? "Save" : "Add partner"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
