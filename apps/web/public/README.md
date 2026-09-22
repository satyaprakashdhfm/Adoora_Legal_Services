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
| `hero-office-desk` | Corporate Advisory | Office desk with laptop and contract folder, city skyline beyond, PEOPLE / PRINCIPLES / POSSIBILITIES on the wall. |
| `hero-law-justice` | Litigation | Brass scales of justice on bound LAW and JUSTICE volumes. Doubles as the photograph behind "Our approach" on the home page — see below. |
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

## "Our approach" photography (unused)

`why-us-expertise.png`, `why-us-client-first.png`, `client-exp.png`,
`why-us-cross-border.png` and `why-us-solutions.png` — one frame per entry in
`differentiators` (`src/content/firm.ts`) from an earlier version of the "Our
approach" home page band, which showed all five as numbered photo nodes on a
spine. The current version (`our-approach.tsx`) is a tabbed list with a single
photograph behind the selected entry's copy — `hero-law-justice`, see above —
so these five are no longer referenced. Left in place rather than deleted in
case a future version wants a photograph per entry again; `differentiators`
still carries the `image`/`focus` fields that named them.

`approach.png` — the single photograph the tabbed version used before it was
pointed at `hero-law-justice` instead. Also unused; also left in place.

## Practice photography

One circular frame per practice, behind the home page's practices ring
(`practices-wheel.tsx`) and its mobile fallback grid. Resolved by
`publicImage("practice-<slug>")`, so a missing frame just omits the photo
rather than breaking the layout.

| File | Practice |
| --- | --- |
| `practice-corporate-ma.png` | Corporate Advisory |
| `practice-banking-finance.png` | Banking & Finance |
| `practice-litigation.png` | Litigation |
| `practice-dispute-resolution.png` | Alternative Dispute Resolution |
| `practice-real-estate-infrastructure.png` | Real Estate & Infrastructure |
| `practice-taxation.png` | Taxation |
| `practice-labour-employment.png` | Labour & Employment |
| `practice-intellectual-property.png` | Intellectual Property |
| `practice-regulatory-environmental.png` | Regulatory & Environmental |

Already cropped square and centred — `object-cover` inside a circle is enough,
no `focus` value needed. These were cut from a single 3×3 composite the firm
supplied; the composite itself is not kept here once sliced (see Composites,
below).

## Insight photography

One frame per article, named by `imageBase` on that article in
`src/content/insights.ts`. The card uses the file when it exists and the drawn
composition from `insight-artwork.tsx` when it does not, so a name can be set
before the photograph arrives. Cards are 16:9 and crop to the centre; where a frame's subject sits above or
below the middle band, set `imageFocus` (a CSS `object-position`) on the
article rather than re-cropping the file.

| File | Article |
| --- | --- |
| `insight-digital-lending` | The RBI's digital lending framework |
| `insight-title-report` | Title investigation in the Telugu states |
| `insight-non-compete` | Non-compete clauses in employment contracts |
| `insight-dpdp` | DPDP compliance: start with the data map |
| `insight-section-9` | Interim relief under Section 9 |
| `insight-cci` | The deal value threshold for CCI approval |

## Careers form background (unused)

`careers-form-bg` — was the photograph behind the application form on the
careers page. The form moved to its own page per role
(`/careers/apply/[role]`), plain and image-free by request, so this file is
no longer referenced. Left in place rather than deleted in case a future
version of that page wants it back.

## Portraits

`photo` on a person in `src/content/people.ts` names their portrait here. Cards
fill a circle, so square crops with the face centred work best. Until a
portrait is set the card shows a silhouette on its accent colour.

## Composites

Several photographs delivered as one image — a strip or a grid with white
dividers — are sliced rather than offset behind a card:

    python scripts/slice-strip.py <composite> <cols> <rows> <name> [<name> ...]

It cuts on the dividers and writes each frame here under its name. Keep the
composite itself in `resources/`, not here, so it is not deployed.

## App icons

`src/app/icon.png` and `src/app/apple-icon.png`. Next.js picks those up from the
`app` directory, not from here.
