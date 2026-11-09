# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

**Pathfinder** - a psychometric self-discovery assessment for Indian CBSE students choosing an
undergraduate path. Built first for one real user (the owner's sister: PCM + Computer Science +
English), designed to scale to the public later. The student is **never shown a result**; the
app gathers an honest picture (interests, personality, aptitude, values) plus rich interaction
telemetry, and the owner analyses it afterwards (see `evaluator-instruction.md`).

## Commands

```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # tsc -b && vite build  (ALWAYS run before calling something done)
npm run preview   # preview the production build
```

Stack: Vite 6 + React 18 + TypeScript + Tailwind v4 (`@tailwindcss/vite`) + framer-motion +
lucide-react. Supabase for storage (Edge Function + Postgres).

## Architecture

Single-page flow, no router. `src/App.tsx` is a small stage machine:
`welcome -> onboarding -> subjects -> quiz -> done`.

- `src/data/`
  - `questions.ts` - the item bank: `CORE` (fixed block) + `MODULES` (6 adaptive deep-dives) +
    `REFLECTIONS`. Items are built with terse helpers (`enjoy`, `agree`, `spectrum`, `pair`,
    `scenario`, `apt`, `opt`). Each option carries scoring `tags` and an `icon` token.
  - `geography.ts` - countries/boards (India/CBSE active) and the Class-12 subject list. Subject
    `id` doubles as its icon name.
  - `svg.ts` - inline SVG generators for visual aptitude items (spruce palette).
- `src/engine/`
  - `scoring.ts` - folds raw answers into RIASEC / Big Five / values / aptitude scores and the
    running `ScoreContext`. **Authoritative scoring lives here.**
  - `router.ts` - adaptive engine. After the core block, `buildTail()` ranks the 6 modules on the
    running profile and serves the best 2; `appliesIf` on items prunes within a module.
  - `telemetry.ts` - `TelemetryTracker`: per-question TTFI, time-to-commit, dwell, every answer
    change, revisits, tab blurs.
  - `storage.ts` - localStorage resume snapshots + local backup.
  - `submit.ts` - POSTs the payload to the Supabase Edge Function (`VITE_SUBMIT_URL`), with retry.
- `src/components/`
  - `ui.tsx` - shell, buttons, kicker, progress rule, brand mark (all custom, no library chrome).
  - `renderers.tsx` - one renderer per question `kind` (likert, spectrum, thisOrThat, scenario,
    aptitude, rank, reflection) + `isAnswered`.
  - `icons.tsx` - the single Lucide icon vocabulary (`Icon` + `FACE_ICONS`). All icons go through
    here.
  - `Welcome`, `Onboarding`, `SubjectPicker`, `Quiz`, `Completion`.
- `supabase/` - `schema.sql` (table + RLS lockdown), `functions/submit-assessment/` (the writer),
  `DEPLOY.md` (one-time setup).

## Design system - READ `DESIGN.md` BEFORE touching UI

Editorial / academic-workbook aesthetic, deliberately **anti-AI-slop**. Tokens are locked in
`DESIGN.md` and defined as Tailwind theme vars in `src/index.css` (`paper`, `surface`, `ink`,
`ink-soft`, `line`, `spruce`, `spruce-deep`, `spruce-tint`, `clay`).

Hard rules (do not violate):
- **Fonts:** Fraunces (display/`font-display`) + Hanken Grotesk (body). Never Inter/Roboto/Poppins.
- **No purple/blue gradients, no glassmorphism, no neon glows.** Hairline borders, not soft glows.
- **No decorative emoji.** Use `Icon` from `components/icons.tsx` (Lucide, spruce). Add new
  concepts to the `MAP` there; never inline an emoji in UI or data.
- **No em dashes (`-`/U+2014) anywhere** - in copy or comments. Use commas, colons, or periods.
  (The owner considers both emoji and em dashes AI tells.)
- Accent colour is spruce for selected/active; clay for small highlights only. One strong idea:
  big Fraunces prompts + numbered sections + a thin progress rule.

Before shipping UI, you may run the `web-design-guidelines` review skill.

## Security model (storage)

- The browser holds **no DB credentials** - only the opaque Edge Function URL (`VITE_SUBMIT_URL`).
  Never add the Supabase anon/service key to the client or `.env` used by Vite.
- The table has RLS enabled with **no public policies**; only the Edge Function (service role,
  auto-injected) can write. Don't add client-side Supabase calls.
- The client sends **raw answers + telemetry only - never computed scores**. Keep scoring out of
  the submission payload so the interpretation can't be read/gamed from devtools. Scores are
  computed offline via `scoring.ts`.
- Name + email are validated client-side AND re-validated in the Edge Function.
- Known inherent limit: question text is rendered client-side and can't be hidden. If asked to
  hide it, that requires a server-driven one-question-at-a-time mode (not built).

## Conventions & gotchas

- Question transitions use a **plain keyed `motion.div`, not `AnimatePresence mode="wait"`** -
  the latter froze the view on fast taps (fixed; don't reintroduce it).
- In dev, React StrictMode double-invokes effects, so `revisits` is inflated by 1 on first view
  of each question. This is **dev-only**; production telemetry is clean.
- RIASEC magnitudes aren't comparable across students (adaptive item counts) - treat as a
  within-person ranking. This matters for any analysis/report code.
- When you change items or scoring, update `evaluator-instruction.md` (the analyst/LLM key) to
  match, and keep option `icon` tokens present in `components/icons.tsx`'s `MAP`.
- `.env` holds only `VITE_SUBMIT_URL`. Supabase project ref: `mrjqttdzudtaiwjqwkdz`.

## Verifying changes

Prefer driving the real app (the project has been validated end-to-end via the browser). After a
nontrivial change: `npm run build`, then exercise the affected flow. For data/scoring changes,
a full run-through confirms adaptive routing + telemetry still populate correctly.
