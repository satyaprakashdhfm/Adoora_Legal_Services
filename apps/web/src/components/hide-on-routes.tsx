"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides its children on specific routes.
 *
 * Used to keep the header and footer off `/notice`, which must present no
 * firm information or navigation when a visitor declines the disclaimer, and
 * off the admin console, which has its own full-screen chrome.
 *
 * `routes` match exactly; `prefixes` match a path and everything under it.
 * `children` may be a Server Component — it is rendered on the server and
 * simply not emitted when the route matches.
 */
export function HideOnRoutes({
  routes = [],
  prefixes = [],
  children,
}: {
  routes?: string[];
  prefixes?: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (routes.includes(pathname)) return null;
  if (prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return <>{children}</>;
}
