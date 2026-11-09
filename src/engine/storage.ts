const PROGRESS_KEY = 'pathfinder.progress.v1'
const RESULT_KEY = 'pathfinder.result.v1'

/** Minimal snapshot that lets a student resume if they close the tab mid-way. */
export interface ProgressSnapshot {
  sessionId: string
  startedAt: number
  profile: unknown
  answers: Record<string, { value: unknown }>
  corePlan: string[]
  tailPlan: string[] | null
  index: number
  stage: string
}

export function saveProgress(s: ProgressSnapshot) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(s))
  } catch {
    /* storage may be unavailable (private mode), fail quietly */
  }
}

export function loadProgress(): ProgressSnapshot | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? (JSON.parse(raw) as ProgressSnapshot) : null
  } catch {
    return null
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Keep a local backup of the finished submission as a safety net for retry if
 * the network write fails. Not shown or downloaded to the taker.
 */
export function saveResult(r: unknown) {
  try {
    const existing = JSON.parse(localStorage.getItem(RESULT_KEY) || '[]')
    existing.push(r)
    localStorage.setItem(RESULT_KEY, JSON.stringify(existing))
  } catch {
    /* ignore */
  }
}
