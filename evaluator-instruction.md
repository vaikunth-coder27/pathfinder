# Pathfinder — Evaluator Instructions

How to turn one student's raw response (a row in Supabase `assessment_responses`) into a
detailed, honest psychometric insight. Written so that either a human analyst **or** an LLM
(paste this whole file + the response JSON into Claude) can do it reproducibly.

The student is never shown a score. All interpretation happens here, afterwards.

---

## 0. The golden rules

1. **This is a conversation starter, not a verdict.** A 15-20 minute instrument on a teenager
   narrows and illuminates options; it does not decide a life. Always present directions, never
   a single answer.
2. **Raw data is authoritative.** Compute scores yourself from `answers` + `telemetry` using the
   keys below. Don't trust any number you didn't derive.
3. **Weight the evidence by data quality first** (Section 6). A fast, straight-lined test is
   weak evidence; treat it cautiously and say so.
4. **Interests + Aptitude + Values must converge.** The strongest recommendations are where a
   genuine interest, a real strength, and a core value point the same way. Name the
   contradictions too.

---

## 1. The data you're given

Each Supabase row (see `supabase/schema.sql`) has identity + profile columns plus two JSON
blobs that carry everything:

- `answers` - a map `{ questionId: { value } }`. `value` is:
  - a number `1..5` for `likert` items,
  - a number `0..100` for `spectrum` sliders,
  - an option id string for `thisOrThat` / `scenario` / `aptitude`,
  - an ordered array of option ids for the `rank` item,
  - free text for `reflection` items.
- `telemetry` - an array, one object per question actually shown, with: `questionId`,
  `construct`, `kind`, `shownAt`, `timeToFirstInteraction` (ms), `timeToCommit` (ms),
  `totalDwellMs`, `changes` (every value they set, with ms offsets), `changeCount`, `revisits`,
  `tabBlurs`, `finalValue`, and `correct` (aptitude only).
- `selected_modules` - which 2 adaptive deep-dives the router served (Section 5).
- `question_order` - exact sequence served (core block + adaptive tail).
- `subjects` - Class 12 subjects (real-world anchor).

Not every student sees every question (the test is adaptive), so always score over the items
that are actually present.

---

## 2. Scoring the four constructs

All raw formulas below mirror `src/engine/scoring.ts`. You can also just run that file on the
JSON if you prefer code.

### 2a. RIASEC interests (Holland)

Six themes: **R**ealistic, **I**nvestigative, **A**rtistic, **S**ocial, **E**nterprising,
**C**onventional. Sum the contributions below per code, then rank the six. The top 2-3 letters
are the student's Holland code.

**Enjoyment items (likert, 1-5).** Contribution to the tagged code = `value - 3` (so "would
love" = +2, "would dislike" = -2):

| Item | Code | | Item | Code | | Item | Code |
|---|---|---|---|---|---|---|---|
| i-r1 | R | | i-i1 | I | | i-a1 | A |
| i-r2 | R | | i-i2 | I | | i-a2 | A |
| i-s1 | S | | i-e1 | E | | i-c1 | C |
| i-s2 | S | | i-e2 | E | | i-c2 | C |

Module enjoyment items (present only if that module was served):
`at-1`=I, `at-2`=I, `cd-1`=A, `cd-2`=A, `lh-1`=I, `lh-2`=S, `ps-1`=S, `ps-2`=I,
`be-1`=E, `be-2`=E, `lw-1`=E, `lw-2`=I.

**Spectrum sliders (0-100).** Let `t = value/100`. A pole keyed `+` gets `(t - 0.5) * 4`; the
opposite pole gets `((1 - t) - 0.5) * 4` (range -2..+2 each):
- `w-hands-ideas`: right/+ = **I**, left/- = **R**.
- `w-people-focus`: right/+ = **I**, left/- = **Extraversion** (Big Five, see 2b).

**Forced-choice + scenarios.** The chosen option adds **+1.5** to each code it's tagged with:

| Item | option id -> codes |
|---|---|
| w-afternoon | make -> A,R · solve -> I |
| g-great-at | how -> I · people -> S,E |
| g-compliment | precise -> C · original -> A |
| v-proud | solved -> I(+knowledge) · built -> E(+impact) · led -> E(+prestige) · mastered -> A(+knowledge) |
| at-sc | root -> I · rebuild -> A,I · robust -> C · ship -> E |
| at-branch | physical -> R,A · software -> I |
| cd-sc | rework -> A,C · defend -> A,E · study -> I · ask -> S |
| cd-branch | visual -> A,R · language -> A,S |
| lh-sc | research -> I · care -> S · build -> R,I · scale -> E,S |
| lh-branch | clinical -> S,R · lab -> I |
| ps-sc | listen -> S · plan -> C,S · connect -> E,S · understand -> I |
| ps-branch | individual -> S · systems -> E,I |
| be-sc | sell -> E · ops -> C · invent -> I,A · team -> S,E |
| be-branch | finance -> C,I · marketing -> E,A |
| lw-sc | argue -> E · justice -> S,E · craft -> I,A · policy -> E,S |
| lw-branch | advocacy -> E · scholarship -> I,A |

Because modules are adaptive, RIASEC magnitudes aren't comparable across students - **always
read RIASEC as a within-person ranking**, not an absolute score.

### 2b. Big Five personality (Mini-IPIP, 10 items)

Likert 1-5. Contribution to the trait = `(value - 3)` for `+` items, `(3 - value)` for reverse
(`-`) items. Average/› sum the two items per trait, then read each trait as low / mid / high.

| Trait | + item | - item (reverse) |
|---|---|---|
| Extraversion | p-ext1 | p-ext2 |
| Agreeableness | p-agr1 | p-agr2 |
| Conscientiousness | p-con1 | p-con2 |
| Neuroticism (emotional stability = low N) | p-neu1 | p-neu2 |
| Openness | p-opn1 | p-opn2 |

Only 2 items per trait, so treat these as **directional hints**, not clinical scores. Note where
telemetry contradicts them (e.g. claims high conscientiousness but straight-lined in 90 seconds).

### 2c. Aptitude (timed, scored)

Each `aptitude` item has a correct option. Score accuracy **per domain**, and pair it with speed
from telemetry (`timeToCommit`).

| Item | Domain | Correct option id |
|---|---|---|
| a-num1 | numerical | 25 |
| a-num2 | numerical | 38 |
| a-verb1 | verbal | symphony |
| a-log1 | logical | left |
| a-log2 | logical | circle |
| a-spatial1 | spatial | mirror |
| at-apt-spatial | spatial | sv |
| at-apt-num | numerical | 25 |
| cd-apt | spatial | hex |
| lh-apt | logical | control |
| ps-apt | verbal | cant |
| be-apt | numerical | 25 |
| lw-apt | verbal | maybe |

Read each domain as **accuracy × speed**:
- fast + correct -> fluent strength;
- slow + correct -> capable but effortful;
- fast + wrong -> impulsive / guessing;
- slow + wrong -> genuine difficulty.

`at-apt-spatial` vs `at-apt-num`: only one is served (the router gives the hard spatial item
only to students already strong in spatial/logical; otherwise a numerical item). Its presence is
itself a signal.

Caveat: only ~2-3 items per domain. Aptitude here is a **coarse pointer**, strongest when it
agrees with the matching interest (e.g. high numerical + high I/C).

### 2d. Work values

**Ranking (`v-rank`).** The ordered array scores each value `points = n - index` (top of 8 = 8,
bottom = 1), where `n` is how many they ranked. Values: impact, stability, creativity, income,
autonomy, prestige, knowledge, structure.

**Tradeoff scenarios** add **+1.5** to each tagged value:
- `v-offers`: free -> creativity,autonomy · secure -> stability,structure · help -> impact ·
  climb -> prestige,income.
- `v-proud`: solved -> knowledge · built -> impact · led -> prestige · mastered -> knowledge.

Top 2-3 values are the non-negotiables any recommended path must satisfy.

### 2e. Reflections (free text)

`ref-flow` ("when do you lose track of time") and `ref-dream` ("if marks/money/opinions didn't
matter"). Read these **last and closely** - they often reveal the true pull behind the numbers,
and any sharp contradiction with the scored interests is worth surfacing gently.

---

## 3. Mapping to Indian undergraduate directions

Translate the profile into concrete CBSE-relevant UG families. Use interests to pick the family,
aptitude to sanity-check feasibility, values to filter, and subjects as the real-world gate.

| Signal | UG directions to raise |
|---|---|
| **R + I**, strong numerical/spatial, PCM/CS | Engineering (CSE/ECE/Mech...), BSc Data Science / IT, B.Arch (if A + spatial also high) |
| **I + A**, strong spatial | Architecture, Product/Industrial Design (B.Des, NID/NIFT) |
| **I**, Biology/Chemistry | MBBS/BDS, B.Pharm, Biotech, BSc life sciences, research tracks |
| **A** high | Design, Fine Arts, Film/Media, Mass Comm, Architecture |
| **S** high | Psychology, Education/Teaching, Social Work, Nursing/Allied Health, HR |
| **E** high | BBA/BMS, Economics, Entrepreneurship, Marketing, Law (litigation) |
| **C** high | B.Com, CA/CS/CMA, Finance, Analytics, Operations |
| **Verbal** strong + E/A | Law (BA LLB), Journalism, Public Policy, Liberal Arts, Humanities |

Overlay values: stability/structure -> CA, civil services, core engineering, medicine;
creativity/autonomy -> design, startups, independent practice; impact -> medicine, social
sector, public policy; income/prestige -> finance, tech, corporate law. Always widen beyond the
"engineer/doctor/IAS" default - naming 2-3 less-obvious but fitting options is much of the value
here (most Indian students only know a handful).

---

## 4. Reading the telemetry (the subtle layer)

Numbers say *what* she chose; telemetry says *how sure* she was.

- **`timeToFirstInteraction` (TTFI):** long on a specific topic = deliberation or ambivalence;
  uniformly tiny across a whole block = rushing / low engagement.
- **`changeCount`:** high on an item = genuine internal conflict about that topic (flag it).
- **`revisits`:** she went back - usually a sign the topic matters or unsettled her.
- **`tabBlurs`:** left the tab; on **aptitude** items this can mean looking something up (treat
  that item's correctness with suspicion); elsewhere, distraction.
- **Response arc:** compare early vs late `timeToCommit` - a steep drop late suggests fatigue;
  weight late sections a little less.

---

## 5. How the test adapted (context for `selected_modules`)

After the fixed core block, a router scored six modules on the running profile and served the
best two. A module being chosen means her interests/aptitude/subjects leaned that way:

| Module | Favoured by |
|---|---|
| applied-tech | I,R interests · numerical/spatial/logical aptitude · PCM/CS subjects |
| creative-design | A interest · spatial aptitude · arts/design subjects |
| life-health | I,S interests · logical/verbal aptitude · bio/chem/psych subjects |
| people-society | S,I interests · verbal aptitude · psych/socio/history subjects |
| business-enterprise | E,C interests · numerical aptitude · commerce/econ subjects |
| law-humanities | E,I,A interests · verbal aptitude · polsci/history/legal/English subjects |

So `selected_modules` is a compact, machine-made second opinion on her direction - compare it
against your own read.

---

## 6. Data-quality checks (do these BEFORE interpreting)

1. **Straight-lining:** do the likert blocks (interests, personality) show near-identical values
   with tiny TTFI? If so, interest/personality evidence is weak - lean on aptitude (objective),
   values ranking, and reflections instead, and say the self-report was low-effort.
2. **Speed:** total `duration_ms` far below ~8-10 minutes for ~45 items suggests rushing.
3. **Aptitude integrity:** `tabBlurs > 0` on aptitude items -> possible lookups; discount those.
4. **Social desirability:** high Agreeableness/Conscientiousness self-claims that telemetry
   contradicts -> note it; don't over-read flattering self-reports.

State the data-quality verdict explicitly at the top of your report.

---

## 7. Output template (use this structure)

```
STUDENT: <name> · <subjects> · <age band> · <date>
DATA QUALITY: <strong / moderate / weak> - <one line why, from Section 6>

1. INTEREST PROFILE (RIASEC)
   - Holland code: <top 2-3 letters> with the ranking and what pulls strongest.
2. PERSONALITY (Big Five)
   - Trait-by-trait directional read; flag any telemetry contradictions.
3. APTITUDE
   - Per domain: accuracy + speed read; overall cognitive leaning.
4. WORK VALUES
   - Top 2-3 non-negotiables (from ranking + tradeoffs).
5. CONVERGENCE & TENSION
   - Where interests + aptitude + values agree (confident signals).
   - Where they conflict (and what that conflict might mean).
   - What the two reflections reveal underneath the scores.
6. UNDERGRADUATE DIRECTIONS (3-5, ranked)
   - For each: the course family, why it fits (cite the evidence), the Indian entry route,
     and one honest caveat.
7. WATCH-OUTS
   - Mismatches, family-pressure risks, anything the data can't tell you.
8. CONVERSATION STARTERS
   - 3-5 specific questions to actually ask her, grounded in the above.
```

Be concrete, cite the evidence (e.g. "ranked creativity #1 and loved both Artistic items, but
spatial aptitude was slow"), avoid flattery, and surface contradictions rather than smoothing
them over.

---

## 8. Ready-to-use LLM prompt

> You are a careful, experienced career psychologist advising on an Indian CBSE student's
> undergraduate choice. I'll give you (a) the file `evaluator-instruction.md` and (b) one
> student's raw assessment JSON from Supabase. Using the scoring keys in the file, compute the
> RIASEC, Big Five, aptitude, and work-values scores yourself from the raw `answers` and
> `telemetry` - do not rely on any pre-computed numbers. First run the Section 6 data-quality
> checks and state the verdict. Then produce a detailed insight report following the Section 7
> template. Be honest and specific, cite the evidence for each claim, weight objective aptitude
> and the reflections heavily if self-report looks low-effort, and name contradictions rather
> than hiding them. Do not show scores to the student; this report is for the person advising
> her. End with 3-5 concrete questions to ask her next.
>
> [paste evaluator-instruction.md]
>
> [paste the student's response JSON]

---

_Keep this file in sync with `src/data/questions.ts` and `src/engine/scoring.ts` if you change
items or scoring. If an item id appears in a response but not in the tables above, it's new -
update this file._
