"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, refreshWebsite } from "@/lib/portal/api";
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorNote, PageTitle, Spinner, Table, Td, Th } from "@/components/portal/ui";

/**
 * Website → Our Partners: the logos in the home page's honeycomb, in the
 * order shown here. View-only, like Lawyer profiles: every partner is an
 * organisation in Clients ticked "Show on the home page", and is added,
 * renamed, linked, given its logo, hidden or removed there. This page only
 * sets the order.
 */

type Partner = {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  published: boolean;
  sortOrder: number;
  /** The organisation in Clients this partner is. */
  clientId: string;
};

const CLIENTS_ON_HOME_PAGE = "/admin/clients?website=shown";

/** "https://www.example.com/" → "example.com", for a tidy link label. */
function siteLabel(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function AdminPartners() {
  const [rows, setRows] = useState<Partner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ data: Partner[] }>("/admin/partners").then((r) => setRows(r.data)).catch((cause: Error) => setError(cause.message));
  }, []);
  useEffect(load, [load]);

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

  const shown = rows?.filter((p) => p.published).length ?? 0;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Our Partners"
        description="The organisation logos in the honeycomb on the home page, after Our Approach, in the order listed here. Any number works, odd or even; half go either side of the firm's mark."
        actions={<ButtonLink href="/#partners" tone="secondary">View on the website</ButtonLink>}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
        <p className="max-w-[70ch]">
          This page is view-only. To add a partner, change its name, logo or link, or show or hide it on the website, go to{" "}
          <span className="font-semibold">Clients</span> and tick <span className="font-semibold">Show on the home page</span> for the organisation.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          <Link href="/admin/clients?add=organisation" className="font-semibold text-gold-deep hover:underline">
            Add an organisation →
          </Link>
          <Link href={CLIENTS_ON_HOME_PAGE} className="font-semibold text-gold-deep hover:underline">
            Open Clients →
          </Link>
        </div>
      </div>

      <Card>
        <ErrorNote>{error}</ErrorNote>
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No partners yet" action={<ButtonLink href="/admin/clients?add=organisation">Add an organisation</ButtonLink>}>
            The Our Partners section is left off the home page until an organisation in Clients is ticked “Show on the home page”.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Partner</Th>
                <Th>Links to</Th>
                <Th>On the website</Th>
                <Th className="text-right">Order</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((partner, index) => (
                <tr key={partner.id} className={partner.published ? "" : "opacity-60"}>
                  <Td className="align-middle!">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-white">
                        {partner.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- an uploaded logo served by the API
                          <img src={partner.logoUrl} alt="" className="h-10 w-10 object-contain" />
                        ) : (
                          <span className="text-[10px] font-semibold uppercase text-slate">No logo</span>
                        )}
                      </div>
                      <p className="font-semibold">{partner.name}</p>
                    </div>
                  </Td>
                  <Td className="align-middle! text-xs">
                    {partner.website ? (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={partner.website}
                        className="inline-block max-w-[16rem] truncate align-bottom font-semibold text-gold-deep hover:underline"
                      >
                        {siteLabel(partner.website)} ↗
                      </a>
                    ) : (
                      <span className="text-slate">No link</span>
                    )}
                  </Td>
                  <Td className="align-middle!">{partner.published ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}</Td>
                  <Td className="align-middle! text-right">
                    <div className="inline-flex gap-1.5">
                      <Button size="sm" tone="secondary" disabled={busy || index === 0} onClick={() => void move(index, -1)} aria-label={`Move ${partner.name} up`}>
                        ↑
                      </Button>
                      <Button size="sm" tone="secondary" disabled={busy || index === rows.length - 1} onClick={() => void move(index, 1)} aria-label={`Move ${partner.name} down`}>
                        ↓
                      </Button>
                    </div>
                  </Td>
                  <Td className="align-middle! text-right">
                    <ButtonLink href={`/admin/clients?edit=${partner.clientId}`} size="sm" tone="secondary" className="whitespace-nowrap">
                      Edit in Clients
                    </ButtonLink>
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
    </div>
  );
}
