"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/portal/api";

type WidgetConfig = { widgetId: string; tokenAuth: string };

type Msg91Reply = { type?: string; message?: string };

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
  }
}

/** MSG91's widget script, and the mirror it publishes as a fallback. */
const SCRIPT_URLS = ["https://verify.msg91.com/otp-provider.js", "https://verify.phone91.com/otp-provider.js"];

/** Loads MSG91's widget script once per page, trying the mirror if needed. */
let scriptPromise: Promise<void> | null = null;
function loadWidgetScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    let index = 0;
    const attempt = () => {
      const script = document.createElement("script");
      script.src = SCRIPT_URLS[index]!;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        index += 1;
        if (index < SCRIPT_URLS.length) attempt();
        else {
          scriptPromise = null;
          reject(new Error("script"));
        }
      };
      document.head.appendChild(script);
    };
    attempt();
  });
  return scriptPromise;
}

/**
 * "Continue with mobile OTP" — MSG91's widget takes the number and checks
 * the code in its own dialog, then gives us an access token. The API
 * confirms that token with MSG91 (with the secret authkey, which never
 * reaches the browser) and signs the client in.
 *
 * Renders nothing until the API reports the widget as configured.
 */
export function OtpSignIn({ next, onError }: { next: string; onError: (code: string | null) => void }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    api<{ otp: WidgetConfig | null }>("/auth/providers")
      .then((result) => live && setConfig(result.otp))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (!config) return null;

  async function signInWith(accessToken: string) {
    try {
      const result = await api<{ redirect: string }>("/auth/otp", { method: "POST", body: { accessToken, next } });
      window.location.assign(result.redirect);
    } catch (cause) {
      onError(cause instanceof ApiError && cause.code ? cause.code : "otp_failed");
      setBusy(false);
    }
  }

  async function start() {
    if (!config) return;
    setBusy(true);
    onError(null);
    try {
      await loadWidgetScript();
      if (!window.initSendOTP) throw new Error("widget");
      window.initSendOTP({
        widgetId: config.widgetId,
        tokenAuth: config.tokenAuth,
        exposeMethods: false,
        success: (data: Msg91Reply) => {
          if (data?.message) void signInWith(data.message);
          else {
            onError("otp_failed");
            setBusy(false);
          }
        },
        failure: () => {
          onError("otp_failed");
          setBusy(false);
        },
      });
      // The widget shows its own dialog; closing it without finishing fires
      // neither callback, so the button is freed again shortly.
      window.setTimeout(() => setBusy(false), 4000);
    } catch {
      onError("otp_unavailable");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={busy}
      className="mt-3 flex w-full items-center justify-center gap-3 rounded-md border border-line-strong bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper-warm disabled:opacity-60"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 text-gold-deep">
        <path d="M6.5 2.5h7a1 1 0 011 1v13a1 1 0 01-1 1h-7a1 1 0 01-1-1v-13a1 1 0 011-1zM9 15h2" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
      {busy ? "Opening…" : "Continue with mobile OTP"}
    </button>
  );
}
