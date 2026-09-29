"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { api, type SessionUser } from "@/lib/portal/api";

/**
 * The signed-in account, shared by the header and the dashboards.
 *
 * One request per page load, however many components ask: the first caller
 * starts it and everyone subscribes to the same result. `undefined` means
 * "not known yet", `null` means "signed out" — the difference matters, so a
 * guard does not bounce someone to the sign-in page before it knows.
 */

type State = SessionUser | null | undefined;

let state: State = undefined;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function refreshSession(): Promise<void> {
  inflight ??= api<{ user: SessionUser | null }>("/auth/me")
    .then((result) => emit(result.user))
    .catch(() => emit(null))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (state === undefined) void refreshSession();
  return () => listeners.delete(listener);
}

export function useSession(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => undefined,
  );
}

export async function signOut() {
  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
  emit(null);
  // A full load, not a client navigation: nothing from the signed-in
  // session should survive in memory.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/");
}

export function isFirmAdmin(user: State) {
  return user?.kind === "staff" && (user.role === "OWNER" || user.role === "ADMIN");
}

/**
 * The three signed-in areas, each with its own sign-in page:
 *
 *   /admin      owners, admins (and editors)   /admin/login
 *   /lawyer     lawyers — their assigned cases /lawyer/login
 *   /dashboard  clients                        /login
 */
export type Area = "admin" | "lawyer" | "client";

export function areaOf(user: SessionUser): Area {
  if (user.kind === "client") return "client";
  return user.role === "LAWYER" ? "lawyer" : "admin";
}

const HOMES: Record<Area, string> = { admin: "/admin", lawyer: "/lawyer", client: "/dashboard" };
export const AREA_LABEL: Record<Area, string> = { admin: "admin console", lawyer: "lawyer workspace", client: "client dashboard" };
export const LOGIN_PAGE: Record<Area, string> = { admin: "/admin/login", lawyer: "/lawyer/login", client: "/login" };

/** Where the account's own workspace is. */
export function homeFor(user: SessionUser) {
  return HOMES[areaOf(user)];
}

/** The area a path belongs to. */
export function areaOfPath(pathname: string): Area {
  return pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/lawyer") ? "lawyer" : "client";
}

/** Sign out, then open another area's sign-in page — for switching accounts. */
export async function switchTo(area: Area) {
  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
  emit(null);
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
