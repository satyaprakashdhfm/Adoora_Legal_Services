"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides its children on specific routes.
 *
 * Used to keep the header and footer off `/notice`, which must present no
 * firm information or navigation when a visitor declines the disclaimer.
 * `children` may be a Server Component — it is rendered on the server and
 * simply not emitted when the route matches.
 */
export function HideOnRoutes({
  routes,
  children,
}: {
  routes: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (routes.includes(pathname)) return null;

  return <>{children}</>;
}
