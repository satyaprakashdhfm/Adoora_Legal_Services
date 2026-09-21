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

Five frames behind the "Why partner with us?" band's numbered photo nodes, one
per entry in `differentiators` (`src/content/firm.ts`), which names its own
file:

| File | Entry |
| --- | --- |
| `why-us-expertise.png` | Proven Legal Expertise |
| `why-us-client-first.png` | Client-First Approach |
| `client-exp.png` | Connected Client Experience |
| `why-us-cross-border.png` | Cross-Border & Regulatory Mastery |
| `why-us-solutions.png` | Strategic Legal Solutions |

Each node is a circle and the frames landscape, so `cover` crops the sides.
Each entry carries a `focus` value — a CSS `object-position` — to keep the
subject in shot; adjust that rather than re-cropping the file.

## Practice photography

One circular frame per practice, behind the home page's practices ring
(`practices-wheel.tsx`) and its mobile fallback grid. Resolved by
`publicImage("practice-<slug>")`, so a missing frame just omits the photo
rather than breaking the layout.

| File | Practice |
| --- | --- |
| `practice-corporate-ma.png` | Corporate & M&A |
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

## Careers form background

`careers-form-bg` — the illustration behind the application form on the
careers page. It is not washed over, so it has to keep its centre pale: the
fields sit on it directly. Missing, the panel shows the warm ground.

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
