import { practiceAreas } from "@/content/practice-areas";
import { industries } from "@/content/industries";

export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href: string;
  /** Rendered as a mega-menu panel on desktop and an accordion on mobile. */
  children?: NavChild[];
};

/**
 * Primary navigation.
 *
 * Practices and sectors used to be two top-level items. They are one now:
 * a visitor thinks in terms of the matter they have, not whether we file it
 * under a practice or an industry. Sector pages keep their URLs and are
 * reached from the practices index, each practice page, and the footer.
 */
export const primaryNav: NavItem[] = [
  {
    label: "Practices",
    href: "/services",
    children: [
      { label: "All Practices and Sectors", href: "/services" },
      ...practiceAreas.map((area) => ({
        label: area.name,
        href: `/services/${area.slug}`,
      })),
    ],
  },
  { label: "Insights", href: "/insights" },
  { label: "About Us", href: "/about" },
  { label: "Community", href: "/community" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = [
  {
    heading: "Practices",
    links: practiceAreas.map((area) => ({
      label: area.shortName,
      href: `/services/${area.slug}`,
    })),
  },
  {
    heading: "Sectors",
    links: industries.map((industry) => ({
      label: industry.shortName,
      href: `/domains/${industry.slug}`,
    })),
  },
  {
    heading: "Firm",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Insights", href: "/insights" },
      { label: "Community", href: "/community" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];
