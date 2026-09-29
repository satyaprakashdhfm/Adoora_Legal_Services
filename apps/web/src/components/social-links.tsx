import { firm } from "@/content/firm";

/**
 * The firm's social profiles: LinkedIn and Instagram. Set the addresses in
 * `content/firm.ts`; a profile with no address is simply not shown.
 *
 * - `ribbon`  small icons in the utility bar above the header
 * - `drawer`  the mobile menu
 * - `footer`  bordered squares in the footer
 */

const PROFILES = [
  {
    name: "LinkedIn",
    href: firm.linkedin,
    path: "M4.6 7.4h2.7V17H4.6zM5.95 3a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM9.2 7.4h2.6v1.3h.04c.36-.66 1.24-1.36 2.56-1.36 2.74 0 3.25 1.7 3.25 3.9V17h-2.7v-4.24c0-1.01-.02-2.31-1.45-2.31-1.45 0-1.67 1.1-1.67 2.24V17H9.2z",
    fill: true,
  },
  {
    name: "Instagram",
    href: firm.instagram,
    path: "M6.5 2.75h7a3.75 3.75 0 013.75 3.75v7a3.75 3.75 0 01-3.75 3.75h-7a3.75 3.75 0 01-3.75-3.75v-7A3.75 3.75 0 016.5 2.75zM10 6.6a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8zM14.4 5.35h.01",
    fill: false,
  },
].filter((profile) => profile.href);

export const hasSocialLinks = PROFILES.length > 0;

export function SocialLinks({ variant }: { variant: "ribbon" | "drawer" | "footer" }) {
  if (!hasSocialLinks) return null;

  const link =
    variant === "footer"
      ? "inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 transition hover:border-gold hover:text-gold-bright"
      : variant === "drawer"
        ? "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/80 transition hover:text-gold-bright"
        : "inline-flex items-center transition hover:text-gold-bright";
  const size = variant === "ribbon" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={`flex items-center ${variant === "ribbon" ? "gap-3" : "gap-2"}`}>
      {PROFILES.map((profile) => (
        <a key={profile.name} href={profile.href} target="_blank" rel="noreferrer noopener" className={link} aria-label={`${firm.name} on ${profile.name}`}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className={size}>
            {profile.fill ? (
              <path d={profile.path} fill="currentColor" />
            ) : (
              <path d={profile.path} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </a>
      ))}
    </div>
  );
}
