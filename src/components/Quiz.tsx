import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { ModuleId, Profile, QuestionTelemetry } from '../types'
import { CORE, MODULE_META } from '../data/questions'
import { QUESTION_BY_ID, type AnswerEntry } from '../engine/scoring'
import { buildTail } from '../engine/router'
import { TelemetryTracker } from '../engine/telemetry'
import { saveProgress } from '../engine/storage'
import { Shell, PrimaryButton, GhostButton, Kicker } from './ui'
import { QuestionView, isAnswered } from './renderers'

const CORE_IDS = CORE.map((q) => q.id)
const EST_TAIL = 12 // rough tail length for a stable progress bar before it's known

export interface QuizDone {
  answers: Record<string, AnswerEntry>
  telemetry: QuestionTelemetry[]
  order: string[]
  selectedModules: ModuleId[]
}

export interface QuizInitial {
  answers: Record<string, AnswerEntry>
  tailPlan: string[] | null
  index: number
  selectedModules: ModuleId[]
}

export function Quiz({
  profile,
  sessionId,
  startedAt,
  initial,
  onComplete,
}: {
  profile: Profile
  sessionId: string
  startedAt: number
  initial?: QuizInitial
  onComplete: (d: QuizDone) => void
}) {
  const trackerRef = useRef<TelemetryTracker | null>(null)
  if (!trackerRef.current) trackerRef.current = new TelemetryTracker()
  const tracker = trackerRef.current

  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>(initial?.answers ?? {})
  const [tailPlan, setTailPlan] = useState<string[] | null>(initial?.tailPlan ?? null)
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(initial?.selectedModules ?? [])
  const [index, setIndex] = useState<number>(initial?.index ?? 0)

  const fullPlan = useMemo(() => [...CORE_IDS, ...(tailPlan ?? [])], [tailPlan])
  const currentId = fullPlan[index]
  const current = QUESTION_BY_ID[currentId]

  const total = CORE_IDS.length + (tailPlan ? tailPlan.length : EST_TAIL)
  const progress = Math.min(0.99, index / total)

  useEffect(() => () => tracker.dispose(), [tracker])

  // Lifecycle: mark question shown, and accumulate dwell when leaving it.
  useEffect(() => {
    if (!current) return
    tracker.show(current)
    return () => tracker.leave(current.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  // Persist a resume snapshot whenever meaningful state changes.
  useEffect(() => {
    saveProgress({
      sessionId,
      startedAt,
      profile,
      answers,
      corePlan: CORE_IDS,
      tailPlan,
      index,
      stage: 'quiz',
    })
  }, [answers, index, tailPlan, sessionId, startedAt, profile])

  if (!current) return null

  const value = answers[currentId]?.value
  const answered = isAnswered(current, value)

  function setValue(v: unknown) {
    setAnswers((prev) => ({ ...prev, [currentId]: { value: v } }))
    tracker.interact(currentId, v)
  }

  function goBack() {
    if (index > 0) setIndex((i) => i - 1)
  }

  function goNext() {
    // record commit (+ correctness for aptitude)
    let correct: boolean | undefined
    if (current.kind === 'aptitude') {
      correct = !!current.options?.find((o) => o.id === value)?.correct
    }
    tracker.commit(currentId, correct)

    const atCoreEnd = tailPlan === null && index === CORE_IDS.length - 1
    if (atCoreEnd) {
      // The pivotal moment: choose deep-dive modules from the running profile.
      const withCurrent = { ...answers, [currentId]: { value } }
      const tail = buildTail(withCurrent, profile)
      setTailPlan(tail.questionIds)
      setSelectedModules(tail.selectedModules)
      setIndex((i) => i + 1)
      return
    }

    const isLast = index >= fullPlan.length - 1
    if (isLast) {
      tracker.leave(currentId)
      onComplete({
        answers: { ...answers, [currentId]: { value } },
        telemetry: tracker.export(fullPlan),
        order: fullPlan,
        selectedModules,
      })
      return
    }
    setIndex((i) => i + 1)
  }

  const moduleTitle = current.module ? MODULE_META[current.module].title : null
  const kickerText = moduleTitle ? `${current.section} · ${moduleTitle}` : current.section

  return (
    <Shell
      kicker={<Kicker>{kickerText}</Kicker>}
      progress={progress}
      footer={
        <>
          <GhostButton onClick={goBack} disabled={index === 0}>
            ← Back
          </GhostButton>
          <PrimaryButton disabled={!answered} onClick={goNext}>
            {current.optional && !value ? 'Skip' : 'Continue'}
          </PrimaryButton>
        </>
      }
    >
      {/*
        A plain keyed transition (no AnimatePresence exit-wait). Changing `key`
        unmounts the old question and mounts the new one, which animates in.
        This can never freeze mid-exit, so navigation is always in sync with
        the current question even if the student taps quickly.
      */}
      <motion.div
        key={currentId}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.26, ease: 'easeOut' }}
        className="max-w-[680px]"
      >
        <QuestionView question={current} value={value} onChange={setValue} />
      </motion.div>
    </Shell>
  )
}
