import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { exposedCount, type ScanState, type Stage } from '../scan-state.ts'

function useElapsed(start: number, end: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (end) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [end])
  return Math.max(0, Math.floor(((end ?? now) - start) / 1000))
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m ? `${m}분 ${String(s).padStart(2, '0')}초` : `${s}초`
}

function StageIcon({ state }: { state: Stage['state'] }) {
  if (state === 'running')
    return (
      <span
        aria-hidden
        className="size-3 animate-spin rounded-full border-[1.5px] border-fg-2 border-t-transparent"
      />
    )
  if (state === 'error')
    return (
      <span aria-hidden className="text-[11px] font-bold text-alert">
        ×
      </span>
    )
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="size-3 text-muted">
      <path
        d="M2.5 6.2 5 8.5l4.5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="tabular mt-0.5 truncate text-[17px] font-semibold tracking-[-0.01em] text-fg">
        {value}
      </div>
    </div>
  )
}

const TITLE: Record<ScanState['phase'], string> = {
  idle: '',
  running: '추적 중',
  done: '추적 완료',
  stopped: '추적 중단',
  error: '추적 실패',
}

export function ProgressPanel({ state }: { state: ScanState }) {
  const elapsed = useElapsed(state.startedAt, state.finishedAt)
  const running = state.phase === 'running'
  const exposed = exposedCount(state)
  const logRef = useRef<HTMLOListElement>(null)
  const stages = state.stages.slice(-40)

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.stages])

  const friends =
    (state.stats?.friends ?? 0) +
    state.stages.filter((s) => s.id.includes(':get_') && s.state === 'done')
      .length

  return (
    <section className="panel overflow-hidden" aria-label="추적 진행 상황">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {running ? (
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-alert opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-alert" />
            </span>
          ) : (
            <span
              className={cn(
                'size-2.5 rounded-full',
                state.phase === 'done' ? 'bg-fg-2' : 'bg-faint',
              )}
            />
          )}
          <h2 className="truncate text-[15px] font-semibold text-fg">
            <span className="text-fg-2">@{state.handle}</span>{' '}
            {TITLE[state.phase]}
          </h2>
        </div>
        <span
          className={cn(
            'tabular shrink-0 rounded-full border px-2.5 py-0.5 text-[12px] font-medium',
            exposed
              ? 'border-alert-line bg-alert-soft text-alert-2'
              : 'border-line text-muted',
          )}
        >
          노출 {exposed}건
        </span>
      </div>

      <div className="px-5 pt-4 sm:px-6">
        <div
          className="relative h-1.5 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={state.progress}
          aria-label="진행률"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6b6b74] via-[#c9c9cf] to-white"
            initial={false}
            animate={{ width: `${state.progress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
          {running && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-[scan-sweep_2.2s_linear_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          )}
        </div>
        <div className="tabular mt-2 flex justify-between text-[12px] text-muted">
          <span>{state.progress}%</span>
          <span>{running ? '끝까지 파고드는 중' : ''}</span>
        </div>
      </div>

      <ol
        ref={logRef}
        aria-live="polite"
        className="mx-5 mt-3 max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-line bg-black/25 px-4 py-3 font-mono text-[12.5px] sm:mx-6"
      >
        <AnimatePresence initial={false}>
          {stages.length === 0 && (
            <li className="text-muted">대상 계정에 접근하는 중…</li>
          )}
          {stages.map((stage) => (
            <motion.li
              key={stage.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-center gap-2.5',
                stage.state === 'running' ? 'text-fg' : 'text-muted',
                stage.state === 'error' && 'text-alert-2',
              )}
            >
              <span className="flex size-3.5 items-center justify-center">
                <StageIcon state={stage.state} />
              </span>
              <span className="min-w-0 truncate">{stage.text}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line px-5 py-4 sm:grid-cols-4 sm:px-6">
        <Metric label="경과 시간" value={formatTime(elapsed)} />
        <Metric label="읽은 게시물" value={`${state.stats?.posts ?? 0}개`} />
        <Metric label="읽은 댓글" value={`${state.stats?.comments ?? 0}개`} />
        <Metric label="뒤져 본 주변 계정" value={`${friends}곳`} />
      </div>
    </section>
  )
}
