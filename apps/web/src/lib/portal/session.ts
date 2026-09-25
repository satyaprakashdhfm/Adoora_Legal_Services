"use client";

import { useSyncExternalStore } from "react";
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

/** Where the account's own workspace is. */
export function homeFor(user: SessionUser) {
  return isFirmAdmin(user) ? "/admin" : "/dashboard";
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
