import { motion } from 'framer-motion'
import type { Question } from '../types'
import { Icon, FACE_ICONS } from './icons'

export function isAnswered(q: Question, value: unknown): boolean {
  if (q.kind === 'reflection') return true // optional
  if (value == null) return false
  if (q.kind === 'rank') return Array.isArray(value) && value.length === (q.options?.length ?? 0)
  if (q.kind === 'spectrum') return typeof value === 'number'
  return true
}

interface RProps {
  question: Question
  value: unknown
  onChange: (v: unknown) => void
}

export function QuestionView({ question, value, onChange }: RProps) {
  switch (question.kind) {
    case 'likert':
      return <Likert question={question} value={value as number} onChange={onChange} />
    case 'spectrum':
      return <Spectrum question={question} value={value as number} onChange={onChange} />
    case 'thisOrThat':
      return <ThisOrThat question={question} value={value as string} onChange={onChange} />
    case 'scenario':
      return <Scenario question={question} value={value as string} onChange={onChange} />
    case 'aptitude':
      return <Aptitude question={question} value={value as string} onChange={onChange} />
    case 'rank':
      return <Rank question={question} value={value as string[]} onChange={onChange} />
    case 'reflection':
      return <Reflection question={question} value={value as string} onChange={onChange} />
    default:
      return null
  }
}

// --- shared chrome -------------------------------------------------

function Stem({ question }: { question: Question }) {
  return (
    <div>
      <h2 className="font-display text-[clamp(1.5rem,3.6vw,2.15rem)] font-medium leading-[1.18] tracking-[-0.015em] text-ink">
        {question.prompt}
      </h2>
      {question.helper && (
        <p className="mt-3 font-sans text-[15.5px] leading-relaxed text-ink-soft">{question.helper}</p>
      )}
      {question.stemSvg && (
        <div
          className="mt-6 rounded-[14px] border border-line bg-surface px-4 py-6"
          dangerouslySetInnerHTML={{ __html: question.stemSvg }}
        />
      )}
    </div>
  )
}

// --- Likert (enjoy / agree) ---------------------------------------

function Likert({ question, value, onChange }: { question: Question; value?: number; onChange: (v: number) => void }) {
  const scale = question.scale!
  const steps = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i)
  return (
    <div>
      <Stem question={question} />
      <div className="mt-9">
        <div className="flex items-stretch gap-2 sm:gap-3">
          {steps.map((s, i) => {
            const on = value === s
            const Face = scale.faces ? FACE_ICONS[i] : null
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                aria-pressed={on}
                aria-label={`${i + 1} of ${steps.length}`}
                className={[
                  'flex flex-1 flex-col items-center justify-center gap-2 rounded-[12px] border py-4 transition-all',
                  on ? 'border-spruce bg-spruce-tint' : 'border-line bg-surface hover:border-ink-soft',
                ].join(' ')}
              >
                {Face ? (
                  <Face
                    size={28}
                    strokeWidth={on ? 2 : 1.75}
                    className={['transition-colors', on ? 'text-spruce' : 'text-ink-soft/55'].join(' ')}
                    aria-hidden
                  />
                ) : (
                  <span
                    className={['rounded-full transition-all', on ? 'bg-spruce' : 'bg-ink-soft/30'].join(' ')}
                    style={{ width: 12 + i * 5, height: 12 + i * 5 }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex justify-between font-sans text-[13px] font-medium text-ink-soft">
          <span>{scale.minLabel}</span>
          <span>{scale.maxLabel}</span>
        </div>
      </div>
    </div>
  )
}

// --- Spectrum slider ----------------------------------------------

function Spectrum({ question, value, onChange }: { question: Question; value?: number; onChange: (v: number) => void }) {
  const scale = question.scale!
  const current = value ?? 50
  const touched = typeof value === 'number'
  return (
    <div>
      <Stem question={question} />
      <div className="mt-10">
        <div className="mb-4 flex justify-between gap-6 font-sans text-[15px] font-medium text-ink">
          <span className="max-w-[44%] text-left">{scale.minLabel}</span>
          <span className="max-w-[44%] text-right">{scale.maxLabel}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${scale.minLabel} to ${scale.maxLabel}`}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-line outline-none [accent-color:var(--color-spruce)]"
          style={{ accentColor: '#1F4D43' }}
        />
        <p className="mt-5 text-center font-sans text-[13.5px] text-ink-soft">
          {touched ? 'Slide to fine-tune, or continue' : 'Drag the slider to where you sit'}
        </p>
      </div>
    </div>
  )
}

// --- This or That --------------------------------------------------

function ThisOrThat({ question, value, onChange }: { question: Question; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Stem question={question} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {question.options!.map((o) => {
          const on = value === o.id
          return (
            <motion.button
              key={o.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(o.id)}
              aria-pressed={on}
              className={[
                'flex min-h-[150px] flex-col items-start justify-between gap-5 rounded-[16px] border p-6 text-left transition-all',
                on ? 'border-spruce bg-spruce-tint' : 'border-line bg-surface hover:border-ink-soft',
              ].join(' ')}
            >
              <Icon name={o.icon} size={30} className="text-spruce" />
              <span className="font-sans text-[17px] font-medium leading-snug text-ink">{o.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// --- Scenario (vertical cards) ------------------------------------

function Scenario({ question, value, onChange }: { question: Question; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Stem question={question} />
      <div className="mt-8 flex flex-col gap-3">
        {question.options!.map((o) => {
          const on = value === o.id
          return (
            <motion.button
              key={o.id}
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange(o.id)}
              aria-pressed={on}
              className={[
                'flex items-center gap-4 rounded-[14px] border px-5 py-4 text-left transition-all',
                on ? 'border-spruce bg-spruce-tint' : 'border-line bg-surface hover:border-ink-soft',
              ].join(' ')}
            >
              <Icon name={o.icon} size={22} className="shrink-0 text-spruce" />
              <span className="font-sans text-[16.5px] leading-snug text-ink">{o.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// --- Aptitude ------------------------------------------------------

function Aptitude({ question, value, onChange }: { question: Question; value?: string; onChange: (v: string) => void }) {
  const svgOptions = question.options!.some((o) => o.svg)
  return (
    <div>
      <div className="mb-5">
        <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-clay">
          {question.domain} reasoning
        </span>
      </div>
      <Stem question={question} />
      <div className={svgOptions ? 'mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4' : 'mt-8 flex flex-col gap-3'}>
        {question.options!.map((o) => {
          const on = value === o.id
          return (
            <motion.button
              key={o.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(o.id)}
              aria-pressed={on}
              className={[
                'rounded-[12px] border text-left transition-all',
                svgOptions ? 'flex aspect-square items-center justify-center p-4' : 'px-5 py-4',
                on ? 'border-spruce bg-spruce-tint' : 'border-line bg-surface hover:border-ink-soft',
              ].join(' ')}
            >
              {o.svg ? (
                <span className="block h-full w-full" dangerouslySetInnerHTML={{ __html: o.svg }} />
              ) : (
                <span className="font-sans text-[16.5px] font-medium text-ink">{o.label}</span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// --- Rank (tap to order) ------------------------------------------

function Rank({ question, value, onChange }: { question: Question; value?: string[]; onChange: (v: string[]) => void }) {
  const order = value ?? []
  const options = question.options!
  const ranked = order.map((id) => options.find((o) => o.id === id)!).filter(Boolean)
  const unranked = options.filter((o) => !order.includes(o.id))

  const add = (id: string) => onChange([...order, id])
  const remove = (id: string) => onChange(order.filter((x) => x !== id))
  const move = (id: string, dir: -1 | 1) => {
    const idx = order.indexOf(id)
    const to = idx + dir
    if (to < 0 || to >= order.length) return
    const next = [...order]
    ;[next[idx], next[to]] = [next[to], next[idx]]
    onChange(next)
  }

  return (
    <div>
      <Stem question={question} />

      {ranked.length > 0 && (
        <ol className="mt-7 flex flex-col gap-2">
          {ranked.map((o, i) => (
            <motion.li
              layout
              key={o.id}
              className="flex items-center gap-3 rounded-[12px] border border-spruce bg-spruce-tint px-3 py-2.5"
            >
              <span className="numeral w-7 text-center text-[22px] text-spruce">{i + 1}</span>
              <Icon name={o.icon} size={20} className="shrink-0 text-spruce" />
              <span className="flex-1 font-sans text-[15.5px] font-medium text-ink">{o.label}</span>
              <div className="flex items-center gap-1">
                <IconBtn label="Move up" onClick={() => move(o.id, -1)} disabled={i === 0}>↑</IconBtn>
                <IconBtn label="Move down" onClick={() => move(o.id, 1)} disabled={i === ranked.length - 1}>↓</IconBtn>
                <IconBtn label="Remove" onClick={() => remove(o.id)}>✕</IconBtn>
              </div>
            </motion.li>
          ))}
        </ol>
      )}

      {unranked.length > 0 && (
        <>
          <p className="mt-6 font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            {ranked.length === 0 ? 'Tap in order, most important first' : 'Tap to add the next one'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {unranked.map((o) => (
              <motion.button
                layout
                key={o.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => add(o.id)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-sans text-[15px] text-ink transition-colors hover:border-ink-soft"
              >
                <Icon name={o.icon} size={17} className="text-spruce" />
                {o.label}
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:opacity-25"
    >
      {children}
    </button>
  )
}

// --- Reflection ----------------------------------------------------

function Reflection({ question, value, onChange }: { question: Question; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Stem question={question} />
      <textarea
        name={question.id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={5}
        className="mt-7 w-full resize-none rounded-[14px] border border-line bg-surface px-5 py-4 font-sans text-[16.5px] leading-relaxed text-ink outline-none placeholder:text-ink-soft/55 focus:border-spruce"
      />
      <p className="mt-2 font-sans text-[13px] text-ink-soft">Optional, you can skip this.</p>
    </div>
  )
}
