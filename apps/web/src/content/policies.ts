/**
 * Policy pages. Plain-language and specific to how this site actually works.
 *
 * These are a solid, honest starting position — but they are not a substitute
 * for the firm's own sign-off. Before go-live the firm should confirm the
 * retention periods, the grievance officer's name and contact details, and the
 * analytics provider named in the cookie policy.
 */

export type PolicySection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

export type Policy = {
  slug: string;
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
};

export const policies: Policy[] = [
  {
    slug: "disclaimer",
    title: "Disclaimer",
    description:
      "Bar Council of India disclaimer and terms on which information on this website is provided.",
    updated: "2026-09-01",
    intro:
      "This website is informational. It is not an advertisement, and nothing on it is a solicitation of work.",
    sections: [
      {
        heading: "No advertisement or solicitation",
        body: [
          "The Bar Council of India does not permit advocates to solicit work or advertise. By accessing this website you acknowledge that there has been no advertisement, personal communication, solicitation, invitation or inducement of any sort from the firm or any of its members to solicit work through this website, and that you are seeking information about the firm for your own information and use.",
          "The information on this website is provided to you at your specific request. Any material obtained or downloaded from this website is entirely at your own volition.",
        ],
      },
      {
        heading: "No legal advice, no lawyer–client relationship",
        body: [
          "The contents of this website are for general information only and do not constitute legal advice. Law and regulatory practice change, and the position described may not be current or may not apply to your circumstances.",
          "Transmission, receipt or use of this website does not create a lawyer–client relationship. A relationship arises only once we have completed a conflicts check, confirmed an engagement in writing, and agreed the scope and terms of that engagement. Information you send us before then is not privileged.",
          "If you have a legal issue, you must in all cases seek independent legal advice.",
        ],
      },
      {
        heading: "No representation as to outcomes",
        body: [
          "Descriptions of matters on this website are illustrative of the type of work the firm handles. They omit client names and identifying details, and they are not representations about the outcome of any matter. Past work does not indicate what will happen in yours.",
          "Rankings and awards listed on this website are decided by third-party publishers on their own criteria. They are recorded as facts and are not a claim by the firm about the quality of its services.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "The firm is not liable for any consequence of any action taken by you in reliance on the material or information provided on this website. External links are provided for convenience and the firm is not responsible for the content of any external site.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description:
      "How ADOORA Legal Services collects, uses and protects personal data submitted through this website.",
    updated: "2026-09-01",
    intro:
      "This policy explains what personal data we collect through this website, why, how long we keep it, and what rights you have over it under the Digital Personal Data Protection Act, 2023.",
    sections: [
      {
        heading: "Who is responsible for your data",
        body: [
          "ADOORA Legal Services is the data fiduciary for personal data collected through this website. If you have a question about this policy or wish to exercise a right described below, contact us using the details on the Contact page and mark your message for the attention of the Grievance Officer.",
        ],
      },
      {
        heading: "What we collect",
        body: ["We collect only what the website needs to function and to respond to you."],
        bullets: [
          "Enquiry form: your name, email address, telephone number, the matter type you select, and the description you provide.",
          "Careers form: your name, contact details, the role applied for, and any information in the application you send.",
          "Technical data: IP address, browser and device type, and pages visited — used for security and, if you have consented to analytics cookies, to understand how the site is used.",
          "Preferences: whether you accepted the disclaimer, and your cookie choices, stored in first-party cookies on your device.",
        ],
      },
      {
        heading: "Why we process it",
        body: [
          "To respond to your enquiry and, where relevant, to carry out the conflicts check that must precede any engagement. To assess job applications. To keep the website secure and functioning. And to comply with our own legal and professional obligations.",
          "We do not sell personal data. We do not use enquiry data for marketing, and we do not add you to a mailing list because you sent an enquiry.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Enquiries that do not lead to an engagement are retained only as long as needed to deal with the enquiry and to maintain a conflicts record, and are then deleted. Where an enquiry leads to an engagement, the data becomes part of the client file and is retained under our professional record-keeping obligations.",
          "Job applications are retained for the recruitment cycle for the role, and afterwards only if you have agreed we may keep them on file. Cookie preferences and the disclaimer acknowledgement expire after 180 days.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Access within the firm is limited to those who need it. We use a small number of service providers — website hosting and email delivery — who process data on our instructions under contract and may not use it for their own purposes.",
          "We disclose personal data to a third party otherwise only where the law requires it, or where you have asked us to.",
        ],
      },
      {
        heading: "Security",
        body: [
          "The website is served over HTTPS and form submissions are transmitted encrypted. Access to submitted data is restricted and authenticated. No system is perfectly secure, and we ask that you do not send confidential case documents or sensitive personal information through the website form — wait until an engagement is confirmed and we can give you a secure route.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Under the Digital Personal Data Protection Act, 2023 you may request access to a summary of the personal data we hold about you and how it is processed, ask us to correct or complete inaccurate data, ask us to erase data where the purpose for which it was collected is no longer being served, nominate another person to exercise your rights in the event of death or incapacity, and withdraw a consent you previously gave.",
          "We will respond to a request within a reasonable period. If you are not satisfied with how we have handled a request, you may complain to the Data Protection Board of India.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    description:
      "The cookies this website sets, what each does, and how to change your choices.",
    updated: "2026-09-01",
    intro:
      "We set a small number of first-party cookies. Nothing beyond the strictly necessary cookies is set unless you allow it, and continued browsing is not treated as consent.",
    sections: [
      {
        heading: "Strictly necessary cookies",
        body: [
          "These make the website work and cannot be switched off. They store your disclaimer acknowledgement, so you are not asked again on every page, and your cookie preferences, so we can honour them. Both are first-party cookies set on this domain, contain no personal data beyond the choice itself, and expire after 180 days.",
        ],
      },
      {
        heading: "Analytics cookies",
        body: [
          "Optional. If you allow them, they help us understand which pages are read, how visitors arrive, and where they leave, so we can improve the site. The data is aggregated and is not used to identify you or to build a profile.",
          "Before go-live the firm should name its analytics provider here, together with the provider's own privacy information.",
        ],
      },
      {
        heading: "Marketing cookies",
        body: [
          "Not currently used on this website. The preference control exists so that, if this changes, the category is already available and remains off unless you enable it.",
        ],
      },
      {
        heading: "Changing your choices",
        body: [
          "You can change your preferences at any time by clearing this site's cookies in your browser, which will bring the preference banner back. Browsers also let you block or delete cookies generally — note that blocking the strictly necessary cookies will mean the disclaimer notice appears on every page.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Use",
    description:
      "The terms on which you may use the ADOORA Legal Services website.",
    updated: "2026-09-01",
    intro:
      "By using this website you agree to these terms. If you do not agree, please do not use the site.",
    sections: [
      {
        heading: "Permitted use",
        body: [
          "You may read this website and download or print material from it for your own information and non-commercial use. You may not republish, redistribute, sell or systematically extract content from this website, or use automated means to scrape it, without our written permission.",
        ],
      },
      {
        heading: "Intellectual property",
        body: [
          "The content, layout, design and marks on this website belong to ADOORA Legal Services or its licensors and are protected by law. Nothing on this website transfers any right in them to you.",
        ],
      },
      {
        heading: "Accuracy and availability",
        body: [
          "We take care over the content of this website but do not warrant that it is complete, current or free from error. Articles reflect the position as understood on their date of publication. We may change or remove content, and may suspend or withdraw the website, without notice.",
        ],
      },
      {
        heading: "Submissions",
        body: [
          "Do not send confidential or privileged material through this website. Information submitted through the enquiry form is not privileged and does not create a lawyer–client relationship, and we may be unable to treat it as confidential if we already act for another party in the matter. We run a conflicts check before responding substantively.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms and any dispute arising out of your use of this website are governed by the laws of India, and the courts at Hyderabad, Telangana have jurisdiction.",
        ],
      },
    ],
  },
];

export const policyBySlug = new Map(policies.map((policy) => [policy.slug, policy]));
