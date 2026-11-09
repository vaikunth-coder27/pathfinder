import type { SubmissionPayload } from '../types'

// The ONLY backend address the browser knows. It's an opaque Supabase Edge
// Function URL, no database credentials (not even the anon key) ever reach
// the client. The function holds the service role key server-side and is the
// only thing allowed to write to the locked-down table.
const ENDPOINT = import.meta.env.VITE_SUBMIT_URL as string | undefined

export interface SubmitOutcome {
  ok: boolean
  reason?: string
}

export async function submitPayload(payload: SubmissionPayload): Promise<SubmitOutcome> {
  if (!ENDPOINT) return { ok: false, reason: 'not-configured' }

  let lastErr = 'unknown'
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) return { ok: true }
      lastErr = `HTTP ${res.status}`
      // 4xx = validation/permanent; don't hammer the server retrying it.
      if (res.status >= 400 && res.status < 500) break
    } catch (e) {
      lastErr = (e as Error).message
    }
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
  }
  return { ok: false, reason: lastErr }
}
