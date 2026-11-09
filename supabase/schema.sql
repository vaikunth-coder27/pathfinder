-- ============================================================================
-- Pathfinder — database schema + lockdown
-- Run this once in your Supabase project:  Dashboard → SQL Editor → paste → Run
-- Project: mrjqttdzudtaiwjqwkdz
-- ============================================================================

create table if not exists public.assessment_responses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- identity (validated by the Edge Function before insert)
  name          text not null,
  email         text not null,

  -- session
  session_id     text,
  schema_version int,
  started_at     timestamptz,
  completed_at   timestamptz,
  duration_ms    bigint,

  -- profile
  country         text,
  board           text,
  age_band        text,
  subjects        text[],
  custom_subjects text[],

  -- adaptive run
  selected_modules text[],
  question_order   text[],
  question_count   int,

  -- rich datapoints for later psychometric analysis
  answers     jsonb,   -- raw answer per question id
  telemetry   jsonb,   -- per-question timing / changes / revisits / tab blurs
  environment jsonb,

  -- denormalised environment columns for easy querying
  user_agent text,
  language   text,
  timezone   text,
  screen_w   int,
  screen_h   int
);

create index if not exists assessment_responses_email_idx   on public.assessment_responses (email);
create index if not exists assessment_responses_created_idx  on public.assessment_responses (created_at desc);

-- ---- Lockdown -------------------------------------------------------------
-- Enable Row-Level Security and add NO policies for anon/authenticated. With
-- RLS on and no policies, the public API (anon key) can neither read nor write
-- this table. Only the service-role key — used *inside* the Edge Function —
-- bypasses RLS. So even if someone finds the project URL, they cannot touch
-- this data.
alter table public.assessment_responses enable row level security;

-- Belt-and-braces: explicitly strip privileges from the public API roles.
revoke all on public.assessment_responses from anon, authenticated;

-- (The service_role retains access and is what the Edge Function uses.)
