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
  /**
   * A group photograph of the team: shown whole (centred, no navy wash over
   * the faces), with the copy on a panel of its own instead.
   */
  people?: boolean;
  /**
   * The photograph's width / height, e.g. "2125 / 740". The team photograph
   * is shown whole at these proportions, so update it with the picture.
   */
  imageAspect?: string;
};

/**
 * In order: who we are (credibility first), pro bono, what we do, why us,
 * and careers.
 */
export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "Our people",
    heading: "The advocates who take your brief",
    accent: "stay with it",
    body: "One team across Hyderabad, Bengaluru and Guntur. Every case has a named lawyer, from the first consultation to the final order.",
    href: "/about#people",
    cta: "Meet the team",
    imageBase: "hero-team",
    imageNote: "The team: six lawyers in a row, head-and-shoulders, against a navy backdrop.",
    people: true,
    imageAspect: "2125 / 740",
  },
  {
    eyebrow: "Pro bono",
    heading: "Legal help for people and causes that",
    accent: "need it most",
    body: "Free legal aid, legal awareness camps and support for NGOs. We work alongside legal services authorities, community groups and law schools.",
    href: "/community",
    cta: "Our pro bono work",
    imageBase: "hero-pro-bono",
    imageNote:
      "Placeholder: the pale Lady Justice frame used behind inner-page headers. Replace hero-pro-bono with a photograph of the firm's community work.",
    bright: true,
  },
  {
    eyebrow: "Our services",
    heading: "Litigation, advisory and transactions under",
    accent: "one roof",
    body: "We take civil, commercial, criminal and constitutional cases before courts and tribunals, and advise on corporate, banking, property and regulatory work. When a dispute grows out of a transaction, the same team handles both.",
    href: "/services",
    cta: "Explore our services",
    imageBase: "hero-office-desk",
    imageNote:
      "Office desk with laptop and contract folder, city skyline beyond, PEOPLE / PRINCIPLES / POSSIBILITIES on the wall.",
    bright: true,
  },
  {
    eyebrow: "Counsel",
    heading: "Candid advice, and a case you can",
    accent: "follow yourself",
    body: "Before you commit, we tell you what a case is likely to cost and how long it may take. Once it starts, your secure client portal shows every hearing date, court order and document, updated from the court's own records.",
    href: "/about",
    cta: "How we work",
    imageBase: "hero-law-justice",
    imageNote:
      "Brass scales of justice resting on bound LAW and JUSTICE volumes, chambers window behind.",
  },
  {
    eyebrow: "Careers",
    heading: "Build your practice with a team that",
    accent: "invests in you",
    body: "Openings for advocates, associates, interns and support staff across our offices. See the roles open now, or send us your CV.",
    href: "/careers",
    cta: "View openings",
    imageBase: "hero-shield-compliance",
    imageNote:
      "Brass shield and padlock against a Lady Justice figure, beside REGULATORY COMPLIANCE / ASSET PROTECTION / RISK MANAGEMENT volumes.",
  },
];
