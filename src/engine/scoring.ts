import type {
  Question,
  RiasecCode,
  BigFiveTrait,
  WorkValue,
  AptitudeDomain,
  ScoreContext,
  Profile,
  ComputedScores,
  QuestionTelemetry,
} from '../types'
import { CORE, MODULES, REFLECTIONS } from '../data/questions'

export const RIASEC_CODES: RiasecCode[] = ['R', 'I', 'A', 'S', 'E', 'C']
export const TRAITS: BigFiveTrait[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
]
export const WORK_VALUES: WorkValue[] = [
  'impact',
  'stability',
  'creativity',
  'income',
  'autonomy',
  'prestige',
  'knowledge',
  'structure',
]
export const DOMAINS: AptitudeDomain[] = ['numerical', 'verbal', 'logical', 'spatial']

/** All questions in the bank, indexed by id (for answer → definition lookup). */
export const QUESTION_BY_ID: Record<string, Question> = (() => {
  const map: Record<string, Question> = {}
  for (const q of [...CORE, ...Object.values(MODULES).flat(), ...REFLECTIONS]) map[q.id] = q
  return map
})()

/** A recorded answer: the raw value the user committed for a question. */
export interface AnswerEntry {
  value: unknown
}

function zero<T extends string>(keys: T[]): Record<T, number> {
  return keys.reduce((acc, k) => ((acc[k] = 0), acc), {} as Record<T, number>)
}

interface RawScores {
  riasec: Record<RiasecCode, number>
  bigfive: Record<BigFiveTrait, number>
  values: Record<WorkValue, number>
  aptitudeByDomain: Record<AptitudeDomain, { correct: number; total: number }>
}

/** Fold the answers collected so far into raw construct scores. */
export function scoreAnswers(answers: Record<string, AnswerEntry>): RawScores {
  const riasec = zero(RIASEC_CODES)
  const bigfive = zero(TRAITS)
  const values = zero(WORK_VALUES)
  const aptitudeByDomain = DOMAINS.reduce(
    (acc, d) => ((acc[d] = { correct: 0, total: 0 }), acc),
    {} as Record<AptitudeDomain, { correct: number; total: number }>,
  )

  for (const [qid, entry] of Object.entries(answers)) {
    const q = QUESTION_BY_ID[qid]
    if (!q || entry?.value == null) continue

    switch (q.kind) {
      case 'likert': {
        const v = Number(entry.value) // 1..5
        for (const tag of q.tags ?? []) {
          const delta = (tag.direction ?? 1) * (v - 3)
          if (tag.construct === 'riasec' && tag.riasec) riasec[tag.riasec] += delta
          if (tag.construct === 'bigfive' && tag.trait) bigfive[tag.trait] += delta
          if (tag.construct === 'values' && tag.value) values[tag.value] += delta
        }
        break
      }
      case 'spectrum': {
        const t = Number(entry.value) / 100 // 0..1
        for (const tag of q.tags ?? []) {
          const base = tag.direction === 1 ? t : 1 - t
          const delta = (base - 0.5) * 4 // -2..2, same scale as likert
          if (tag.construct === 'riasec' && tag.riasec) riasec[tag.riasec] += delta
          if (tag.construct === 'bigfive' && tag.trait) bigfive[tag.trait] += delta
          if (tag.construct === 'values' && tag.value) values[tag.value] += delta
        }
        break
      }
      case 'thisOrThat':
      case 'scenario': {
        const chosen = q.options?.find((o) => o.id === entry.value)
        for (const tag of chosen?.tags ?? []) {
          if (tag.construct === 'riasec' && tag.riasec) riasec[tag.riasec] += 1.5
          if (tag.construct === 'bigfive' && tag.trait) bigfive[tag.trait] += 1.5
          if (tag.construct === 'values' && tag.value) values[tag.value] += 1.5
        }
        break
      }
      case 'rank': {
        const order = entry.value as string[]
        const n = order.length
        order.forEach((optId, idx) => {
          const o = q.options?.find((x) => x.id === optId)
          const points = n - idx // top = n, bottom = 1
          for (const tag of o?.tags ?? []) {
            if (tag.construct === 'values' && tag.value) values[tag.value] += points
            if (tag.construct === 'riasec' && tag.riasec) riasec[tag.riasec] += points / 4
          }
        })
        break
      }
      case 'aptitude': {
        if (!q.domain) break
        const chosen = q.options?.find((o) => o.id === entry.value)
        aptitudeByDomain[q.domain].total += 1
        if (chosen?.correct) aptitudeByDomain[q.domain].correct += 1
        break
      }
      default:
        break
    }
  }

  return { riasec, bigfive, values, aptitudeByDomain }
}

/** Build the running context the router + appliesIf rules consult. */
export function buildContext(
  answers: Record<string, AnswerEntry>,
  profile: Profile,
): ScoreContext {
  const raw = scoreAnswers(answers)
  const topRiasec = [...RIASEC_CODES].sort((a, b) => raw.riasec[b] - raw.riasec[a])
  const strongDomains = DOMAINS.filter(
    (d) => raw.aptitudeByDomain[d].total > 0 && raw.aptitudeByDomain[d].correct / raw.aptitudeByDomain[d].total >= 0.6,
  )
  return { ...raw, topRiasec, strongDomains, profile }
}

/** Full scores for the final payload, including aptitude timing from telemetry. */
export function computeFinalScores(
  answers: Record<string, AnswerEntry>,
  telemetry: QuestionTelemetry[],
): ComputedScores {
  const raw = scoreAnswers(answers)
  const byDomain = DOMAINS.reduce(
    (acc, d) => {
      const t = telemetry.filter(
        (x) => x.construct === 'aptitude' && QUESTION_BY_ID[x.questionId]?.domain === d,
      )
      const avgMs =
        t.length > 0 ? Math.round(t.reduce((s, x) => s + (x.timeToCommit ?? x.totalDwellMs), 0) / t.length) : 0
      acc[d] = { ...raw.aptitudeByDomain[d], avgMs }
      return acc
    },
    {} as ComputedScores['aptitude']['byDomain'],
  )
  const totalCorrect = DOMAINS.reduce((s, d) => s + raw.aptitudeByDomain[d].correct, 0)
  const totalItems = DOMAINS.reduce((s, d) => s + raw.aptitudeByDomain[d].total, 0)

  return {
    riasec: raw.riasec,
    bigfive: raw.bigfive,
    values: raw.values,
    aptitude: { byDomain, totalCorrect, totalItems },
  }
}
