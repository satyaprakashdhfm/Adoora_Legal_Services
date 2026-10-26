"use client";

import { useEffect, useState } from "react";
import { api, refreshWebsite } from "@/lib/portal/api";
import { Button, Card, CardHeader, ErrorNote, Field, Input, PageTitle, Spinner } from "@/components/portal/ui";
import type { AdminSettings } from "@/lib/contact";

/**
 * Everything the website shows about how to reach the firm, plus where the
 * form emails go: the phone numbers, email, office hours, social profiles,
 * the careers line and the form-email settings. Each field opens with the
 * value the site uses now; clear a field and save to go back to the firm's
 * default. Office addresses are not here: they are part of the site's copy.
 */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<AdminSettings>("/admin/settings").then(setSettings).catch((cause: Error) => setError(cause.message));
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as AdminSettings;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      setSettings(await api<AdminSettings>("/admin/settings", { method: "PUT", body: data }));
      await refreshWebsite(["website-settings"]);
      setSaved(true);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!settings) return error ? <ErrorNote>{error}</ErrorNote> : <Spinner />;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Website"
        title="Site settings"
        description="Contact details shown on every page (the header, the footer, the contact and careers pages and the WhatsApp buttons), the social profiles, and where the website emails new enquiries and job applications. Clear a field and save to go back to the firm's default."
      />
      {/* Keyed on the saved values, so a save that changes a field (a cleared one back to its default) shows it. */}
      <form key={JSON.stringify(settings)} onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Phone numbers" description="Shown as written. A 10-digit number is dialled as +91." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Mobile 1" hint="Shown first everywhere: the header and the footer.">
              <Input name="mobile1" defaultValue={settings.mobile1} inputMode="tel" />
            </Field>
            <Field label="Mobile 2" hint="Shown after Mobile 1 in the footer and on the contact page.">
              <Input name="mobile2" defaultValue={settings.mobile2} inputMode="tel" />
            </Field>
            <Field label="Landline">
              <Input name="landline" defaultValue={settings.landline} inputMode="tel" />
            </Field>
            <Field label="WhatsApp number" hint="Leave empty to use Mobile 1.">
              <Input name="whatsapp" defaultValue={settings.whatsapp} placeholder="Same as Mobile 1" inputMode="tel" />
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Email and hours" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Email" hint="The public enquiries address.">
              <Input name="email" type="email" defaultValue={settings.email} />
            </Field>
            <Field label="Office hours" hint="Shown on the contact page. Leave empty to hide.">
              <Input name="hours" defaultValue={settings.hours} placeholder="Mon to Sat, 10:00 to 18:30" />
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Social profiles" description="Paste the full address of each profile. One left empty is not shown." />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="LinkedIn">
              <Input name="linkedin" type="url" defaultValue={settings.linkedin} />
            </Field>
            <Field label="Instagram">
              <Input name="instagram" type="url" defaultValue={settings.instagram} />
            </Field>
            <Field label="YouTube">
              <Input name="youtube" type="url" defaultValue={settings.youtube} />
            </Field>
            <Field label="X (Twitter)">
              <Input name="twitter" type="url" defaultValue={settings.twitter} />
            </Field>
            <Field label="Facebook">
              <Input name="facebook" type="url" defaultValue={settings.facebook} />
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Careers" description="Shown on the careers page, for questions about a role or an application." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Careers phone">
              <Input name="careersPhone" defaultValue={settings.careersPhone} inputMode="tel" />
            </Field>
            <Field label="Careers email">
              <Input name="careersEmail" type="email" defaultValue={settings.careersEmail} />
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Form emails"
            description="Each new enquiry and job application is saved here in the console and also emailed, through Resend. Applications come with the résumé attached."
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Enquiries go to" hint="From the contact form.">
              <Input name="notifyEmail" type="email" defaultValue={settings.notifyEmail} />
            </Field>
            <Field label="Job applications go to" hint="From the careers form, résumé attached.">
              <Input name="notifyCareersEmail" type="email" defaultValue={settings.notifyCareersEmail} />
            </Field>
            <Field label="Send them from" hint="Name <address>. The address's domain must be verified in Resend." className="sm:col-span-2">
              <Input name="emailFrom" defaultValue={settings.emailFrom} />
            </Field>
          </div>
        </Card>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </Button>
          {saved && <p className="text-sm text-emerald-800">Saved. The website shows the new details now.</p>}
        </div>
      </form>
    </div>
  );
}
