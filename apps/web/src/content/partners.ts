/**
 * SAMPLE partners for the home page's "Our Partners" honeycomb, shown only
 * until the firm adds its own in the console (Website → Our Partners).
 * These are placeholder names, not real clients: replace them before the
 * section goes live. Without a logo, a hexagon shows the name's initials.
 */
export type PartnerItem = { id: string; name: string; website: string | null; logoUrl: string | null };

export const samplePartners: PartnerItem[] = [
  { id: "sample-1", name: "Godavari Infra Projects", website: null, logoUrl: null },
  { id: "sample-2", name: "Deccan Agro Foods", website: null, logoUrl: null },
  { id: "sample-3", name: "Krishna Textile Mills", website: null, logoUrl: null },
  { id: "sample-4", name: "Tungabhadra Power", website: null, logoUrl: null },
  { id: "sample-5", name: "Charminar Logistics", website: null, logoUrl: null },
  { id: "sample-6", name: "Nallamala Life Sciences", website: null, logoUrl: null },
];
