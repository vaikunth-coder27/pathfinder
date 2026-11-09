// Supabase Edge Function: submit-assessment
// ----------------------------------------------------------------------------
// The ONLY component that can write to `assessment_responses`. It runs on
// Supabase's servers, holds the service-role key (auto-injected, never shipped
// to the browser), validates name + email, and inserts the row. The table has
// RLS enabled with no public policies, so nothing else — not the anon key, not
// a crafted request — can read or write it.
//
// Deploy:  supabase functions deploy submit-assessment --no-verify-jwt
// ----------------------------------------------------------------------------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }

  // ---- validate identity (authoritative, server-side) ----
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (name.length < 2 || name.length > 120) return json({ error: 'invalid_name' }, 422)
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'invalid_email' }, 422)

  const r = body?.result ?? {}
  const p = r.profile ?? {}
  const env = r.environment ?? {}

  // Guard against absurd payloads (basic abuse protection).
  const telemetryLen = Array.isArray(r.telemetry) ? r.telemetry.length : 0
  if (telemetryLen > 500) return json({ error: 'payload_too_large' }, 413)

  const startedAt = Number(r.startedAt)
  const completedAt = Number(r.completedAt)

  const row = {
    name,
    email,
    session_id: r.sessionId ?? null,
    schema_version: r.schemaVersion ?? null,
    started_at: Number.isFinite(startedAt) ? new Date(startedAt).toISOString() : null,
    completed_at: Number.isFinite(completedAt) ? new Date(completedAt).toISOString() : null,
    duration_ms:
      Number.isFinite(startedAt) && Number.isFinite(completedAt) ? completedAt - startedAt : null,
    country: p.country ?? null,
    board: p.board ?? null,
    age_band: p.ageBand ?? null,
    subjects: p.subjects ?? null,
    custom_subjects: p.customSubjects ?? null,
    selected_modules: r.selectedModules ?? null,
    question_order: r.questionOrder ?? null,
    question_count: Array.isArray(r.questionOrder) ? r.questionOrder.length : null,
    answers: r.answers ?? null,
    telemetry: r.telemetry ?? null,
    environment: env ?? null,
    user_agent: env.userAgent ?? null,
    language: env.language ?? null,
    timezone: env.timezone ?? null,
    screen_w: env?.screen?.w ?? null,
    screen_h: env?.screen?.h ?? null,
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Direct PostgREST insert with the service role key — bypasses RLS.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/assessment_responses`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error('insert_failed', res.status, detail)
    return json({ error: 'db_insert_failed' }, 500)
  }

  return json({ ok: true })
})
