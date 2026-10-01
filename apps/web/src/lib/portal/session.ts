"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { api, areaOfPath, currentArea, type Area, type SessionUser } from "@/lib/portal/api";

export { areaOfPath, type Area } from "@/lib/portal/api";

/**
 * The signed-in account, shared by the header and the dashboards.
 *
 * There are three areas, each with its own sign-in and its own session, and
 * one person may be signed in to all three at once:
 *
 *   /admin      owners, admins (and editors)          /admin/login
 *   /lawyer     lawyers, owners and admins: their cases /lawyer/login
 *   /dashboard  clients (and the public site's header)  /login
 *
 * So the state is kept per area, and a page reads the area it belongs to.
 * One request per area per page load, however many components ask.
 * `undefined` means "not known yet", `null` means "signed out" — the
 * difference matters, so a guard does not bounce someone to the sign-in page
 * before it knows.
 */

type State = SessionUser | null | undefined;

const states: Record<Area, State> = { admin: undefined, lawyer: undefined, client: undefined };
const inflight: Partial<Record<Area, Promise<void>>> = {};
const listeners = new Set<() => void>();

function emit(area: Area, next: State) {
  states[area] = next;
  listeners.forEach((listener) => listener());
}

export function refreshSession(area: Area = currentArea()): Promise<void> {
  inflight[area] ??= api<{ user: SessionUser | null }>("/auth/me", { area })
    .then((result) => emit(area, result.user))
    .catch(() => emit(area, null))
    .finally(() => {
      delete inflight[area];
    });
  return inflight[area]!;
}

/** The session of the area the current page belongs to. */
export function useSession(): State {
  const area = areaOfPath(usePathname() ?? "/");
  const subscribe = useCallback(
    (listener: () => void) => {
      listeners.add(listener);
      if (states[area] === undefined) void refreshSession(area);
      return () => {
        listeners.delete(listener);
      };
    },
    [area],
  );
  return useSyncExternalStore(subscribe, () => states[area], () => undefined);
}

/** Signs out of this page's area only; the other two stay signed in. */
export async function signOut() {
  const area = currentArea();
  await api("/auth/logout", { method: "POST", area }).catch(() => undefined);
  emit(area, null);
  // A full load, not a client navigation: nothing from the signed-in
  // session should survive in memory.
  window.location.assign(area === "client" ? "/" : LOGIN_PAGE[area]);
}

export function isFirmAdmin(user: State) {
  return user?.kind === "staff" && (user.role === "OWNER" || user.role === "ADMIN");
}

export function areaOf(user: SessionUser): Area {
  if (user.kind === "client") return "client";
  return user.area ?? (user.role === "LAWYER" ? "lawyer" : "admin");
}

const HOMES: Record<Area, string> = { admin: "/admin", lawyer: "/lawyer", client: "/dashboard" };
export const AREA_LABEL: Record<Area, string> = { admin: "admin console", lawyer: "lawyer workspace", client: "client dashboard" };
export const LOGIN_PAGE: Record<Area, string> = { admin: "/admin/login", lawyer: "/lawyer/login", client: "/login" };

/** Where the account's own workspace is. */
export function homeFor(user: SessionUser) {
  return HOMES[areaOf(user)];
}

/** Open another area's sign-in page. Sessions are independent, so nothing is signed out. */
export async function switchTo(area: Area) {
  window.location.assign(LOGIN_PAGE[area]);
}

/** "/lawyer" or "/dashboard": the area the page is in, for links within it. */
export function usePortalBase() {
  const pathname = usePathname();
  return pathname.startsWith("/lawyer") ? "/lawyer" : "/dashboard";
}

/**
 * The account, inside a dashboard or console shell — the shell renders its
 * children only once the session is known, so this never sees undefined.
 */
export function useUser(): SessionUser {
  const user = useSession();
  if (!user) throw new Error("useUser() called outside a signed-in shell.");
  return user;
}
