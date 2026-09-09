import { practiceAreas } from "@/content/practice-areas";
import { industries } from "@/content/industries";

export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href: string;
  /** Rendered as a mega-menu panel on desktop and an accordion on mobile. */
  children?: NavChild[];
};

export const primaryNav: NavItem[] = [
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "All practice areas", href: "/services" },
      ...practiceAreas.map((area) => ({
        label: area.name,
        href: `/services/${area.slug}`,
      })),
    ],
  },
  {
    label: "Domains",
    href: "/domains",
    children: [
      { label: "All industry domains", href: "/domains" },
      ...industries.map((industry) => ({
        label: industry.name,
        href: `/domains/${industry.slug}`,
      })),
    ],
  },
  { label: "Insights", href: "/insights" },
  { label: "Achievements", href: "/achievements" },
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = [
  {
    heading: "Services",
    links: practiceAreas.map((area) => ({
      label: area.shortName,
      href: `/services/${area.slug}`,
    })),
  },
  {
    heading: "Domains",
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
      { label: "Achievements", href: "/achievements" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
];
