/**
 * The firm's contact details, social profiles and careers line, edited in
 * the console (Website → Site settings) and read from the API's
 * /public/settings. Safe for client components: plain strings only.
 *
 * SETTINGS_DEFAULTS mirror the API's defaults (apps/api/src/lib/site-settings.ts)
 * and stand in only when the API cannot be reached.
 */
export const SETTINGS_DEFAULTS = {
  mobile1: "+91 63052 48577",
  mobile2: "",
  landline: "",
  whatsapp: "",
  email: "info@adooralegalservices.com",
  hours: "",
  linkedin: "https://www.linkedin.com/in/ganesh-raghavendra-57aba8152/",
  instagram: "https://www.instagram.com/adoora_legalservices/",
  youtube: "",
  twitter: "",
  facebook: "",
  careersPhone: "",
  careersEmail: "hr@adooralegalservices.com",
};

export type ContactSettings = Record<keyof typeof SETTINGS_DEFAULTS, string>;

/** The console's view adds where the form emails go, and who sends them. */
export type AdminSettings = ContactSettings & { notifyEmail: string; notifyCareersEmail: string; emailFrom: string };

/** Every empty field filled from SETTINGS_DEFAULTS. */
export function withDefaults(input: Partial<ContactSettings>): ContactSettings {
  const out = { ...SETTINGS_DEFAULTS };
  for (const key of Object.keys(SETTINGS_DEFAULTS) as (keyof ContactSettings)[]) {
    const value = input[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
}

type Line = { label: string; href: string };

export type SocialProfile = { name: "LinkedIn" | "Instagram" | "YouTube" | "X" | "Facebook"; href: string };

export type PublicContact = {
  /** The mobiles, in order of priority. */
  mobiles: Line[];
  /** The first mobile, else the landline: the one number shown where there is room for one. */
  primary: Line;
  landline: Line;
  whatsappHref: string;
  /** The WhatsApp number in E.164, for structured data. */
  whatsappE164: string;
  email: string;
  emailHref: string;
  hours: string;
  /** Each network the firm is on, in display order; LinkedIn and Instagram always, linked or not. */
  social: SocialProfile[];
  careersPhone: Line;
  careersEmail: string;
};

/** Digits for tel: and wa.me. A bare ten-digit number is taken as Indian (+91). */
export function e164(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  const bare = digits.replace(/^0+/, "");
  return bare.length === 10 ? `+91${bare}` : `+${bare}`;
}

const WHATSAPP_MESSAGE = "Hello ADOORA Legal Services, I need some legal assistance. Could you please help me?";

const line = (label: string): Line => ({ label, href: label ? `tel:${e164(label)}` : "" });

export function toPublicContact(input: Partial<ContactSettings>): PublicContact {
  const settings = withDefaults(input);
  const mobiles = [settings.mobile1, settings.mobile2].filter(Boolean).map(line);
  const landline = line(settings.landline);
  // WhatsApp is the first mobile unless Site settings names another number.
  const whatsappE164 = e164(settings.whatsapp || settings.mobile1);
  return {
    mobiles,
    primary: mobiles[0] ?? landline,
    landline,
    // Opens the chat with this message already typed, as on Deeds & Co.
    whatsappHref: whatsappE164 ? `https://wa.me/${whatsappE164.replace(/^\+/, "")}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}` : "",
    whatsappE164,
    email: settings.email,
    emailHref: settings.email ? `mailto:${settings.email}` : "",
    hours: settings.hours,
    social: [
      { name: "LinkedIn" as const, href: settings.linkedin },
      { name: "Instagram" as const, href: settings.instagram },
      { name: "YouTube" as const, href: settings.youtube },
      { name: "X" as const, href: settings.twitter },
      { name: "Facebook" as const, href: settings.facebook },
    ].filter((profile) => profile.href || profile.name === "LinkedIn" || profile.name === "Instagram"),
    careersPhone: line(settings.careersPhone),
    careersEmail: settings.careersEmail,
  };
}

export const DEFAULT_CONTACT = toPublicContact({});
