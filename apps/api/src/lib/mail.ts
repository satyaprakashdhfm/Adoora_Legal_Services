import { Resend } from "resend";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { readSettings } from "./site-settings.js";

/**
 * Email through Resend, for the website forms, set out as Deeds & Co. sends
 * them: one email to the firm for each new enquiry and each career
 * application (with the résumé attached), a plain table of what was sent.
 * Where each goes, and the sender, are in Site settings (lib/site-settings.ts;
 * NOTIFY_EMAIL, HR_EMAIL and MAIL_FROM are the defaults). Reply goes to the person who sent the form. Without a key
 * nothing is mailed; the forms still save, and the console lists them.
 *
 * Sending never holds up or fails a form: the record is already saved, so a
 * mail that cannot go is logged and the visitor still sees their reference.
 */

const apiKey = env.RESEND_KEY ?? env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

type Attachment = { filename: string; content: Buffer };

type Mail = {
  /** Which Site settings address it goes to. */
  to: "notifyEmail" | "notifyCareersEmail";
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
  /** Resend drops a repeat of the same key for 24 hours, so a retry is never sent twice. */
  idempotencyKey: string;
};

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/** A plain two-column table of the submitted fields, and the same as text. */
function render(title: string, rows: [string, string][], footer: string) {
  const filled = rows.filter(([, value]) => value);
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#14213d">
<h2 style="color:#9a6224;margin:0 0 12px">${escape(title)}</h2>
<table cellpadding="6" style="border-collapse:collapse">${filled
    .map(
      ([label, value]) =>
        `<tr><td style="vertical-align:top;color:#5b6475;white-space:nowrap"><b>${escape(label)}</b></td><td style="white-space:pre-wrap">${escape(value)}</td></tr>`,
    )
    .join("")}</table>
<p style="color:#5b6475;font-size:12px;margin-top:16px">${escape(footer)}</p></div>`;
  const text = `${title}\n\n${filled.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${footer}`;
  return { html, text };
}

async function send(mail: Mail) {
  if (!resend) {
    logger.warn({ key: mail.idempotencyKey }, "Email not sent: RESEND_KEY is not set");
    return;
  }
  const settings = await readSettings();
  const { error } = await resend.emails.send(
    {
      from: settings.emailFrom,
      to: settings[mail.to],
      replyTo: mail.replyTo,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments?.length ? mail.attachments : undefined,
    },
    { idempotencyKey: mail.idempotencyKey },
  );
  // Deliberately no form content or address in the log line.
  if (error) logger.error({ key: mail.idempotencyKey, error: error.name, message: error.message }, "Email not sent");
  else logger.info({ key: mail.idempotencyKey }, "Email sent");
}

function sendInBackground(mail: Mail) {
  void send(mail).catch((error: unknown) => logger.error({ key: mail.idempotencyKey, err: error }, "Email not sent"));
}

export function mailEnquiry(enquiry: {
  reference: string;
  name: string;
  email: string;
  phone: string;
  matterType: string;
  description: string;
}) {
  const { html, text } = render(
    `New enquiry ${enquiry.reference}`,
    [
      ["Name", enquiry.name],
      ["Email", enquiry.email],
      ["Phone", enquiry.phone],
      ["Matter", enquiry.matterType],
      ["Description", enquiry.description],
    ],
    "Sent from the contact form on the website. Reply to this email to answer the enquirer; it is also in the admin console under Enquiries.",
  );
  sendInBackground({
    to: "notifyEmail",
    subject: `New enquiry: ${enquiry.matterType} — ${enquiry.name}`,
    html,
    text,
    replyTo: enquiry.email,
    idempotencyKey: `enquiry-notify/${enquiry.reference}`,
  });
}

export function mailApplication(
  application: {
    reference: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    experience: string;
    enrolment: string;
    message: string;
  },
  resume: Attachment | null,
) {
  const { html, text } = render(
    `New job application ${application.reference}`,
    [
      ["Name", application.name],
      ["Email", application.email],
      ["Phone", application.phone],
      ["Position", application.role],
      ["Experience", application.experience],
      ["Enrolment", application.enrolment],
      ["Message", application.message],
      ["Resume", resume ? `Attached (${resume.filename})` : "Not uploaded"],
    ],
    "Sent from the careers form on the website. It is also in the admin console under Applications.",
  );
  sendInBackground({
    to: "notifyCareersEmail",
    subject: `New application: ${application.role} — ${application.name}`,
    html,
    text,
    replyTo: application.email,
    attachments: resume ? [resume] : [],
    idempotencyKey: `application-notify/${application.reference}`,
  });
}
