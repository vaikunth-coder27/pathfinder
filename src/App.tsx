import { useEffect, useRef, useState } from 'react'
import type { Profile, SubmissionPayload } from './types'
import { Welcome } from './components/Welcome'
import { Onboarding } from './components/Onboarding'
import { SubjectPicker } from './components/SubjectPicker'
import { Quiz, type QuizDone, type QuizInitial } from './components/Quiz'
import { Completion, type SubmitStatus } from './components/Completion'
import { buildTail } from './engine/router'
import { clearProgress, loadProgress, saveResult } from './engine/storage'
import { submitPayload } from './engine/submit'

type Stage = 'welcome' | 'onboarding' | 'subjects' | 'quiz' | 'done'

const emptyProfile = (): Profile => ({
  country: '',
  board: '',
  subjects: [],
  customSubjects: [],
})

function newSessionId() {
  return `pf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export default function App() {
  const [stage, setStage] = useState<Stage>('welcome')
  const [profile, setProfile] = useState<Profile>(emptyProfile())
  const [session, setSession] = useState<{ id: string; startedAt: number }>({
    id: newSessionId(),
    startedAt: Date.now(),
  })
  const [quizInitial, setQuizInitial] = useState<QuizInitial | undefined>(undefined)
  const [resumable, setResumable] = useState(false)

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('sending')
  const lastPayload = useRef<SubmissionPayload | null>(null)

  async function send(payload: SubmissionPayload) {
    setSubmitStatus('sending')
    const outcome = await submitPayload(payload)
    setSubmitStatus(outcome.ok ? 'saved' : 'failed')
  }

  // Detect an unfinished session on load.
  useEffect(() => {
    const snap = loadProgress()
    if (snap && snap.stage === 'quiz' && snap.answers && Object.keys(snap.answers).length > 0) {
      setResumable(true)
    }
  }, [])

  function begin() {
    clearProgress()
    setProfile(emptyProfile())
    setSession({ id: newSessionId(), startedAt: Date.now() })
    setQuizInitial(undefined)
    setResumable(false)
    setStage('onboarding')
  }

  function resume() {
    const snap = loadProgress()
    if (!snap) return begin()
    const resumedProfile = snap.profile as Profile
    setProfile(resumedProfile)
    setSession({ id: snap.sessionId, startedAt: snap.startedAt })
    // Re-derive the chosen modules deterministically from the saved answers.
    const selectedModules = snap.tailPlan
      ? buildTail(snap.answers, resumedProfile).selectedModules
      : []
    setQuizInitial({
      answers: snap.answers,
      tailPlan: snap.tailPlan,
      index: snap.index,
      selectedModules,
    })
    setStage('quiz')
  }

  function handleComplete(d: QuizDone) {
    // Raw datapoints only, NO computed psychometric scores are sent. The
    // interpretation is derived server-side / offline so it never travels
    // over the client network and can't be read or gamed from the browser.
    const payload: SubmissionPayload = {
      name: profile.takerLabel || '',
      email: profile.email || '',
      result: {
        schemaVersion: 1,
        sessionId: session.id,
        startedAt: session.startedAt,
        completedAt: Date.now(),
        profile,
        selectedModules: d.selectedModules,
        questionOrder: d.order,
        answers: d.answers,
        telemetry: d.telemetry,
        environment: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screen: { w: window.screen.width, h: window.screen.height },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    }
    lastPayload.current = payload
    saveResult(payload) // local backup for retry only
    clearProgress()
    setStage('done')
    void send(payload)
  }

  switch (stage) {
    case 'welcome':
      return <Welcome onBegin={begin} onResume={resume} resumable={resumable} />
    case 'onboarding':
      return (
        <Onboarding
          onBack={() => setStage('welcome')}
          onNext={(v) => {
            setProfile((p) => ({
              ...p,
              country: v.country,
              board: v.board,
              takerLabel: v.takerLabel,
              email: v.email,
              ageBand: v.ageBand,
            }))
            setStage('subjects')
          }}
        />
      )
    case 'subjects':
      return (
        <SubjectPicker
          onBack={() => setStage('onboarding')}
          onNext={(v) => {
            setProfile((p) => ({ ...p, subjects: v.subjects, customSubjects: v.customSubjects }))
            setStage('quiz')
          }}
        />
      )
    case 'quiz':
      return (
        <Quiz
          profile={profile}
          sessionId={session.id}
          startedAt={session.startedAt}
          initial={quizInitial}
          onComplete={handleComplete}
        />
      )
    case 'done':
      return (
        <Completion
          name={profile.takerLabel || undefined}
          status={submitStatus}
          onRetry={() => lastPayload.current && send(lastPayload.current)}
        />
      )
  }
}
