import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shell, PrimaryButton, GhostButton, Kicker } from './ui'
import { COUNTRIES } from '../data/geography'

const AGE_BANDS = ['Under 16', '16', '17', '18', 'Over 18']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Onboarding({
  onNext,
  onBack,
}: {
  onNext: (v: {
    country: string
    board: string
    takerLabel: string
    email: string
    ageBand?: string
  }) => void
  onBack: () => void
}) {
  const [country, setCountry] = useState<string | null>('IN')
  const [board, setBoard] = useState<string | null>('CBSE')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState<string | undefined>(undefined)
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({})

  const activeCountry = COUNTRIES.find((c) => c.id === country)
  const nameOk = name.trim().length >= 2 && name.trim().length <= 120
  const emailOk = EMAIL_RE.test(email.trim()) && email.trim().length <= 254
  const ready = !!country && !!board && nameOk && emailOk

  function submit() {
    setTouched({ name: true, email: true })
    if (!ready) return
    onNext({
      country: country!,
      board: board!,
      takerLabel: name.trim(),
      email: email.trim().toLowerCase(),
      ageBand: age,
    })
  }

  return (
    <Shell
      kicker={<Kicker>Section 01 · A little about you</Kicker>}
      footer={
        <>
          <GhostButton onClick={onBack}>← Back</GhostButton>
          <PrimaryButton disabled={!ready} onClick={submit}>
            Continue
          </PrimaryButton>
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-[640px]"
      >
        <h2 className="font-display text-[clamp(1.7rem,4vw,2.3rem)] font-medium leading-tight tracking-[-0.015em] text-ink">
          First, let’s set the scene.
        </h2>

        {/* Name */}
        <div className="mt-9">
          <label className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            What’s your name?
          </label>
          <input
            name="fullName"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            placeholder="Your name"
            aria-invalid={touched.name && !nameOk}
            className={[
              'mt-3 w-full max-w-sm rounded-[10px] border bg-surface px-4 py-3 font-sans text-[16px] text-ink outline-none placeholder:text-ink-soft/60 focus:border-spruce',
              touched.name && !nameOk ? 'border-clay' : 'border-line',
            ].join(' ')}
          />
          {touched.name && !nameOk && (
            <p className="mt-2 font-sans text-[13.5px] text-clay">Please enter your name.</p>
          )}
        </div>

        {/* Email */}
        <div className="mt-7">
          <label className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Your email
          </label>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="you@example.com"
            aria-invalid={touched.email && !emailOk}
            className={[
              'mt-3 w-full max-w-sm rounded-[10px] border bg-surface px-4 py-3 font-sans text-[16px] text-ink outline-none placeholder:text-ink-soft/60 focus:border-spruce',
              touched.email && !emailOk ? 'border-clay' : 'border-line',
            ].join(' ')}
          />
          {touched.email && !emailOk && (
            <p className="mt-2 font-sans text-[13.5px] text-clay">
              Please enter a valid email address.
            </p>
          )}
        </div>

        {/* Country */}
        <div className="mt-9">
          <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Where are you studying?
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {COUNTRIES.map((c) => (
              <OptionPill
                key={c.id}
                selected={country === c.id}
                disabled={!c.available}
                onClick={() => {
                  setCountry(c.id)
                  setBoard(c.boards.find((b) => b.available)?.id ?? null)
                }}
              >
                <span className="mr-2 font-sans text-[11px] font-semibold tracking-wider text-ink-soft/70">
                  {c.code}
                </span>
                {c.name}
                {!c.available && <span className="ml-1.5 text-[11px] text-ink-soft/70">soon</span>}
              </OptionPill>
            ))}
          </div>
        </div>

        {/* Board */}
        {activeCountry && activeCountry.boards.length > 0 && (
          <div className="mt-8">
            <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Which board?
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {activeCountry.boards.map((b) => (
                <OptionPill
                  key={b.id}
                  selected={board === b.id}
                  disabled={!b.available}
                  onClick={() => setBoard(b.id)}
                >
                  {b.name}
                  {!b.available && <span className="ml-1.5 text-[11px] text-ink-soft/70">soon</span>}
                </OptionPill>
              ))}
            </div>
          </div>
        )}

        {/* Age */}
        <div className="mt-8">
          <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            How old are you? <span className="normal-case text-ink-soft/70">(optional)</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {AGE_BANDS.map((a) => (
              <OptionPill key={a} selected={age === a} onClick={() => setAge(a === age ? undefined : a)}>
                {a}
              </OptionPill>
            ))}
          </div>
        </div>
      </motion.div>
    </Shell>
  )
}

function OptionPill({
  children,
  selected,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'rounded-full border px-4 py-2 font-sans text-[15px] transition-all',
        selected
          ? 'border-spruce bg-spruce-tint text-spruce font-semibold'
          : 'border-line bg-surface text-ink hover:border-ink-soft',
        disabled ? 'cursor-not-allowed opacity-45 hover:border-line' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
