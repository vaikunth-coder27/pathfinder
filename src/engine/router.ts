import type { ModuleId, RiasecCode, AptitudeDomain, ScoreContext, Profile } from '../types'
import { MODULES, REFLECTIONS } from '../data/questions'
import { buildContext, type AnswerEntry } from './scoring'

// Each deep-dive module's "signature": the interests, aptitude domains, and
// school subjects that make it a good fit. The router scores every module
// against the running profile and serves only the strongest two, so an
// engineering-leaning student never wades through B.Arch/BSc-only questions,
// and vice-versa.
interface ModuleSignature {
  codes: RiasecCode[]
  domains: AptitudeDomain[]
  subjects: string[]
  /** personality nudge: trait that mildly favours this module when positive. */
  favoursExtraversion?: boolean
  favoursOpenness?: boolean
}

const SIGNATURES: Record<ModuleId, ModuleSignature> = {
  'applied-tech': {
    codes: ['I', 'R'],
    domains: ['numerical', 'spatial', 'logical'],
    subjects: ['physics', 'mathematics', 'computer-science', 'informatics', 'engineering-graphics', 'chemistry'],
  },
  'creative-design': {
    codes: ['A'],
    domains: ['spatial'],
    subjects: ['fine-arts', 'music', 'engineering-graphics', 'english', 'home-science'],
    favoursOpenness: true,
  },
  'life-health': {
    codes: ['I', 'S'],
    domains: ['logical', 'verbal'],
    subjects: ['biology', 'chemistry', 'psychology', 'biotechnology', 'home-science'],
  },
  'people-society': {
    codes: ['S', 'I'],
    domains: ['verbal'],
    subjects: ['psychology', 'sociology', 'political-science', 'history', 'philosophy'],
    favoursExtraversion: true,
  },
  'business-enterprise': {
    codes: ['E', 'C'],
    domains: ['numerical'],
    subjects: ['economics', 'business-studies', 'accountancy', 'entrepreneurship', 'mathematics'],
    favoursExtraversion: true,
  },
  'law-humanities': {
    codes: ['E', 'I', 'A'],
    domains: ['verbal'],
    subjects: ['political-science', 'history', 'legal-studies', 'english', 'philosophy', 'sociology'],
    favoursOpenness: true,
  },
}

export interface ModuleScore {
  id: ModuleId
  score: number
}

/** Rank all modules for the given running context, strongest first. */
export function rankModules(ctx: ScoreContext): ModuleScore[] {
  const rankIndex = (code: RiasecCode) => ctx.topRiasec.indexOf(code) // 0 = strongest
  const subjects = new Set(ctx.profile.subjects)

  const scored = (Object.keys(SIGNATURES) as ModuleId[]).map((id) => {
    const sig = SIGNATURES[id]
    let score = 0

    // Interest fit: a signature code ranked #1 is worth 6, #2 worth 5, …
    for (const code of sig.codes) score += 6 - rankIndex(code)

    // Aptitude strength in a relevant domain is strong evidence.
    for (const d of sig.domains) if (ctx.strongDomains.includes(d)) score += 2.5

    // What she actually studied is a real-world anchor.
    for (const s of sig.subjects) if (subjects.has(s)) score += 1.5

    // Light personality nudges.
    if (sig.favoursExtraversion && ctx.bigfive.extraversion > 0) score += 1
    if (sig.favoursOpenness && ctx.bigfive.openness > 0) score += 1

    return { id, score }
  })

  return scored.sort((a, b) => b.score - a.score)
}

export interface Tail {
  selectedModules: ModuleId[]
  /** Ordered question ids to ask after the core block. */
  questionIds: string[]
}

/**
 * After the fixed core block, decide which deep-dive modules to run and
 * expand them into a concrete, pruned list of question ids + reflections.
 */
export function buildTail(
  answers: Record<string, AnswerEntry>,
  profile: Profile,
  moduleCount = 2,
): Tail {
  const ctx = buildContext(answers, profile)
  const ranked = rankModules(ctx)
  const selected = ranked.slice(0, moduleCount).map((m) => m.id)

  const questionIds: string[] = []
  for (const mid of selected) {
    for (const q of MODULES[mid]) {
      // Prune items whose branch condition isn't met for this student.
      if (q.appliesIf && !q.appliesIf(ctx)) continue
      questionIds.push(q.id)
    }
  }
  questionIds.push(...REFLECTIONS.map((r) => r.id))

  return { selectedModules: selected, questionIds }
}
