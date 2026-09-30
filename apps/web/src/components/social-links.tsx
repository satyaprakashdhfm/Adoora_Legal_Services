import { firm } from "@/content/firm";

/**
 * The firm's social profiles: LinkedIn and Instagram, and in the footer
 * WhatsApp too (the firm's own number, via wa.me). Set the LinkedIn and
 * Instagram addresses in `content/firm.ts`.
 *
 * - `ribbon`  small icons in the utility bar above the header
 * - `drawer`  the mobile menu
 * - `footer`  bordered squares in the footer, under the email address
 *
 * The ribbon and drawer leave out a profile with no address. The footer
 * always shows all three; one without an address yet is drawn but is not
 * a link, so nothing points at a dead page.
 */

type Profile = {
  name: string;
  href: string;
  path: string;
  fill: boolean;
  viewBox?: string;
};

const ALL_PROFILES: Profile[] = [
  {
    name: "LinkedIn",
    href: firm.linkedin,
    path: "M4.6 7.4h2.7V17H4.6zM5.95 3a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM9.2 7.4h2.6v1.3h.04c.36-.66 1.24-1.36 2.56-1.36 2.74 0 3.25 1.7 3.25 3.9V17h-2.7v-4.24c0-1.01-.02-2.31-1.45-2.31-1.45 0-1.67 1.1-1.67 2.24V17H9.2z",
    fill: true,
  },
  {
    name: "WhatsApp",
    href: `https://wa.me/${firm.phoneE164.replace(/^\+/, "")}`,
    viewBox: "0 0 24 24",
    path: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.12-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42z",
    fill: true,
  },
  {
    name: "Instagram",
    href: firm.instagram,
    path: "M6.5 2.75h7a3.75 3.75 0 013.75 3.75v7a3.75 3.75 0 01-3.75 3.75h-7a3.75 3.75 0 01-3.75-3.75v-7A3.75 3.75 0 016.5 2.75zM10 6.6a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8zM14.4 5.35h.01",
    fill: false,
  },
];

/* The ribbon and drawer: LinkedIn and Instagram, when they have addresses. */
const PROFILES = ALL_PROFILES.filter(
  (profile) => profile.name !== "WhatsApp" && profile.href,
);

export const hasSocialLinks = PROFILES.length > 0;

export function SocialLinks({ variant }: { variant: "ribbon" | "drawer" | "footer" }) {
  if (variant !== "footer" && !hasSocialLinks) return null;

  const link =
    variant === "footer"
      ? "inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 transition hover:border-gold hover:text-gold-bright"
      : variant === "drawer"
        ? "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/80 transition hover:text-gold-bright"
        : "inline-flex items-center transition hover:text-gold-bright";
  const size = variant === "ribbon" ? "h-3.5 w-3.5" : "h-4 w-4";

  const profiles = variant === "footer" ? ALL_PROFILES : PROFILES;

  return (
    <div className={`flex items-center ${variant === "ribbon" ? "gap-3" : "gap-2"}`}>
      {profiles.map((profile) => {
        const icon = (
          <svg viewBox={profile.viewBox ?? "0 0 20 20"} aria-hidden="true" className={size}>
            {profile.fill ? (
              <path d={profile.path} fill="currentColor" />
            ) : (
              <path d={profile.path} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        );

        return profile.href ? (
          <a key={profile.name} href={profile.href} target="_blank" rel="noreferrer noopener" className={link} aria-label={`${firm.name} on ${profile.name}`}>
            {icon}
          </a>
        ) : (
          <span key={profile.name} className={link} title={`${profile.name} — coming soon`} aria-label={`${profile.name} (coming soon)`} role="img">
            {icon}
          </span>
        );
      })}
    </div>
  );
}
