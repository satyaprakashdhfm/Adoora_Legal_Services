/**
 * Minimal first-party cookie helpers.
 *
 * Deliberately not localStorage: the disclaimer acknowledgement and cookie
 * preferences need to be readable by the server later (for audit and for
 * gating server-rendered content if that is ever required), and the client
 * asked specifically for a first-party cookie.
 */

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

export function writeCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${
    maxAgeDays * 24 * 60 * 60
  }; SameSite=Lax${secure}`;
}

export type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp, kept so the choice can be evidenced. */
  at: string;
};

export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed.analytics !== "boolean") return null;

    return {
      essential: true,
      analytics: parsed.analytics,
      marketing: Boolean(parsed.marketing),
      at: typeof parsed.at === "string" ? parsed.at : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
