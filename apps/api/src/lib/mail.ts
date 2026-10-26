import { Resend } from "resend";
import { env } from "../env.js";
import { logger } from "../logger.js";

/**
 * Email through Resend, for the website forms: the firm is told of each new
 * enquiry and career application, and the person who sent it gets a short
 * acknowledgement with their reference. Without a key nothing is mailed; the
 * forms still save, and the console lists them as before.
 *
 * Sending never holds up or fails a form: the record is already saved, so a
 * mail that cannot go is logged and the visitor still sees their reference.
 */

const apiKey = env.RESEND_KEY ?? env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FIRM = "Adoora Legal Services";

type Mail = {
  to: string;
  subject: string;
  /** Paragraphs; a line of the form "Label: value" is kept as it is. */
  lines: string[];
  replyTo?: string;
  /** Resend drops a repeat of the same key for 24 hours, so a retry is never sent twice. */
  idempotencyKey: string;
};

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function html(lines: string[]) {
  const body = lines
    .map((line) => `<p style="margin:0 0 12px">${escape(line).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#14213d;max-width:560px">${body}</div>`;
}

async function send(mail: Mail) {
  if (!resend) return;
  const { error } = await resend.emails.send(
    {
      from: env.MAIL_FROM,
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      html: html(mail.lines),
      text: mail.lines.join("\n\n"),
    },
    { idempotencyKey: mail.idempotencyKey },
  );
  // Deliberately no form content or address in the log line.
  if (error) logger.error({ key: mail.idempotencyKey, error: error.name, message: error.message }, "Email not sent");
  else logger.info({ key: mail.idempotencyKey }, "Email sent");
}

function sendAll(mails: Mail[]) {
  for (const mail of mails) {
    void send(mail).catch((error: unknown) => logger.error({ key: mail.idempotencyKey, err: error }, "Email not sent"));
  }
}

const consoleLink = (path: string) => new URL(path, env.APP_URL).toString();

export function mailEnquiry(enquiry: {
  reference: string;
  name: string;
  email: string;
  phone: string;
  matterType: string;
  description: string;
}) {
  sendAll([
    {
      to: env.NOTIFY_EMAIL,
      replyTo: enquiry.email,
      subject: `New enquiry ${enquiry.reference}: ${enquiry.matterType}`,
      lines: [
        `A new enquiry has come in through the website.`,
        `Reference: ${enquiry.reference}\nName: ${enquiry.name}\nEmail: ${enquiry.email}\nPhone: ${enquiry.phone}\nCase type: ${enquiry.matterType}`,
        enquiry.description,
        `Reply to this email to write to ${enquiry.name}, or open it in the console: ${consoleLink("/admin/enquiries")}`,
      ],
      idempotencyKey: `enquiry-notify/${enquiry.reference}`,
    },
    {
      to: enquiry.email,
      replyTo: env.NOTIFY_EMAIL,
      subject: `We have received your enquiry (${enquiry.reference})`,
      lines: [
        `Dear ${enquiry.name},`,
        `Thank you for contacting ${FIRM}. Your enquiry has reached us and we aim to acknowledge every enquiry within one working day.`,
        `Your reference is ${enquiry.reference}. Please quote it if you write to us about this matter.`,
        `This is an acknowledgement only; it does not create a lawyer–client relationship. Please do not send confidential documents until we have been in touch.`,
        `${FIRM}`,
      ],
      idempotencyKey: `enquiry-ack/${enquiry.reference}`,
    },
  ]);
}

export function mailApplication(application: {
  reference: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  enrolment: string | null;
  message: string;
  hasResume: boolean;
}) {
  sendAll([
    {
      to: env.HR_EMAIL,
      replyTo: application.email,
      subject: `New application ${application.reference}: ${application.role}`,
      lines: [
        `A new career application has come in through the website.`,
        [
          `Reference: ${application.reference}`,
          `Name: ${application.name}`,
          `Email: ${application.email}`,
          `Phone: ${application.phone}`,
          `Role: ${application.role}`,
          ...(application.enrolment ? [`Enrolment: ${application.enrolment}`] : []),
          `Résumé: ${application.hasResume ? "attached to the application in the console" : "not uploaded"}`,
        ].join("\n"),
        ...(application.message ? [application.message] : []),
        `Reply to this email to write to ${application.name}, or open it in the console: ${consoleLink("/admin/applications")}`,
      ],
      idempotencyKey: `application-notify/${application.reference}`,
    },
    {
      to: application.email,
      replyTo: env.HR_EMAIL,
      subject: `We have received your application (${application.reference})`,
      lines: [
        `Dear ${application.name},`,
        `Thank you for applying for ${application.role} at ${FIRM}. Your application has reached us.`,
        application.hasResume
          ? `Your reference is ${application.reference}.`
          : `Your reference is ${application.reference}. Please reply to this email with your CV, quoting the reference, so we can consider it alongside your application.`,
        `We read every application and will be in touch if your profile matches what we are looking for.`,
        `${FIRM}`,
      ],
      idempotencyKey: `application-ack/${application.reference}`,
    },
  ]);
}
