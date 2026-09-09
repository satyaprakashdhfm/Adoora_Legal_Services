/**
 * Bar Council of India compliance copy.
 *
 * The BCI Rules on advertising and solicitation (Rule 36, Chapter II, Part VI)
 * prohibit advocates from soliciting work or advertising. Indian firms address
 * this with a disclaimer gate the user must accept before viewing firm
 * information, on the basis that the information is then provided at the
 * user's own request rather than pushed to them.
 *
 * The wording below was supplied by the firm and should not be edited without
 * their sign-off. It is rendered verbatim by `DisclaimerGate`.
 */

export const disclaimer = {
  heading: "Disclaimer",
  intro:
    "As per the rules of the Bar Council of India, we are not permitted to solicit work and advertise. By clicking on the ‘I AGREE’ button below, you acknowledge the following:",
  acknowledgements: [
    "There has been no advertisement, personal communication, solicitation, invitation or inducement of any sort whatsoever from us or any of our members to solicit any work through this website;",
    "You wish to gain more information about us for your own information and use;",
    "The information about us is provided to you on your specific request and any information obtained or materials downloaded from this website is completely at your own volition and any transmission, receipt or use of this site does not create any lawyer‑client relationship; and that",
    "We are not liable for any consequence of any action taken by you relying on the material / information provided on this website.",
  ],
  advice:
    "If you have any legal issues, you, in all cases, must seek independent legal advice.",
  cookies:
    "We use cookies to enhance your experience. By continuing to visit this website you agree to our use of cookies.",
  agreeLabel: "I AGREE",
  declineLabel: "I DO NOT AGREE",
} as const;

/** Shown on `/notice` when a visitor declines the disclaimer. */
export const declineNotice = {
  heading: "Thank you for visiting",
  body: [
    "You have chosen not to accept the disclaimer, so we are unable to display information about the firm, its practice areas or its people.",
    "Nothing on this website is an advertisement or a solicitation of work. If you would like to reconsider, you may return to the disclaimer at any time.",
    "If you have a legal issue, please seek independent legal advice from an advocate of your choosing.",
  ],
} as const;

/** Persistent footer disclaimer, shown on every page. */
export const footerDisclaimer =
  "The Bar Council of India does not permit advocates to solicit work or advertise. The contents of this website are for informational purposes only and do not constitute legal advice or an advertisement. Nothing on this website creates a lawyer‑client relationship. Visitors accessing this website have done so of their own volition and no information provided here should be relied upon without seeking independent legal advice.";

/**
 * Cookie consent categories. Essential cookies cannot be switched off — the
 * disclaimer acceptance itself is stored in one.
 */
export const cookieCategories = [
  {
    id: "essential",
    name: "Strictly necessary",
    required: true,
    description:
      "Needed for the website to function. These remember that you accepted the disclaimer and your cookie preferences, so you are not asked again on every page.",
  },
  {
    id: "analytics",
    name: "Analytics",
    required: false,
    description:
      "Help us understand which pages are read and where visitors leave, so we can improve the site. Aggregated and not used to identify you.",
  },
  {
    id: "marketing",
    name: "Marketing",
    required: false,
    description:
      "Not currently used on this website. If that changes, this category will control any such cookies and will remain off unless you enable it.",
  },
] as const;

export type CookieCategoryId = (typeof cookieCategories)[number]["id"];

/** Cookie names, kept in one place so the gate and the banner agree. */
export const COOKIE_DISCLAIMER = "adoora_disclaimer_ack";
export const COOKIE_CONSENT = "adoora_cookie_consent";
