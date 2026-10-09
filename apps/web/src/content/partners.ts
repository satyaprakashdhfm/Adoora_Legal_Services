/**
 * A logo in the home page's "Our Partners" honeycomb, as the API's
 * /public/partners returns it. Partners live in the database only, managed
 * under Website → Our Partners (the six samples arrive with the migration
 * 20261015000000_sample_partners), so the website and the console always show
 * the same list. Without a logo, a hexagon shows the name's initials.
 */
export type PartnerItem = { id: string; name: string; website: string | null; logoUrl: string | null };
