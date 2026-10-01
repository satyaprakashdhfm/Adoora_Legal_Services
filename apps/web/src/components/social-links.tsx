import { firm } from "@/content/firm";

/**
 * The firm's social profiles: LinkedIn and Instagram, and in the footer
 * WhatsApp too (the firm's own number, via wa.me). Set the LinkedIn and
 * Instagram addresses in `content/firm.ts`.
 *
 * - `ribbon`  small icons in the utility bar above the header
 * - `drawer`  the mobile menu
 * - `footer`  the full-colour brand marks, under the footer's email address
 *
 * All three places always show their marks (the ribbon and drawer
 * LinkedIn and Instagram, the footer WhatsApp as well); one without an
 * address yet is drawn but is not a link, so nothing points at a dead page.
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

/* The ribbon and drawer: LinkedIn and Instagram. */
const PROFILES = ALL_PROFILES.filter((profile) => profile.name !== "WhatsApp");

export const hasSocialLinks = PROFILES.length > 0;

export function SocialLinks({ variant }: { variant: "ribbon" | "drawer" | "footer" }) {
  if (variant !== "footer" && !hasSocialLinks) return null;

  const link =
    variant === "drawer"
        ? "inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/80 transition hover:text-gold-bright"
        : "inline-flex items-center transition hover:text-gold-bright";
  const size = variant === "ribbon" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (variant === "footer") return <FooterBrandIcons />;

  const profiles = PROFILES;

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
          <span key={profile.name} className={link} title={`${profile.name} (coming soon)`} aria-label={`${profile.name} (coming soon)`} role="img">
            {icon}
          </span>
        );
      })}
    </div>
  );
}

/*
 * The footer's row: each network's own mark in its own colours, with no
 * frame around it. A profile with no address yet is drawn but not linked.
 */
const brandMarks: Record<string, React.JSX.Element> = {
  LinkedIn: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M6.94 9.5H4.8V19h2.14zM5.87 5a1.24 1.24 0 100 2.48A1.24 1.24 0 005.87 5zM19.2 13.4c0-2.55-1.36-3.74-3.17-3.74a2.74 2.74 0 00-2.48 1.37V9.5h-2.14V19h2.14v-4.7c0-1.24.23-2.44 1.77-2.44 1.52 0 1.54 1.42 1.54 2.52V19h2.14z"
      />
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        fill="#fff"
        d="M16.7 14.1c-.23-.12-1.37-.68-1.58-.75-.21-.08-.37-.12-.52.11-.15.23-.6.75-.73.9-.13.16-.27.18-.5.06-.23-.12-.98-.36-1.86-1.15-.69-.61-1.15-1.37-1.29-1.6-.13-.23-.01-.36.1-.47.1-.1.23-.27.35-.4.12-.14.15-.23.23-.39.08-.15.04-.29-.02-.4-.06-.12-.52-1.25-.71-1.72-.19-.45-.38-.39-.52-.4h-.45c-.15 0-.4.06-.61.29-.21.23-.8.79-.8 1.93s.82 2.24.94 2.39c.12.15 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.18 1.06.15 1.46.09.44-.07 1.37-.56 1.56-1.1.19-.54.19-1 .14-1.1-.06-.1-.21-.15-.44-.27zM12.04 19.3h-.01a7.3 7.3 0 01-3.72-1.02l-.27-.16-2.77.73.74-2.7-.17-.28a7.3 7.3 0 1113.52-3.87 7.3 7.3 0 01-7.32 7.3z"
      />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <defs>
        <radialGradient id="footer-ig" cx="0.3" cy="1.07" r="1.15">
          <stop offset="0" stopColor="#FDDC5C" />
          <stop offset="0.25" stopColor="#FD9A3B" />
          <stop offset="0.5" stopColor="#E1306C" />
          <stop offset="0.8" stopColor="#C13584" />
          <stop offset="1" stopColor="#5851DB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#footer-ig)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="3.8" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16" cy="8" r="0.95" fill="#fff" />
    </svg>
  ),
};

function FooterBrandIcons() {
  return (
    <div className="flex items-center gap-3">
      {ALL_PROFILES.map((profile) => {
        const mark = brandMarks[profile.name];
        return profile.href ? (
          <a
            key={profile.name}
            href={profile.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${firm.name} on ${profile.name}`}
            className="inline-flex rounded-md transition hover:-translate-y-0.5 hover:opacity-90"
          >
            {mark}
          </a>
        ) : (
          <span
            key={profile.name}
            role="img"
            title={`${profile.name} (coming soon)`}
            aria-label={`${profile.name} (coming soon)`}
            className="inline-flex"
          >
            {mark}
          </span>
        );
      })}
    </div>
  );
}
