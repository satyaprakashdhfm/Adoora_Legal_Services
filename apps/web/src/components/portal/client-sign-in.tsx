"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, googleSignInUrl } from "@/lib/portal/api";
import { ErrorNote, GoogleMark } from "@/components/portal/ui";

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
  use_admin_login: "This is a firm account. Firm members sign in at the admin console, not here.",
  not_staff: "This Google account is not a member of the firm. Clients sign in on the client sign-in page.",
  otp_unavailable: "Mobile sign-in is not available right now. Please use Google, or try again later.",
  otp_invalid: "That code could not be verified. Please try again.",
  otp_failed: "We could not complete the mobile sign-in. Please try again.",
  otp_send_failed: "We could not send a code to that number. Please check it and try again.",
  otp_wrong_code: "That code is not right, or it has expired. Please check it or send a new one.",
  phone_not_registered: "This mobile number is not on any client account. Sign in with Google, or ask the firm to add your number.",
  phone_ambiguous: "This mobile number is on more than one account. Please sign in with Google, or contact the firm.",
};

// ---------------------------------------------------------------------------
// MSG91's OTP widget, driven from our own form (exposeMethods: true)
// ---------------------------------------------------------------------------

type Reply = { type?: string; message?: string };
type Callback = (data: Reply) => void;

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
    sendOtp?: (identifier: string, success: Callback, failure: Callback) => void;
    retryOtp?: (channel: string | null, success: Callback, failure: Callback, reqId?: string) => void;
    verifyOtp?: (otp: string, success: Callback, failure: Callback, reqId?: string) => void;
  }
}

type WidgetConfig = { widgetId: string; tokenAuth: string };

/** MSG91's widget script, and the mirror it publishes as a fallback. */
const SCRIPT_URLS = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];

let widgetReady: Promise<void> | null = null;

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

/** Loads the widget once and starts it headless; resolves when its methods exist. */
function ensureWidget(config: WidgetConfig) {
  widgetReady ??= (async () => {
    await loadScript();
    if (!window.initSendOTP) throw new Error("widget");
    window.initSendOTP({
      widgetId: config.widgetId,
      tokenAuth: config.tokenAuth,
      exposeMethods: true,
      success: () => undefined,
      failure: () => undefined,
    });
    for (let waited = 0; !window.sendOtp || !window.verifyOtp; waited += 100) {
      if (waited > 5000) throw new Error("widget");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  })().catch((error: unknown) => {
    widgetReady = null;
    throw error;
  });
  return widgetReady;
}

const RESEND_AFTER = 30;

/**
 * The client sign-in: mobile number and OTP first, Google underneath. Used
 * by the popup the header's Login button opens, and by the /login page.
 *
 * MSG91's widget sends and checks the code; its verified token goes to the
 * API, which confirms it with MSG91 before signing anyone in.
 */
export function ClientSignIn({ next, initialError = null }: { next: string; initialError?: string | null }) {
  const [config, setConfig] = useState<WidgetConfig | null | undefined>(undefined);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [wait, setWait] = useState(0);
  const reqId = useRef<string | undefined>(undefined);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    api<{ otp: WidgetConfig | null }>("/auth/providers")
      .then((result) => live && setConfig(result.otp))
      .catch(() => live && setConfig(null));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  function fail(errorCode: string) {
    setError(errorCode);
    setBusy(false);
  }

  async function sendCode(resend = false) {
    if (!config || !validPhone) return;
    setBusy(true);
    setError(null);
    try {
      await ensureWidget(config);
    } catch {
      fail("otp_unavailable");
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
    if (resend && window.retryOtp) window.retryOtp(null, sent, () => fail("otp_send_failed"), reqId.current);
    else window.sendOtp!(`91${phone}`, sent, () => fail("otp_send_failed"));
  }

  function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (code.length < 4 || !window.verifyOtp) return;
    setBusy(true);
    setError(null);
    window.verifyOtp(
      code,
      async (data) => {
        if (!data?.message) return fail("otp_failed");
        try {
          const result = await api<{ redirect: string }>("/auth/otp", { method: "POST", body: { accessToken: data.message, next } });
          window.location.assign(result.redirect);
        } catch (cause) {
          fail(cause instanceof ApiError && cause.code ? cause.code : "otp_failed");
        }
      },
      () => fail("otp_wrong_code"),
      reqId.current,
    );
  }

  return (
    <div className="text-left">
      {error && (
        <div className="mb-4">
          <ErrorNote>{SIGN_IN_ERRORS[error] ?? "We could not sign you in. Please try again."}</ErrorNote>
          {error === "use_admin_login" && (
            <a href="/admin/login" className="mt-2 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4">
              Go to the admin console sign-in
            </a>
          )}
        </div>
      )}

      {config && step === "phone" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendCode();
          }}
        >
          <label htmlFor="signin-phone" className="text-xs font-semibold text-ink-soft">
            Mobile number
          </label>
          <div className="mt-1.5 flex items-center rounded-lg border border-line-strong bg-white focus-within:border-gold-deep focus-within:ring-2 focus-within:ring-gold/25">
            <span className="border-r border-line px-3 py-2.5 text-sm font-semibold text-ink">+91</span>
            <input
              id="signin-phone"
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
          <button
            type="submit"
            disabled={!validPhone || busy}
            className="mt-3 w-full rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:bg-paper-tint disabled:text-slate"
          >
            {busy ? "Sending…" : "Send OTP"}
          </button>
          <p className="mt-2 text-xs text-slate">We will text you a one-time code. Use the number the firm has on record for you.</p>
        </form>
      )}

      {config && step === "code" && (
        <form onSubmit={verifyCode}>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="signin-code" className="text-xs font-semibold text-ink-soft">
              Code sent to +91 {phone}
            </label>
            <button type="button" onClick={() => setStep("phone")} className="text-xs font-semibold text-gold-deep underline underline-offset-2">
              Change
            </button>
          </div>
          <input
            ref={codeInput}
            id="signin-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter the code"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
            className="mt-1.5 w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-ink outline-none focus:border-gold-deep focus:ring-2 focus:ring-gold/25"
          />
          <button
            type="submit"
            disabled={code.length < 4 || busy}
            className="mt-3 w-full rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:bg-paper-tint disabled:text-slate"
          >
            {busy ? "Checking…" : "Verify and sign in"}
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

      {config && (
        <div className="my-5 flex items-center gap-3 text-xs font-semibold text-slate">
          <span className="h-px flex-1 bg-line" />
          OR
          <span className="h-px flex-1 bg-line" />
        </div>
      )}

      <a
        href={googleSignInUrl(next)}
        className={`flex w-full items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f8f9fa] ${config ? "" : "mt-2"}`}
      >
        <GoogleMark className="h-5 w-5" />
        Continue with Google
      </a>
    </div>
  );
}
