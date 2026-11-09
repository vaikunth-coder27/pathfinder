import { motion } from 'framer-motion'
import { Shell, PrimaryButton, GhostButton, Kicker } from './ui'

export function Welcome({
  onBegin,
  onResume,
  resumable,
}: {
  onBegin: () => void
  onResume?: () => void
  resumable?: boolean
}) {
  return (
    <Shell kicker={<Kicker>A quiet 25 minutes</Kicker>}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-[640px]"
      >
        <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-clay">
          Pathfinder
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.05rem,7vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
          Let’s find the shape of what you’re drawn to.
        </h1>

        <div className="mt-7 space-y-4 font-sans text-[17px] leading-relaxed text-ink-soft">
          <p>
            This isn’t an exam. There’s nothing to revise and nothing to pass. It’s a set of
            questions, some playful, some that make you think, designed to notice what genuinely
            pulls at your attention and where your mind is sharp.
          </p>
          <p>
            Answer honestly and on instinct. Your first reaction is usually the truest one. The
            questions quietly adapt to you as you go, so no two people walk exactly the same path.
          </p>
          <p className="text-ink">
            Find a calm spot where you won’t be rushed. It takes about&nbsp;25&nbsp;minutes.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={onBegin}>{resumable ? 'Start again' : 'Begin'}</PrimaryButton>
          {resumable && onResume && (
            <GhostButton onClick={onResume}>Resume where I left off</GhostButton>
          )}
        </div>

        <p className="mt-10 border-t border-line pt-5 font-sans text-[13.5px] leading-relaxed text-ink-soft">
          Your answers are saved only to send to the person helping you reflect on them. You won’t
          be shown a score at the end. This is about gathering an honest picture, not judging you.
        </p>
      </motion.div>
    </Shell>
  )
}
