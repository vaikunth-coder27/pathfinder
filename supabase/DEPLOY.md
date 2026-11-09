# Supabase setup (one-time)

Project: **mrjqttdzudtaiwjqwkdz** (`https://mrjqttdzudtaiwjqwkdz.supabase.co`)

There are exactly two steps: create the table, and deploy the function. After that the
site writes securely with no database credentials in the browser.

## 1. Create the table (no CLI needed)

1. Open your project → **SQL Editor** → **New query**.
2. Paste the contents of [`schema.sql`](./schema.sql) and click **Run**.

This creates `assessment_responses`, enables Row-Level Security, and revokes all public
access — so the table can only be written by the Edge Function (service role).

## 2. Deploy the Edge Function

You need the Supabase CLI once. (Install: `npm i -g supabase`, or see supabase.com/docs/guides/cli.)

```bash
cd c:/Users/vaiku/Downloads/CareerQuiz

supabase login                          # opens the browser to authorise
supabase link --project-ref mrjqttdzudtaiwjqwkdz
supabase functions deploy submit-assessment --no-verify-jwt
```

- `--no-verify-jwt` makes the function callable by the public site **without shipping any
  Supabase key to the browser**. The function still fully controls what gets written, and
  RLS still protects the table.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into the function automatically —
  you do **not** set or paste the service key anywhere.

The function URL will be:

```
https://mrjqttdzudtaiwjqwkdz.functions.supabase.co/submit-assessment
```

which is already set in `.env` as `VITE_SUBMIT_URL`.

## 3. Test it

```bash
npm run build && npm run preview
```

Complete the assessment once. Then in Supabase → **Table Editor → assessment_responses**,
you should see the row with name, email, answers, and telemetry.

## Reading / exporting the data later

- **Table Editor** for a quick look, or **SQL Editor**:

  ```sql
  select name, email, created_at, duration_ms, selected_modules, subjects
  from assessment_responses
  order by created_at desc;
  ```

- The full raw data is in the `answers` and `telemetry` JSON columns. Compute psychometric
  scores from those with the project's `src/engine/scoring.ts` (deliberately kept out of the
  browser payload so scores never travel over the client network).

## What this protects (and the one honest limit)

Protected:
- **No DB credentials in the browser** — only the opaque function URL is visible.
- **The table can't be read or tampered with** by anyone but the function (RLS + revoked grants).
- **No computed scores / scoring keys on the wire** — interpretation stays server-side / offline.

Inherent limit of any browser quiz:
- The question *text* is rendered in the page, so a determined person with devtools can read
  the questions and their own raw answers. That can't be prevented client-side. If you later
  want even this hidden (serve one question at a time from the server, hide the bank), that's a
  follow-up server-driven mode — ask and it can be built.
