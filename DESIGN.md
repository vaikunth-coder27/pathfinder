# Pathfinder — Design System (locked)

A deliberate aesthetic so the product reads as a crafted academic instrument, **not** an
AI-generated template. Anti-slop rules below are non-negotiable.

## Reference points

Printed career/aptitude **workbooks**, Swiss International Style typographic layout, and the
quiet editorial confidence of a well-set university prospectus. One strong decision: large
**Fraunces** serif numerals + prompts carried on a calm paper canvas with hairline rules.

## Banned (classic AI-slop tells — never reintroduce)

- Purple→blue / indigo→pink gradients. No gradient text.
- Glassmorphism, frosted blurs, neon glows, floating "aurora" blobs.
- Inter / Roboto / Poppins / Open Sans as the headline face.
- Three-up feature-card rows, soft drop shadows everywhere, permanent forced dark mode.
- Decorative emoji sprinkled for vibe. (Emoji allowed ONLY where functional: subject chips,
  the enjoyment-face scale — because they aid a 17-year-old's comprehension.)

## Tokens

Palette (warm paper + ink + spruce, clay accent):

| Token            | Value     | Use                                  |
| ---------------- | --------- | ------------------------------------ |
| `--paper`        | `#F3EFE6` | page background                      |
| `--surface`      | `#FBF9F4` | cards / panels                       |
| `--ink`          | `#1C1917` | primary text                        |
| `--ink-soft`     | `#5B5347` | secondary text                      |
| `--line`         | `#E2DBCB` | hairline borders / rules             |
| `--spruce`       | `#1F4D43` | primary accent, selected state       |
| `--spruce-deep`  | `#15362F` | hover / pressed                      |
| `--clay`         | `#BE6A2E` | secondary accent, small highlights   |
| `--spruce-tint`  | `#E6EDE8` | selected fill wash                   |

Type:

- Display / prompts / numerals: **Fraunces** (variable, optical size, a little "soft" + "wonk").
- UI / body / labels: **Hanken Grotesk** (variable).
- Scale: workbook numerals are big (clamp ~2–3.5rem). Prompts ~1.5–2rem Fraunces. Body 1rem.

Form & motion:

- Borders are **hairline (1px) solid `--line`**, radius small-to-medium (`10–14px`). Shadows are
  rare and soft, used only to lift the active card a touch.
- Selected = `--spruce` 1.5px border + `--spruce-tint` fill, never a glow.
- Motion is purposeful: question cross-fade/slide (~0.35s), selection spring. Honor
  `prefers-reduced-motion`.
- Layout is **left-aligned** and generous, organised on a visible grid feel with a vertical
  rule and section numbering (`SECTION 02 / HOW YOU'RE WIRED`).
