import { z } from "zod";

/**
 * Request validation.
 *
 * Messages are written to be shown to the person filling the form, because
 * the error handler passes them straight through to the browser.
 */

const name = z
  .string()
  .trim()
  .min(2, "Please enter your full name.")
  .max(120, "That name is longer than we can store.");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.")
  .max(254);

/** Permissive on format — international numbers vary too much to police. */
const phone = z
  .string()
  .trim()
  .min(6, "Please enter a contact number.")
  .max(32, "That number looks too long.")
  .regex(/^[+()\-\s\d]+$/, "Please enter a valid telephone number.");

/**
 * The honeypot field. It is hidden in the form, so any value at all means a
 * bot filled it in. Must be absent or empty.
 */
const honeypot = z
  .string()
  .max(0, "Rejected.")
  .optional()
  .or(z.literal("").optional());

const consent = z.literal(true, {
  message: "We need your consent in order to process this request.",
});

export const enquirySchema = z.object({
  name,
  email,
  phone,
  matterType: z
    .string()
    .trim()
    .min(2, "Please select the matter type.")
    .max(120),
  description: z
    .string()
    .trim()
    .min(20, "Please give us a little more detail — at least a sentence or two.")
    .max(2000, "Please keep the description under 2000 characters."),
  consent,
  company: honeypot,
});

export const careerSchema = z.object({
  name,
  email,
  phone,
  role: z.string().trim().min(2, "Please select a role.").max(160),
  experience: z
    .string()
    .trim()
    .min(1, "Please tell us your years of experience.")
    .max(80),
  enrolment: z.string().trim().max(80).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(20, "Please tell us a little about why you are applying.")
    .max(1500),
  consent,
  company: honeypot,
});

export const subscriberSchema = z.object({
  email,
  name: z.string().trim().max(120).optional().or(z.literal("")),
  interests: z.array(z.string().trim().max(80)).max(20).optional(),
  consent,
  company: honeypot,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password."),
});

export const listQuerySchema = z.object({
  status: z.string().trim().max(40).optional(),
  /** Cursor pagination — stable under inserts, unlike offset. */
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type CareerInput = z.infer<typeof careerSchema>;
export type SubscriberInput = z.infer<typeof subscriberSchema>;
