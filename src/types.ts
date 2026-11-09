// ------------------------------------------------------------------
// Core domain + telemetry types for the Pathfinder assessment.
// Everything the analyst needs later is captured here.
// ------------------------------------------------------------------

/** The psychological construct a question contributes to. */
export type Construct =
  | 'riasec' // Holland interest themes
  | 'bigfive' // Mini-IPIP personality
  | 'aptitude' // timed, scored ability
  | 'values' // work values / motivators
  | 'reflection' // open-ended self-report

export type RiasecCode = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export type BigFiveTrait =
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism'

export type AptitudeDomain = 'numerical' | 'verbal' | 'logical' | 'spatial'

export type WorkValue =
  | 'impact' // helping / making a difference
  | 'stability' // security, predictability
  | 'creativity' // self-expression, novelty
  | 'income' // financial reward
  | 'autonomy' // independence, freedom
  | 'prestige' // status, recognition
  | 'knowledge' // learning, mastery
  | 'structure' // order, clear rules

/** How a question is rendered and answered. */
export type QuestionKind =
  | 'likert' // single statement, enjoy/agree scale
  | 'thisOrThat' // forced choice between two options
  | 'scenario' // short situation + option cards (SJT)
  | 'rank' // order a small set by preference
  | 'aptitude' // timed multiple choice, has a correct answer
  | 'spectrum' // slider between two poles
  | 'reflection' // optional free text

// --- Scoring maps attached to answer choices ---------------------

/** For likert enjoyment items: which RIASEC code / trait this scores, and direction. */
export interface ScoreTag {
  construct: Construct
  riasec?: RiasecCode
  trait?: BigFiveTrait
  value?: WorkValue
  /** +1 = keyed normally, -1 = reverse-scored (for personality). */
  direction?: 1 | -1
}

export interface ChoiceOption {
  id: string
  label: string
  /** Named icon (see components/icons.tsx) shown on the card. */
  icon?: string
  /** Optional sublabel for extra context. */
  sublabel?: string
  /** Inline SVG markup (used by abstract/spatial aptitude items). */
  svg?: string
  /** What choosing this option scores toward (interests, values, personality). */
  tags?: ScoreTag[]
  /** For aptitude: marks the correct option. */
  correct?: boolean
}

export interface Question {
  id: string
  kind: QuestionKind
  construct: Construct
  /** Prompt text shown to the user. */
  prompt: string
  /** Optional supporting line under the prompt. */
  helper?: string
  /** Section this belongs to (for pacing/progress grouping). */
  section: string

  // likert / spectrum
  scale?: {
    min: number
    max: number
    minLabel: string
    maxLabel: string
    /** render the 5-point scale as line-icon faces (dislike → love). */
    faces?: boolean
  }
  /** Scoring for the whole likert/spectrum item (position maps to intensity). */
  tags?: ScoreTag[]

  // choice-based (thisOrThat / scenario / aptitude / rank)
  options?: ChoiceOption[]

  // aptitude
  domain?: AptitudeDomain
  /** Soft target time in seconds (used for pacing hints, not a hard cutoff). */
  softTimeLimit?: number
  /** SVG shown in the question stem (abstract/spatial). */
  stemSvg?: string

  // reflection
  placeholder?: string
  optional?: boolean

  // --- adaptive engine ---
  /** Which deep-dive module this item belongs to (undefined = core block). */
  module?: ModuleId
  /** Difficulty tier (used to adapt aptitude to running accuracy). */
  difficulty?: 'easy' | 'hard'
  /** If present and it returns false, the router skips this item (tree pruning). */
  appliesIf?: (ctx: ScoreContext) => boolean
}

export type ModuleId =
  | 'applied-tech'
  | 'creative-design'
  | 'life-health'
  | 'people-society'
  | 'business-enterprise'
  | 'law-humanities'

/** Running, partial profile the router + appliesIf rules read from. */
export interface ScoreContext {
  riasec: Record<RiasecCode, number>
  bigfive: Record<BigFiveTrait, number>
  values: Record<WorkValue, number>
  aptitudeByDomain: Record<AptitudeDomain, { correct: number; total: number }>
  /** RIASEC codes sorted strongest-first. */
  topRiasec: RiasecCode[]
  /** Aptitude domains where accuracy is strong (>= 0.6 with >=1 item). */
  strongDomains: AptitudeDomain[]
  profile: Profile
}

// --- Telemetry ---------------------------------------------------

/** A single change the user made to their answer, with timing. */
export interface AnswerChange {
  /** ms since the question was shown. */
  at: number
  /** Serialised value at this point. */
  value: unknown
}

export interface QuestionTelemetry {
  questionId: string
  construct: Construct
  kind: QuestionKind
  section: string
  /** Absolute epoch ms when question was first shown. */
  shownAt: number
  /** ms from shown to first interaction (hesitation / reading time). */
  timeToFirstInteraction: number | null
  /** ms from shown to committing (pressing continue). */
  timeToCommit: number | null
  /** Total ms the question was on screen (incl. revisits). */
  totalDwellMs: number
  /** Every answer the user set, in order, with timing. */
  changes: AnswerChange[]
  /** Number of times the user changed their mind after first answering. */
  changeCount: number
  /** Number of times the user left and returned to this question. */
  revisits: number
  /** Times the browser tab lost focus while on this question. */
  tabBlurs: number
  /** Final committed answer. */
  finalValue: unknown
  /** For aptitude: whether the final answer was correct. */
  correct?: boolean
}

// --- Profile (onboarding) ----------------------------------------

export interface Profile {
  country: string
  board: string
  subjects: string[]
  /** free-text subjects the user added that weren't in the list. */
  customSubjects: string[]
  ageBand?: string
  /** the taker's name (required). */
  takerLabel?: string
  /** the taker's email (required, validated). */
  email?: string
}

/**
 * What the browser sends to the Edge Function. Deliberately excludes any
 * computed psychometric scores, those are derived server-side / offline so
 * the interpretation never travels over the client network.
 */
export interface SubmissionPayload {
  name: string
  email: string
  result: {
    schemaVersion: number
    sessionId: string
    startedAt: number
    completedAt: number
    profile: Profile
    selectedModules: ModuleId[]
    questionOrder: string[]
    answers: Record<string, { value: unknown }>
    telemetry: QuestionTelemetry[]
    environment: AssessmentResult['environment']
  }
}

// --- Final payload submitted / stored ----------------------------

export interface AssessmentResult {
  schemaVersion: number
  sessionId: string
  startedAt: number
  completedAt: number
  profile: Profile
  /** Which adaptive deep-dive modules the router chose for this student. */
  selectedModules: ModuleId[]
  /** The exact order questions were served in (core + adaptive tail). */
  questionOrder: string[]
  /** Raw per-question telemetry, the heart of the later analysis. */
  telemetry: QuestionTelemetry[]
  /** Pre-computed construct scores (convenience; raw data is authoritative). */
  scores: ComputedScores
  environment: {
    userAgent: string
    language: string
    screen: { w: number; h: number }
    timezone: string
  }
}

export interface ComputedScores {
  riasec: Record<RiasecCode, number>
  bigfive: Record<BigFiveTrait, number>
  values: Record<WorkValue, number>
  aptitude: {
    byDomain: Record<AptitudeDomain, { correct: number; total: number; avgMs: number }>
    totalCorrect: number
    totalItems: number
  }
}
