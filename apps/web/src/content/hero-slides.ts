/**
 * Home-page hero slides.
 *
 * Each is framed around what the client is trying to achieve rather than what
 * the firm sells — and none of them make a claim about outcomes, which the BCI
 * rules would not permit. See `legal.ts`.
 *
 * `imageBase` is the file name in `public/` *without* an extension: the server
 * resolves whichever of .png/.jpg/.jpeg/.webp/.avif is actually there, so
 * dropping in a replacement photograph does not mean editing code.
 */
export type HeroSlide = {
  eyebrow: string;
  /** Split so the closing phrase can carry the gold accent. */
  heading: string;
  accent: string;
  body: string;
  href: string;
  cta: string;
  imageBase: string;
  /** Alt is empty — these are decorative; this is the description for editors. */
  imageNote: string;
  /**
   * Set when the photograph is bright. The navy wash is tuned for dark
   * photography, so a light frame gets an extra scrim to keep the band on
   * brand and the right-hand half from glaring.
   */
  bright?: boolean;
};

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "Corporate & M&A",
    heading: "Transactions structured for the rules they have",
    accent: "to survive",
    body: "Acquisitions, investments and joint ventures where the structuring question and the regulatory question cannot be separated — foreign investment routes, competition clearance and completion mechanics handled as one problem.",
    href: "/services/corporate-ma",
    cta: "Corporate & M&A",
    imageBase: "hero-office-desk",
    imageNote:
      "Office desk with laptop and contract folder, city skyline beyond, PEOPLE / PRINCIPLES / POSSIBILITIES on the wall.",
    bright: true,
  },
  {
    eyebrow: "Dispute Resolution",
    heading: "Strategy before pleadings, in the forum that",
    accent: "fits the relief",
    body: "Commercial litigation and arbitration across the High Courts, tribunals and arbitral forums of Telangana, Andhra Pradesh and Karnataka — with a candid view on what a claim is worth after cost and time.",
    href: "/services/dispute-resolution",
    cta: "Dispute Resolution",
    imageBase: "hero-law-justice",
    imageNote:
      "Brass scales of justice resting on bound LAW and JUSTICE volumes, chambers window behind.",
  },
  {
    eyebrow: "Banking & Finance",
    heading: "Security that holds at the point it matters —",
    accent: "enforcement",
    body: "Rupee and foreign currency lending, external commercial borrowings and security documentation, with stamp duty, registration and perfection mapped for every state in which an asset sits.",
    href: "/services/banking-finance",
    cta: "Banking & Finance",
    imageBase: "hero-shield-compliance",
    imageNote:
      "Brass shield and padlock against a Lady Justice figure, beside REGULATORY COMPLIANCE / ASSET PROTECTION / RISK MANAGEMENT volumes.",
  },
];
