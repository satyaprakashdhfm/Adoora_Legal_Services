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

## App icons

`src/app/icon.png` and `src/app/apple-icon.png`. Next.js picks those up from the
`app` directory, not from here.
