# Static assets

## The mark

`adoora-mark.png` — the firm's triangular "A" mark, flattened to a single gold
(`#C88A4E`) silhouette on a transparent ground. Generated from
`resources/als logo A.png`; the cut-outs deliberately show whatever sits behind
them, exactly as the letterhead uses it.

## Hero photography

One frame per hero slide, cross-fading as the copy rotates. The slides and the
file names live in `src/content/hero-slides.ts`.

| Base name | Slide | The photograph |
| --- | --- | --- |
| `hero-office-desk` | Corporate & M&A | Office desk with laptop and contract folder, city skyline beyond, PEOPLE / PRINCIPLES / POSSIBILITIES on the wall. |
| `hero-law-justice` | Dispute Resolution | Brass scales of justice on bound LAW and JUSTICE volumes. |
| `hero-shield-compliance` | Banking & Finance | Brass shield and padlock against a Lady Justice figure, beside REGULATORY COMPLIANCE / ASSET PROTECTION / RISK MANAGEMENT volumes. |

**The extension does not matter.** `src/lib/public-image.ts` resolves the base
name against `.png`, `.jpg`, `.jpeg`, `.webp` and `.avif` at build time, so save
the file however it exports. A frame that is missing simply falls back to the
navy gradient for that slide — nothing breaks.

What the framing needs to do: keep the subject on the **right**. The navy wash
covers the left half, where the headline and buttons sit, so anything important
on that side is lost. Landscape, at least 1920px wide.

A bright frame gets an extra scrim so it stays on brand against the navy bands
— set `bright: true` on that slide in `src/content/hero-slides.ts`.

## Careers photography

`careers-office` — the frame behind the careers teaser on the home page,
resolved by the same `publicImage` helper, so the extension does not matter
and a missing file falls back to the navy gradient.

What the framing needs to do: keep the subject on the **right**. The navy wash
runs solid down the left of the panel, where the heading, buttons and the
PEOPLE / IDEAS / IMPACT triad sit. Portrait or square crops best — the panel is
roughly a third of the row and as tall as the locations beside it.

## Why-us photography

Four frames behind the cards in the "Why partner with us?" band, one per entry
in `differentiators` (`src/content/firm.ts`), which names its own file:

| File | Card |
| --- | --- |
| `why-us-expertise.png` | Proven Legal Expertise |
| `why-us-client-first.png` | Client-First Approach |
| `why-us-cross-border.png` | Cross-Border & Regulatory Mastery |
| `why-us-solutions.png` | Strategic Legal Solutions |

The cards are portrait and the frames landscape, so `cover` crops the sides.
Each entry carries a `focus` value — a CSS `object-position` — to keep the
subject in shot; adjust that rather than re-cropping the file. A navy gradient
runs up from the bottom of the card behind the text, held back to the lower
half so the photograph still reads.

## Insight photography

One frame per article, named by `image` on that article in
`src/content/insights.ts`: `insight-digital-lending.png`,
`insight-title-report.png`, `insight-non-compete.png`. An article without an
`image` falls back to the drawn composition in `insight-artwork.tsx` — nothing
breaks, so add them as they arrive. Cards are 16:9 and crop to the centre.

## App icons

`src/app/icon.png` and `src/app/apple-icon.png`. Next.js picks those up from the
`app` directory, not from here.
