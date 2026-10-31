import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * The website's contact details, social profiles, careers line and form
 * emails, edited in the console (Website → Site settings). Stored as one
 * JSON row. A field left empty falls back to the firm's default below, so
 * the console always shows the value the website is using; a default that
 * is itself empty (a network the firm is not on) shows nothing.
 *
 * The website reads the public part through /api/public/settings; the form
 * emails (lib/mail.ts) read where to send and who sends.
 */

const KEY = "contact";

export const SETTINGS_DEFAULTS = {
  /** Mobiles, in order of priority: the first is the WhatsApp number unless another is set. */
  mobile1: "+91 63052 48577",
  mobile2: "",
  landline: "",
  /** Empty: WhatsApp goes to Mobile 1. */
  whatsapp: "",
  email: "info@adooralegalservices.com",
  hours: "",
  linkedin: "https://www.linkedin.com/in/ganesh-raghavendra-57aba8152/",
  instagram: "https://www.instagram.com/adoora_legalservices/",
  youtube: "",
  twitter: "",
  facebook: "",
  /** Shown on the careers page, for questions about a role. */
  careersPhone: "",
  careersEmail: "hr@adooralegalservices.com",
  /** Where the website emails each new enquiry and each application, and who sends them. */
  notifyEmail: env.NOTIFY_EMAIL,
  notifyCareersEmail: env.HR_EMAIL,
  emailFrom: env.MAIL_FROM,
};

export type SiteSettings = Record<keyof typeof SETTINGS_DEFAULTS, string>;

/** What the public website may see: everything but the form-email settings. */
export type PublicSettings = Omit<SiteSettings, "notifyEmail" | "notifyCareersEmail" | "emailFrom">;

const optional = (max: number) => z.string().trim().max(max).default("");
const tel = (message: string) => optional(40).refine((v) => !v || /^[+()\-\s\d]{6,}$/.test(v), message);
const mail = (message: string) => z.union([z.literal(""), z.string().trim().toLowerCase().email(message)]).default("");
const link = (message: string) => z.union([z.literal(""), z.string().trim().url(message)]).default("");

export const settingsSchema = z.object({
  mobile1: tel("Please enter a valid first mobile number."),
  mobile2: tel("Please enter a valid second mobile number."),
  landline: tel("Please enter a valid landline number."),
  whatsapp: tel("Please enter a valid WhatsApp number."),
  email: mail("Please enter a valid email."),
  hours: optional(120),
  linkedin: link("Please paste the full LinkedIn address."),
  instagram: link("Please paste the full Instagram address."),
  youtube: link("Please paste the full YouTube address."),
  twitter: link("Please paste the full X (Twitter) address."),
  facebook: link("Please paste the full Facebook address."),
  careersPhone: tel("Please enter a valid careers phone number."),
  careersEmail: mail("Please enter a valid careers email."),
  notifyEmail: mail("Please enter a valid email for enquiry emails."),
  notifyCareersEmail: mail("Please enter a valid email for application emails."),
  emailFrom: optional(160).refine(
    (v) => !v || /^[^<>]*<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$|^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v),
    "Please write the sender as name@domain or Name <name@domain>.",
  ),
});

/** Every empty field filled from SETTINGS_DEFAULTS. */
export function withDefaults(input: Partial<SiteSettings>): SiteSettings {
  const out = { ...SETTINGS_DEFAULTS };
  for (const key of Object.keys(SETTINGS_DEFAULTS) as (keyof SiteSettings)[]) {
    const value = input[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
}

// A short in-process cache: every form email and every public page asks.
let cached: { at: number; settings: SiteSettings } | null = null;
const CACHE_MS = 60_000;

/** The settings, defaults filled in. Never throws: the defaults stand in if the database cannot be read. */
export async function readSettings(): Promise<SiteSettings> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.settings;
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    const parsed = settingsSchema.partial().safeParse(row?.value ?? {});
    const settings = withDefaults(parsed.success ? parsed.data : {});
    cached = { at: Date.now(), settings };
    return settings;
  } catch (error) {
    logger.error({ err: error }, "Site settings could not be read; using the defaults");
    return withDefaults({});
  }
}

export async function writeSettings(input: z.infer<typeof settingsSchema>): Promise<SiteSettings> {
  const value = input as Prisma.InputJsonValue;
  await prisma.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  cached = null;
  return withDefaults(input);
}

export function publicSettings(settings: SiteSettings): PublicSettings {
  const { notifyEmail: _notify, notifyCareersEmail: _careers, emailFrom: _from, ...rest } = settings;
  return rest;
}
