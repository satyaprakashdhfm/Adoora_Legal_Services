"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, googleSignInUrl, type Area } from "@/lib/portal/api";
import { refreshSession } from "@/lib/portal/session";
import { Button, ErrorNote, GoogleMark } from "@/components/portal/ui";
import { PASSWORD_ONLY, SHOW_TEST_LOGINS, TEST_LOGINS, type TestLogin } from "@/lib/portal/sign-in-mode";

/** What went wrong, in words a client can act on. Shown only after a failed attempt. */
export const SIGN_IN_ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in is not switched on yet. Please try again later.",
  google_cancelled: "Sign-in was cancelled. You can try again whenever you are ready.",
  google_state: "That sign-in link had expired. Please try again.",
  google_failed: "We could not complete the sign-in with Google. Please try again.",
  google_exchange_failed: "Google did not accept the sign-in. Please try again.",
  google_nonce_mismatch: "The sign-in could not be verified. Please try again.",
  google_no_id_token: "Google did not return your identity. Please try again.",
  google_email_unverified: "Your Google account's email address is not verified with Google.",
  account_inactive: "This account has been deactivated. Please contact the firm.",
  account_mismatch: "This email is linked to a different Google account. Sign in with that account, or contact the firm.",
  signup_closed: "New accounts are created by the firm. Please contact us and we will set one up for you.",
  client_not_registered:
    "You are not registered as a client yet. Please contact us first: once you are onboarded, the firm will give you access to the client portal.",
  use_admin_login: "This account is an owner's or administrator's. Please sign in at the admin console.",
  use_lawyer_login: "Lawyers sign in on the lawyer sign-in page.",
  not_staff: "This email is not registered with the firm. Please ask the firm's administrator to add you, or sign in as a client.",
  staff_not_registered: "This email or mobile number is not registered with the firm. Please ask the firm's administrator to add it on the Team page.",
  not_allowed_here: "Your firm account does not have access to this sign-in. Please ask the firm's administrator.",
  otp_unavailable: "Mobile sign-in is not available right now. Please use Google, or try again later.",
  otp_invalid: "That code could not be verified. Please try again.",
  otp_failed: "We could not complete the mobile sign-in. Please try again.",
  otp_send_failed: "We could not send a code to that number. Please check it and try again.",
  otp_captcha: "Please complete the check below the number, then press Send OTP again.",
  otp_wrong_code: "That code is not right, or it has expired. Please check it or send a new one.",
  phone_not_registered: "This mobile number is not on any client account. Please contact us and the firm will add it.",
  phone_ambiguous: "This mobile number is already on an account. Please sign in with Google, or contact the firm.",
  phone_in_use: "That number is already on another account. Please use a different number, or contact the firm.",
  signup_expired: "That took a little too long. Please verify your number again.",
  email_taken: "This email already has an account. Sign in with Google using it — you can add your mobile number after.",
};

// ---------------------------------------------------------------------------
// MSG91's OTP widget, driven from our own form (exposeMethods: true)
// ---------------------------------------------------------------------------

type Reply = { type?: string; message?: string; code?: string | number };
type Callback = (data: Reply) => void;

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
    sendOtp?: (identifier: string, success: Callback, failure: Callback) => void;
    retryOtp?: (channel: string | null, success: Callback, failure: Callback, reqId?: string) => void;
    verifyOtp?: (otp: string, success: Callback, failure: Callback, reqId?: string) => void;
    isCaptchaVerified?: () => boolean;
  }
}

type WidgetConfig = { widgetId: string; tokenAuth: string };

/** MSG91's widget script, and the mirror it publishes as a fallback. */
const SCRIPT_URLS = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];

let scriptLoaded: Promise<void> | null = null;

function loadScript(index = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URLS[index]!;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      if (index + 1 < SCRIPT_URLS.length) loadScript(index + 1).then(resolve, reject);
      else reject(new Error("script"));
    };
    document.head.appendChild(script);
  });
}

/**
 * Where MSG91 draws its captcha, when the widget has captcha switched on in
 * the MSG91 dashboard. Empty otherwise.
 */
const CAPTCHA_ID = "msg91-captcha";

/**
 * Starts the widget headless for one form; resolves when its methods exist.
 * The script loads once per page, but each form (the popup, reopened, or the
 * /login page) starts the widget again, so the captcha is drawn into the
 * captcha box that is on screen now.
 */
function ensureWidget(ref: { current: Promise<void> | null }, config: WidgetConfig) {
  ref.current ??= (async () => {
    scriptLoaded ??= loadScript().catch((error: unknown) => {
      scriptLoaded = null;
      throw error;
    });
    await scriptLoaded;
    if (!window.initSendOTP) throw new Error("widget");
    window.initSendOTP({
      widgetId: config.widgetId,
      tokenAuth: config.tokenAuth,
      exposeMethods: true,
      captchaRenderId: CAPTCHA_ID,
      success: () => undefined,
      failure: () => undefined,
    });
    for (let waited = 0; !window.sendOtp || !window.verifyOtp; waited += 100) {
      if (waited > 5000) throw new Error("widget");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  })().catch((error: unknown) => {
    ref.current = null;
    throw error;
  });
  return ref.current;
}

const RESEND_AFTER = 30;

/** Someone who is not a client yet: off to the Contact page, after a moment to read why. */
const CONTACT_AFTER_MS = 6000;

/**
 * Not an error so much as a next step, so it reads as a calm notice in the
 * site's sand and gold rather than a red warning.
 */
function NotRegistered() {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setTimeout(() => router.push("/contact"), CONTACT_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [router]);
  return (
    <div role="status" className="rounded-xl border border-sand-line bg-sand-wash px-4 py-4 text-left sm:px-5">
      <p className="font-serif text-base font-semibold text-ink">Not registered as a client yet</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        Please contact us first. Once you are onboarded, the firm will give you access to the client portal.
      </p>
      <a
        href="/contact"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright active:translate-y-px"
      >
        Contact us
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
          <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <p className="mt-2.5 text-xs text-slate">Taking you to the Contact page in a few seconds.</p>
    </div>
  );
}

const errorCode = (cause: unknown) => (cause instanceof ApiError && cause.code ? cause.code : "otp_failed");

function useWidgetConfig() {
  const [config, setConfig] = useState<WidgetConfig | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    api<{ otp: WidgetConfig | null }>("/auth/providers")
      .then((result) => live && setConfig(result.otp))
      .catch(() => live && setConfig(null));
    return () => {
      live = false;
    };
  }, []);
  return config;
}

function ErrorBlock({ error, detail }: { error: string | null; detail?: string | null }) {
  if (!error) return null;
  if (error === "client_not_registered") {
    return (
      <div className="mb-4">
        <NotRegistered />
      </div>
    );
  }
  return (
    <div className="mb-4">
      <ErrorNote>{SIGN_IN_ERRORS[error] ?? "We could not sign you in. Please try again."}</ErrorNote>
      {detail && <p className="mt-1.5 text-xs text-slate">MSG91: {detail}</p>}
      {error === "use_admin_login" && (
        <a href="/admin/login" className="mt-2 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4">
          Go to the admin console sign-in
        </a>
      )}
    </div>
  );
}

const primaryButton =
  "mt-3 w-full rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:bg-paper-tint disabled:text-slate";

/**
 * Proves a mobile number with MSG91's OTP widget: number, Send OTP, code,
 * Verify. Hands the widget's access token to `onVerified`, whose errors
 * (ApiError codes) are shown here. Used for signing in and for adding a
 * number after a Google sign-in.
 *
 * `beforeSend` runs before any code is texted; if it throws (an unregistered
 * number, say), its error is shown and nothing is sent.
 */
function PhoneOtp({
  config,
  onVerified,
  beforeSend,
  verifyLabel,
  hint,
}: {
  config: WidgetConfig;
  onVerified: (accessToken: string) => Promise<void>;
  beforeSend?: (phone: string) => Promise<void>;
  verifyLabel: string;
  hint: string;
}) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** MSG91's own words for a failure in the browser, shown under ours. */
  const [detail, setDetail] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const reqId = useRef<string | undefined>(undefined);
  const codeInput = useRef<HTMLInputElement>(null);
  const widget = useRef<Promise<void> | null>(null);

  // Start the widget as soon as the form is on screen, so its captcha (if
  // switched on) is already there before the first press of Send OTP.
  useEffect(() => {
    void ensureWidget(widget, config).catch(() => undefined);
  }, [config]);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  function fail(code: string, reply?: Reply) {
    setError(code);
    const reason = typeof reply?.message === "string" ? reply.message.slice(0, 160) : null;
    setDetail(reason ? `${reason}${reply?.code ? ` (code ${reply.code})` : ""}` : null);
    if (reply) console.warn("MSG91:", reply);
    setBusy(false);
  }

  async function sendCode(resend = false) {
    if (!validPhone) return;
    setBusy(true);
    setError(null);
    setDetail(null);
    if (!resend && beforeSend) {
      try {
        await beforeSend(phone);
      } catch (cause) {
        fail(errorCode(cause));
        return;
      }
    }
    try {
      await ensureWidget(widget, config);
    } catch {
      fail("otp_unavailable");
      return;
    }
    // Only when MSG91 has actually drawn a captcha (it is off by setting).
    const captchaShown = Boolean(document.getElementById(CAPTCHA_ID)?.childElementCount);
    if (!resend && captchaShown && window.isCaptchaVerified && !window.isCaptchaVerified()) {
      setError("otp_captcha");
      setBusy(false);
      return;
    }
    const sent: Callback = (data) => {
      if (!resend) reqId.current = data?.message;
      setStep("code");
      setCode("");
      setWait(RESEND_AFTER);
      setBusy(false);
      window.setTimeout(() => codeInput.current?.focus(), 50);
    };
    const failed: Callback = (reply) => fail("otp_send_failed", reply);
    if (resend && window.retryOtp) window.retryOtp(null, sent, failed, reqId.current);
    else window.sendOtp!(`91${phone}`, sent, failed);
  }

  function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (code.length < 4 || !window.verifyOtp) return;
    setBusy(true);
    setError(null);
    setDetail(null);
    window.verifyOtp(
      code,
      async (data) => {
        if (!data?.message) return fail("otp_failed");
        try {
          await onVerified(data.message);
          setBusy(false);
        } catch (cause) {
          fail(errorCode(cause));
        }
      },
      (reply) => fail("otp_wrong_code", reply),
      reqId.current,
    );
  }

  return (
    <div>
      <ErrorBlock error={error} detail={detail} />
      {step === "phone" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendCode();
          }}
        >
          <label htmlFor="otp-phone" className="text-xs font-semibold text-ink-soft">
            Mobile number
          </label>
          <div className="mt-1.5 flex items-center rounded-lg border border-line-strong bg-white focus-within:border-gold-deep focus-within:ring-2 focus-within:ring-gold/25">
            <span className="border-r border-line px-3 py-2.5 text-sm font-semibold text-ink">+91</span>
            <input
              id="otp-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Mobile number"
              maxLength={10}
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
              className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-slate-light"
            />
          </div>
          {/* MSG91's captcha, if it has one switched on. */}
          <div id={CAPTCHA_ID} className="mt-3 empty:hidden" />
          <button type="submit" disabled={!validPhone || busy} className={primaryButton}>
            {busy ? "Sending…" : "Send OTP"}
          </button>
          <p className="mt-2 text-xs text-slate">{hint}</p>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="otp-code" className="text-xs font-semibold text-ink-soft">
              Code sent to +91 {phone}
            </label>
            <button type="button" onClick={() => setStep("phone")} className="text-xs font-semibold text-gold-deep underline underline-offset-2">
              Change
            </button>
          </div>
          <input
            ref={codeInput}
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter the code"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
            className="mt-1.5 w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-ink outline-none focus:border-gold-deep focus:ring-2 focus:ring-gold/25"
          />
          <button type="submit" disabled={code.length < 4 || busy} className={primaryButton}>
            {busy ? "Checking…" : verifyLabel}
          </button>
          <p className="mt-2 text-xs text-slate">
            {wait > 0 ? (
              `Didn’t get it? You can resend in ${wait}s.`
            ) : (
              <button type="button" onClick={() => void sendCode(true)} disabled={busy} className="font-semibold text-gold-deep underline underline-offset-2">
                Resend code
              </button>
            )}
          </p>
        </form>
      )}
    </div>
  );
}

/**
 * The sign-in form for any of the three areas: a mobile OTP, or Google. Used
 * by the popup the header's Login button opens and by the three login pages.
 *
 * - client (the default): only clients the firm has added (Admin console →
 *   Clients). Anyone else is sent to the Contact page.
 * - lawyer, admin: only an email or mobile number registered on the Team
 *   page, with a role allowed there.
 *
 * Nothing is created by signing in, and a number that would not sign in is
 * refused before any code is texted to it.
 */
const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-slate-light focus:border-gold-deep focus:ring-2 focus:ring-gold/25";

/** The temporary username and password sign-in (see lib/portal/sign-in-mode.ts). */
function PasswordSignIn({ next, audience }: { next: string; audience: Area }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api<{ redirect?: string }>("/auth/login", {
        method: "POST",
        body: { username, password, next, audience },
        area: audience,
      });
      if (result.redirect) window.location.assign(result.redirect);
    } catch (cause) {
      setError(cause instanceof ApiError && cause.code === "invalid_credentials" ? "That username or password is not right." : (cause as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && (
        <div className="mb-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      <label htmlFor="signin-username" className="text-xs font-semibold text-ink-soft">
        Username
      </label>
      <input
        id="signin-username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder={audience === "client" ? "e.g. kiran.client" : `e.g. name.${audience}`}
        className={fieldClass}
      />
      <div className="mt-4 flex items-baseline justify-between">
        <label htmlFor="signin-password" className="text-xs font-semibold text-ink-soft">
          Password
        </label>
        <button type="button" onClick={() => setShow((value) => !value)} className="text-xs font-semibold text-gold-deep underline underline-offset-2">
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <input
        id="signin-password"
        type={show ? "text" : "password"}
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className={fieldClass}
      />
      <button type="submit" disabled={!username.trim() || !password || busy} className={`${primaryButton} mt-5`}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-2 text-xs text-slate">Use the username and password the firm gave you for this page.</p>
      {SHOW_TEST_LOGINS && (
        <TestLogins
          audience={audience}
          onPick={(login) => {
            setUsername(login.username);
            setPassword(login.password);
            setShow(true);
            setError(null);
          }}
        />
      )}
    </form>
  );
}

/** Testing only: this page's logins, each one tap to fill the form. */
function TestLogins({ audience, onPick }: { audience: Area; onPick: (login: TestLogin) => void }) {
  const logins = TEST_LOGINS.filter((login) => login.area === audience);
  if (!logins.length) return null;
  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="text-xs font-semibold text-ink-soft">Test logins</p>
      <p className="mt-0.5 text-xs text-slate">Tap your name to fill the form, then Sign in.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {logins.map((login) => (
          <button
            key={login.username}
            type="button"
            onClick={() => onPick(login)}
            className="rounded-lg border border-line-strong bg-paper px-3 py-2.5 text-left transition hover:border-gold-deep active:scale-[0.98]"
          >
            <span className="block font-serif text-sm font-semibold text-navy">{login.name}</span>
            <span className="mt-1 block font-mono text-[11px] leading-relaxed text-ink-soft">
              {login.username}
              <br />
              {login.password}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ClientSignIn({
  next,
  initialError = null,
  audience = "client",
}: {
  next: string;
  initialError?: string | null;
  audience?: Area;
}) {
  if (PASSWORD_ONLY) {
    return (
      <div className="text-left">
        <ErrorBlock error={initialError} />
        <PasswordSignIn next={next} audience={audience} />
      </div>
    );
  }
  return <OtpOrGoogleSignIn next={next} initialError={initialError} audience={audience} />;
}

function OtpOrGoogleSignIn({ next, initialError, audience }: { next: string; initialError: string | null; audience: Area }) {
  const config = useWidgetConfig();
  const firm = audience !== "client";

  /** Only a number registered for this page is sent a code. */
  async function checkNumber(phone: string) {
    await api("/auth/otp/check", { method: "POST", body: { phone, audience }, area: audience });
  }

  async function signIn(accessToken: string) {
    const result = await api<{ redirect?: string }>("/auth/otp", {
      method: "POST",
      body: { accessToken, next, audience },
      area: audience,
    });
    if (result.redirect) window.location.assign(result.redirect);
  }

  return (
    <div className="text-left">
      <ErrorBlock error={initialError} />
      {config && (
        <>
          <PhoneOtp
            config={config}
            onVerified={signIn}
            beforeSend={checkNumber}
            verifyLabel="Verify and continue"
            hint={
              firm
                ? "Use the mobile number registered with the firm. We will text you a one-time code."
                : "Use the mobile number you gave the firm. We will text you a one-time code."
            }
          />
          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-slate">
            <span className="h-px flex-1 bg-line" />
            OR
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <a
        href={googleSignInUrl(next, audience)}
        className={`flex w-full items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f8f9fa] ${config ? "" : "mt-2"}`}
      >
        <GoogleMark className="h-5 w-5" />
        Continue with Google
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// After a Google sign-in: ask for the mobile number
// ---------------------------------------------------------------------------

const LATER_KEY = "adoora.phonePrompt.later";

function askedLater() {
  try {
    return window.sessionStorage.getItem(LATER_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Shown on the client dashboard when the account has no mobile number (a
 * Google sign-in): verify one by OTP. "Later" hides it until the next visit.
 */
export function PhonePrompt() {
  return PASSWORD_ONLY ? null : <PhonePromptDialog />;
}

function PhonePromptDialog() {
  const config = useWidgetConfig();
  const [dismissed, setDismissed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = Boolean(config) && !dismissed;

  useEffect(() => {
    if (!open) return;
    if (askedLater()) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
  }, [open]);

  if (!open) return null;

  function later() {
    try {
      window.sessionStorage.setItem(LATER_KEY, "1");
    } catch {
      // Private mode: it simply asks again on the next page load.
    }
    dialog.current?.close();
    setDismissed(true);
  }

  async function save(accessToken: string) {
    await api("/auth/me/phone", { method: "POST", body: { accessToken } });
    await refreshSession();
    dialog.current?.close();
    setDismissed(true);
  }

  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        later();
      }}
      aria-label="Add your mobile number"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink-deep/60"
    >
      <div className="px-6 pb-6 pt-6 sm:px-8">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">Add your mobile number</h2>
        <p className="mb-5 mt-1 text-sm text-slate">So the firm can reach you about your case, and so you can sign in with an OTP next time.</p>
        <PhoneOtp config={config!} onVerified={save} verifyLabel="Verify and save" hint="We will text you a one-time code to confirm it is yours." />
        <Button tone="ghost" size="sm" className="mt-3 w-full" onClick={later}>
          Later
        </Button>
      </div>
    </dialog>
  );
}
