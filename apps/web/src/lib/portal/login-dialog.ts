"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the sign-in popup is open, and where to go after signing in.
 * Any button on the site can open it (`openLogin`); the one dialog mounted
 * in the root layout listens.
 */

type State = { open: false } | { open: true; next: string };

let state: State = { open: false };
const listeners = new Set<() => void>();

function emit(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function openLogin(next = "") {
  emit({ open: true, next });
}

export function closeLogin() {
  emit({ open: false });
}

export function useLoginDialog(): State {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}
