import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shell, PrimaryButton, GhostButton, Kicker } from './ui'
import { Icon } from './icons'
import { SUBJECTS } from '../data/geography'

interface CustomSubject {
  id: string
  name: string
}

export function SubjectPicker({
  onNext,
  onBack,
}: {
  onNext: (v: { subjects: string[]; customSubjects: string[] }) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [custom, setCustom] = useState<CustomSubject[]>([])
  const [query, setQuery] = useState('')

  const all = useMemo(() => [...SUBJECTS, ...custom], [custom])
  const q = query.trim().toLowerCase()
  const filtered = q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all
  const exactExists = all.some((s) => s.name.toLowerCase() === q)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addCustom() {
    const name = query.trim()
    if (!name || exactExists) return
    const id = `custom:${name.toLowerCase().replace(/\s+/g, '-')}`
    setCustom((c) => [...c, { id, name }])
    setSelected((prev) => new Set(prev).add(id))
    setQuery('')
  }

  const count = selected.size

  function finish() {
    const builtIn: string[] = []
    const customNames: string[] = []
    selected.forEach((id) => {
      if (id.startsWith('custom:')) {
        const c = custom.find((x) => x.id === id)
        if (c) customNames.push(c.name)
      } else {
        builtIn.push(id)
      }
    })
    // Store built-in ids + custom display names; both go into profile.subjects
    // for routing, with custom names also kept separately.
    onNext({ subjects: [...builtIn, ...customNames], customSubjects: customNames })
  }

  return (
    <Shell
      kicker={<Kicker>Section 02 · Your subjects</Kicker>}
      footer={
        <>
          <GhostButton onClick={onBack}>← Back</GhostButton>
          <div className="flex items-center gap-4">
            <span className="font-sans text-[13.5px] text-ink-soft">
              {count === 0 ? 'Pick at least one' : `${count} selected`}
            </span>
            <PrimaryButton disabled={count === 0} onClick={finish}>
              Continue
            </PrimaryButton>
          </div>
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="max-w-[640px] font-display text-[clamp(1.7rem,4vw,2.3rem)] font-medium leading-tight tracking-[-0.015em] text-ink">
          Which subjects are you taking in Class&nbsp;12?
        </h2>
        <p className="mt-3 max-w-[560px] font-sans text-[16px] leading-relaxed text-ink-soft">
          Tap all that apply. Can’t find one? Type it in and add it yourself.
        </p>

        {/* Search / add */}
        <div className="mt-7 flex max-w-md items-stretch gap-2">
          <input
            name="subjectSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !exactExists && q) addCustom()
            }}
            placeholder="Search or add a subject…"
            className="w-full rounded-[10px] border border-line bg-surface px-4 py-2.5 font-sans text-[15px] text-ink outline-none placeholder:text-ink-soft/60 focus:border-spruce"
          />
          {q && !exactExists && (
            <button
              type="button"
              onClick={addCustom}
              className="whitespace-nowrap rounded-[10px] border border-spruce bg-spruce px-4 py-2.5 font-sans text-[14px] font-semibold text-paper hover:bg-spruce-deep"
            >
              Add “{query.trim()}”
            </button>
          )}
        </div>

        {/* Chips */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <AnimatePresence initial={false}>
            {filtered.map((s) => {
              const on = selected.has(s.id)
              return (
                <motion.button
                  key={s.id}
                  layout
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={on}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.97 }}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-[15px] transition-colors',
                    on
                      ? 'border-spruce bg-spruce-tint text-spruce font-semibold'
                      : 'border-line bg-surface text-ink hover:border-ink-soft',
                  ].join(' ')}
                >
                  <Icon name={s.id} size={17} className={on ? 'text-spruce' : 'text-ink-soft'} />
                  {s.name}
                  {on && <span aria-hidden className="text-spruce">✓</span>}
                </motion.button>
              )
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="font-sans text-[15px] text-ink-soft">
              No matches, press “Add” to include it.
            </p>
          )}
        </div>
      </motion.div>
    </Shell>
  )
}
