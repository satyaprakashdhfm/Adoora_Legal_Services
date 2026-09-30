# Static assets

## The mark

`adoora-mark.png` — the firm's triangular "A" mark, flattened to a single gold
(`#C88A4E`) silhouette on a transparent ground. Generated from
`resources/als logo A.png`; the cut-outs deliberately show whatever sits behind
them, exactly as the letterhead uses it.

## Inner-page hero background

`hero-bg` — the blindfolded Lady Justice statue, sepia-toned on a matching
pale ground, subject on the right. Behind `PageHero` (`src/components/ui.tsx`)
on the pages passed `image` — currently Insights, Careers, About and Contact.
Pale enough that the heading needs no scrim over it; a page that doesn't pass
`image` keeps the plain `paper-tint` band.

Keep the subject on the **right** and give it room top and bottom. The band
is only as tall as the page's own heading copy, and `cover` crops whatever
does not fit, so a frame with the subject running edge to edge loses its
head on the shorter pages. `PageHero` floors an image band at 22rem for the
same reason.

## High Court marks

One per office, behind the location cards on the home page
(`src/components/city-icon.tsx`, keyed by city):

| File | Office |
| --- | --- |
| `hc-telangana.png` | Hyderabad |
| `hc-karnataka.png` | Bengaluru |
| `hc-andhra-pradesh.png` | Guntur |

Each was supplied as a one-colour illustration on white and converted to a
transparent PNG in the exact site gold (`--color-gold`, `#c27c38`), with
opacity taken from colour saturation — so the cream fills inside a building
drop out rather than turning into grey blocks — then cropped tight to the
artwork. Replacing one: do the same, or it will not match the other two —
and give the new file a new name rather than overwriting, because the image
optimizer caches by URL and would go on serving the old one for hours.

They are **not** on a shared canvas: the Karnataka façade is nearly three
times as wide as it is tall, so `CityIcon` fits each one (`contain`) into a
box as wide as its card and a fixed height, bottom-left, and the ground
lines line up.

## Hero photography

One frame per hero slide, cross-fading as the copy rotates. The slides and the
file names live in `src/content/hero-slides.ts`.

| Base name | Slide | The photograph |
| --- | --- | --- |
| `hero-office-desk` | Corporate Advisory | Office desk with laptop and contract folder, city skyline beyond, PEOPLE / PRINCIPLES / POSSIBILITIES on the wall. Doubles as the photograph beside "Our approach" on the home page — see below. |
| `hero-law-justice` | Litigation | Brass scales of justice on bound LAW and JUSTICE volumes. |
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

## "Our approach" photography

The home page band (`our-approach.tsx`) is a photograph down the left beside
a mosaic of five numbered cards. The photograph is `hero-office-desk` (see
above), cropped `object-[45%_50%]` so the laptop and window stay in shot in
the near-square frame on desktop.

`why-us-expertise.png`, `why-us-client-first.png`, `client-exp.png`,
`why-us-cross-border.png`, `why-us-solutions.png` and `approach.png` are from
earlier versions of the band and are no longer referenced. Left in place
rather than deleted; `differentiators` still carries the `image`/`focus`
fields that named the first five.

## Practice photography

The home page practices band (`practices-grid.tsx`) is a 3 × 3 grid of navy
cards, one per practice. Each card takes one of two photographs, both resolved
by `publicImage()`, so the extension does not matter:

- **`practice-photo-<slug>`: full-bleed card photograph (not yet supplied).**
  When present, it fills the card behind a navy wash that darkens the left,
  where the number and name sit. Landscape, roughly 16:9, at least 900px
  wide, with the subject on the **right**. Drop one in and that card switches
  over; the others are unaffected.
- **`practice-<slug>`: circular inset (in place now).** Used only when the
  full-bleed frame is missing, as a gold-ringed disc on the right of the navy
  card. These are small (about 260px), which is why they are not stretched
  to fill the card.

| Slug | Practice |
| --- | --- |
| `corporate-ma` | Corporate Advisory |
| `banking-finance` | Banking & Finance |
| `litigation` | Litigation |
| `dispute-resolution` | Alternative Dispute Resolution |
| `real-estate-infrastructure` | Real Estate & Infrastructure |
| `taxation` | Taxation |
| `labour-employment` | Labour & Employment |
| `intellectual-property` | Intellectual Property |
| `regulatory-environmental` | Regulatory & Environmental |

The circular insets are already cropped square and centred. They were cut
from a single 3×3 composite the firm supplied; the composite itself is not
kept here once sliced (see Composites, below).

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

## People portraits (sample)

`person-ganesh-raghavendra.jpg`, `person-vidya-sagar.jpg` and
`person-kondal-rao.jpg` are **stock placeholders** from Unsplash, set as
`photo` in `src/content/people.ts` for the home page "Our people" slides.
Replace them with the firm's own portraits before launch, keeping the same
base names (any image extension works) and a 4:5 portrait crop.
