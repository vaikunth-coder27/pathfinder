import type { Question, QuestionTelemetry, AnswerChange } from '../types'

interface Record_ extends QuestionTelemetry {
  _firstShownAbs: number
  _visitStart: number
}

/**
 * Imperative tracker driven by the quiz's lifecycle. It records, per question:
 * reading/hesitation time, every answer change with timing, how long the question
 * was on screen (across revisits), how many times the student changed their mind,
 * revisits, and how often they switched browser tabs while on it.
 */
export class TelemetryTracker {
  private records: Record<string, Record_> = {}
  private activeId: string | null = null

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility)
    }
  }

  dispose() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility)
    }
  }

  private onVisibility = () => {
    if (document.visibilityState === 'hidden' && this.activeId) {
      const r = this.records[this.activeId]
      if (r) r.tabBlurs += 1
    }
  }

  /** Called when a question becomes the active one on screen. */
  show(q: Question) {
    const now = Date.now()
    let r = this.records[q.id]
    if (!r) {
      r = {
        questionId: q.id,
        construct: q.construct,
        kind: q.kind,
        section: q.section,
        shownAt: now,
        timeToFirstInteraction: null,
        timeToCommit: null,
        totalDwellMs: 0,
        changes: [],
        changeCount: 0,
        revisits: 0,
        tabBlurs: 0,
        finalValue: null,
        _firstShownAbs: now,
        _visitStart: now,
      }
      this.records[q.id] = r
    } else {
      r.revisits += 1
      r._visitStart = now
    }
    this.activeId = q.id
  }

  /** Called on every answer change (including re-selections). */
  interact(qId: string, value: unknown) {
    const r = this.records[qId]
    if (!r) return
    const now = Date.now()
    if (r.timeToFirstInteraction === null) r.timeToFirstInteraction = now - r._visitStart
    const change: AnswerChange = { at: now - r._firstShownAbs, value: clone(value) }
    r.changes.push(change)
    r.changeCount = Math.max(0, r.changes.length - 1)
    r.finalValue = clone(value)
  }

  /** Called when the student leaves this question (continue OR back). */
  leave(qId: string) {
    const r = this.records[qId]
    if (!r) return
    r.totalDwellMs += Date.now() - r._visitStart
  }

  /** Called specifically when the student commits via Continue. */
  commit(qId: string, correct?: boolean) {
    const r = this.records[qId]
    if (!r) return
    r.timeToCommit = Date.now() - r._firstShownAbs
    if (correct !== undefined) r.correct = correct
  }

  export(order: string[]): QuestionTelemetry[] {
    return order
      .map((id) => this.records[id])
      .filter(Boolean)
      .map((r) => {
        // Strip internal bookkeeping fields.
        const { _firstShownAbs, _visitStart, ...clean } = r
        void _firstShownAbs
        void _visitStart
        return clean
      })
  }
}

function clone<T>(v: T): T {
  if (v == null || typeof v !== 'object') return v
  return JSON.parse(JSON.stringify(v))
}
