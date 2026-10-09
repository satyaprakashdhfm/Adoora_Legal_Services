/**
 * SAMPLE partners for the home page's "Our Partners" honeycomb, shown only
 * until the firm adds its own in the console (Website → Our Partners).
 * These are placeholder names, not real clients, with placeholder logos drawn
 * for them (public/partners/sample-*.png, 400 × 400 px like a real upload):
 * replace them before the section goes live. A partner added in the console
 * without a logo shows its initials instead.
 */
export type PartnerItem = { id: string; name: string; website: string | null; logoUrl: string | null };

export const samplePartners: PartnerItem[] = [
  { id: "sample-1", name: "Godavari Infra Projects", website: null, logoUrl: "/partners/sample-1.png" },
  { id: "sample-2", name: "Deccan Agro Foods", website: null, logoUrl: "/partners/sample-2.png" },
  { id: "sample-3", name: "Krishna Textile Mills", website: null, logoUrl: "/partners/sample-3.png" },
  { id: "sample-4", name: "Tungabhadra Power", website: null, logoUrl: "/partners/sample-4.png" },
  { id: "sample-5", name: "Charminar Logistics", website: null, logoUrl: "/partners/sample-5.png" },
  { id: "sample-6", name: "Nallamala Life Sciences", website: null, logoUrl: "/partners/sample-6.png" },
];
