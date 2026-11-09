# Pathfinder

A psychometric self-discovery assessment for students choosing their undergraduate
direction. Built first for one person (my sister, CBSE PCM + CS), designed to scale to the
general public later.

It does **not** show the student a result. It quietly gathers an honest picture of their
interests, personality, aptitude, work-values, and — crucially — *how* they answered (timing,
hesitation, changed answers), so you can do a considered analysis together afterwards.

---

## What it measures (and why)

The instrument combines four validated frameworks rather than a casual quiz, because course
choice needs more than one signal:

| Construct       | Framework                              | What it tells you                         |
| --------------- | -------------------------------------- | ----------------------------------------- |
| **Interests**   | Holland **RIASEC** (R/I/A/S/E/C)        | What genuinely pulls at her attention     |
| **Personality** | **Mini-IPIP** (20-item public-domain Big Five) | How she's wired                   |
| **Aptitude**    | Timed, scored numerical / verbal / logical / spatial | Where she is actually sharp      |
| **Work values** | Ranked motivators (impact, stability, creativity, income, autonomy, prestige, knowledge, structure) | What a good career must give her |

Question formats are deliberately varied and engaging — spectrum sliders, this-or-that cards,
situational scenarios, tap-to-rank, emoji enjoyment scales, and visual aptitude puzzles — not
plain MCQs.

## How it adapts (the decision-tree you asked for)

There are two phases:

1. **Core block (fixed, ~36 items).** Always the same, so results stay comparable and
   scorable across people and retakes.
2. **Adaptive deep-dives.** After the core, a router (`src/engine/router.ts`) scores the
   student's running RIASEC + aptitude strengths + chosen subjects against six modules
   — **Applied Tech / Engineering, Creative & Design, Life Sciences & Health, People/Mind/
   Society, Business & Enterprise, Law/Policy/Humanities** — and serves only the **two best
   matches**. An engineering-leaning profile never wades through B.Arch/BSc-only questions,
   and vice-versa.

   Individual questions can also carry an `appliesIf` rule, so the tree prunes *within* a
   module too (e.g. a hard spatial puzzle is only given to someone who handled spatial/logic
   well in the core; otherwise they get a fairer numerical item instead).

No Claude API is used at runtime — the adaptivity is rule-based, so it's free, instant,
offline-capable, and can't produce a broken question mid-test.

## What gets captured (for your analysis)

Every question records, in `telemetry`:

- `timeToFirstInteraction` — reading / hesitation time
- `timeToCommit` — total time until they pressed continue
- `totalDwellMs` — time on screen including revisits
- `changes` + `changeCount` — every answer they set, in order, with timing (did they waver?)
- `revisits`, `tabBlurs` — did they go back, or leave the tab?
- `correct` — for aptitude items

Plus the raw `answers`, `selectedModules`, the exact `questionOrder`, and device/environment
info. (Psychometric scores are intentionally **not** computed in the browser or sent over the
network — derive them offline from this raw data with `src/engine/scoring.ts`.)

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build
```

Node 18+ required.

## Getting the results to you (Supabase — secure)

On finish, the student's responses are written to a **Supabase** table via a server-side
**Edge Function**. This is set up so the browser never holds any database credentials.

**One-time setup** is in [`supabase/DEPLOY.md`](./supabase/DEPLOY.md):

1. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor (creates the
   table + locks it with Row-Level Security).
2. `supabase functions deploy submit-assessment --no-verify-jwt` (deploys the writer).

The function URL is already in `.env` as `VITE_SUBMIT_URL`. Read the data later in the Supabase
Table Editor or via SQL — see DEPLOY.md.

### Security model (what's actually enforced)

- **No DB credentials in the browser** — the client only knows an opaque Edge Function URL
  (verified: no anon/service key appears in the built bundle or any network request).
- **The table can't be read or tampered with** by anyone but the function — RLS is on with no
  public policies, and grants are revoked for the public API roles.
- **No scores / scoring keys on the wire** — the browser sends only raw answers + telemetry;
  the psychometric interpretation is derived offline, so it can't be read or gamed from devtools.
- Name + email are validated both client-side (UX) and server-side (authoritative).

Honest limit: the question *text* must render in the page, so a determined person with devtools
can read the questions and their own raw answers — unavoidable for any browser quiz. If you want
that hidden too, the next step is a server-driven mode that serves one question at a time; ask
and it can be built.

## Deploying the site

Static site: `npm run build` → deploy `dist/` to Vercel, Netlify, or GitHub Pages. Set
`VITE_SUBMIT_URL` in the host's env (or keep the committed `.env`). Deploy the Edge Function and
run the SQL once (above). That's the whole setup.

---

## Reading a response (from Supabase)

Each row in `assessment_responses` holds the raw data. Scores aren't stored (kept off the wire
on purpose) — compute them offline from `answers` + `telemetry` using `src/engine/scoring.ts`
(`computeFinalScores`). Suggested order for your analysis:

1. **RIASEC** (from `answers`) — her top 2–3 Holland letters → map to course families.
2. **Aptitude** — accuracy *and* speed per domain (in `telemetry`: `timeToCommit`, `correct`) →
   where she's genuinely strong vs. slow-but-right vs. guessing.
3. **Work values** — the `v-rank` answer is her ranked motivators; sanity-check courses against it.
4. **`selected_modules`** — which worlds the adaptive router judged most relevant to her.
5. **`telemetry`** — the subtle story: long `timeToFirstInteraction` or high `changeCount` on a
   topic often means ambivalence; fast confident answers mean conviction. Read the two
   `reflection` free-text answers (`ref-flow`, `ref-dream`) last — often the most revealing.

> The scores are a convenience. The raw `telemetry` + `answers` are authoritative — recompute
> anything from `src/engine/scoring.ts` if you want to tweak the model.

## Project map

```
src/
  data/
    geography.ts   countries, boards (India/CBSE active), subject list
    questions.ts   the item bank: CORE block + 6 adaptive MODULES + REFLECTIONS
    svg.ts         inline SVG for visual aptitude items (on-brand palette)
  engine/
    scoring.ts     folds answers → construct scores + running context
    router.ts      adaptive module selection + appliesIf pruning
    telemetry.ts   per-question timing / changes / revisits tracker
    storage.ts     resume-on-reload snapshots
    submit.ts      Formspree POST + download fallback
  components/      Welcome, Onboarding, SubjectPicker, Quiz, renderers, Completion, ui
  App.tsx          stage orchestration
DESIGN.md          the locked design system (anti-AI-slop rules)
```

## Design

See `DESIGN.md`. Short version: an editorial / academic-workbook aesthetic — warm paper, ink,
spruce + clay — with **Fraunces** and **Hanken Grotesk**. No purple/blue gradients,
glassmorphism, or default AI-template tells.

## Scaling later

- Add countries/boards in `data/geography.ts` (structure already supports it).
- Add subjects to the list (students can already add their own).
- Add or tune deep-dive modules in `data/questions.ts` + `engine/router.ts`.
- When you're ready to show students results, build a report screen off the existing `scores`.
