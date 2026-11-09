import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/** The compass mark, a small, drawn brand glyph (not stock/emoji). */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="20" fill="none" stroke="#1F4D43" strokeWidth="2" />
      <path d="M24 9 L29 24 L24 39 L19 24 Z" fill="#BE6A2E" />
      <path d="M24 9 L29 24 L24 24 Z" fill="#1F4D43" />
      <circle cx="24" cy="24" r="2.2" fill="#1C1917" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Mark />
      <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.22em] text-ink">
        Pathfinder
      </span>
    </div>
  )
}

/** Small-caps label used as a section kicker, with a clay tick. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-[7px] w-[7px] rotate-45 bg-clay" aria-hidden />
      <span className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
        {children}
      </span>
    </div>
  )
}

/** Thin editorial progress rule (not a chunky bar). */
export function ProgressRule({ value }: { value: number }) {
  return (
    <div className="relative h-px w-full bg-line" role="progressbar" aria-valuenow={Math.round(value * 100)}>
      <motion.div
        className="absolute left-0 top-0 h-px bg-spruce"
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 24 }}
      />
      <span
        className="absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-spruce"
        style={{ left: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        aria-hidden
      />
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center gap-2 rounded-[10px] bg-spruce px-6 py-3 font-sans text-[15px] font-semibold text-paper transition-colors hover:bg-spruce-deep disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
      <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
        →
      </span>
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-3 font-sans text-[15px] font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-0"
    >
      {children}
    </button>
  )
}

/** The page frame: paper canvas, top rail, centred editorial column. */
export function Shell({
  kicker,
  progress,
  children,
  footer,
}: {
  kicker?: ReactNode
  progress?: number | null
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-full flex-col bg-paper">
      <header className="mx-auto w-full max-w-[780px] px-5 pt-6 sm:pt-8">
        <div className="flex items-center justify-between">
          <Wordmark />
          {kicker ? <div className="hidden sm:block">{kicker}</div> : <span />}
        </div>
        {progress != null && (
          <div className="mt-5">
            <ProgressRule value={progress} />
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-[780px] flex-1 flex-col px-5 py-8 sm:py-12">
        {kicker && <div className="mb-6 sm:hidden">{kicker}</div>}
        {children}
      </main>

      {footer && (
        <footer className="sticky bottom-0 border-t border-line bg-paper/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[780px] items-center justify-between px-5 py-4">
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}
