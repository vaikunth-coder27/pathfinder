import { motion } from 'framer-motion'
import { Shell, Kicker, Mark, GhostButton } from './ui'

export type SubmitStatus = 'sending' | 'saved' | 'failed'

export function Completion({
  name,
  status,
  onRetry,
}: {
  name?: string
  status: SubmitStatus
  onRetry: () => void
}) {
  return (
    <Shell kicker={<Kicker>All done</Kicker>}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex max-w-[620px] flex-1 flex-col justify-center py-10"
      >
        <div className="mb-7">
          <Mark size={40} />
        </div>

        <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.08] tracking-[-0.02em] text-ink">
          {name ? `Thank you, ${name}.` : 'Thank you.'}
        </h1>

        <div className="mt-6 space-y-4 font-sans text-[17px] leading-relaxed text-ink-soft">
          <p>
            That’s everything. You answered thoughtfully. There was no right or wrong, and nothing
            here was a test of worth.
          </p>
          <p>
            There’s no score to show you, and that’s on purpose. These answers paint an honest
            picture of what pulls at you and where you’re sharp, something best talked through
            together, not reduced to a number.
          </p>
        </div>

        <div className="mt-9 rounded-[14px] border border-line bg-surface px-5 py-4">
          <StatusLine status={status} />
          {status === 'failed' && (
            <div className="mt-2">
              <GhostButton onClick={onRetry}>Try saving again</GhostButton>
            </div>
          )}
        </div>

        {status === 'saved' && (
          <p className="mt-8 font-sans text-[14px] leading-relaxed text-ink-soft">
            You can close this tab now. Take a breath. You’ve just done something genuinely useful
            for yourself.
          </p>
        )}
      </motion.div>
    </Shell>
  )
}

function StatusLine({ status }: { status: SubmitStatus }) {
  const map: Record<SubmitStatus, { dot: string; text: string }> = {
    sending: { dot: 'bg-clay', text: 'Saving your responses securely…' },
    saved: { dot: 'bg-spruce', text: 'Your responses have been saved securely. All set.' },
    failed: {
      dot: 'bg-clay',
      text: 'We couldn’t save just now, please check your connection and try again.',
    },
  }
  const s = map[status]
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden />
      <span className="font-sans text-[15px] font-medium text-ink">{s.text}</span>
    </div>
  )
}
