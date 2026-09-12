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

`why-us` — **one file holding four photographs in a 2×2 grid**, one per card in
the "Why partner with us?" band. The cards do not slice it: each renders the
source at twice its own size and offsets it to bring its quadrant into view, so
the file stays a single request and nothing is squashed.

Quadrants map to the cards in reading order, which is the order
`differentiators` is declared in `src/content/firm.ts`:

| Quadrant | Card |
| --- | --- |
| top-left | Proven Legal Expertise |
| top-right | Client-First Approach |
| bottom-left | Cross-Border & Regulatory Mastery |
| bottom-right | Strategic Legal Solutions |

Each quadrant is cropped to the card, which is tall and narrow, so keep the
subject centred in its quadrant rather than at an edge. A navy gradient runs up
from the bottom of every card behind the heading and body text. Resolved by
`publicImage`, so the extension does not matter and a missing file leaves the
cards on the navy they sit on.

## App icons

`src/app/icon.png` and `src/app/apple-icon.png`. Next.js picks those up from the
`app` directory, not from here.
