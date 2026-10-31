import { lazy, Suspense, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CircleAlert, ScanLine } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { analysisHandleSchema } from '@/features/privacy-stream/analysis-handle'
import { useAnalysisStream } from '@/features/privacy-stream/use-analysis-stream'

const StreamingPage = lazy(() => import('@/pages/streaming-page'))

function AnalysisStart({
  initialHandle,
  onStart,
}: {
  initialHandle: string
  onStart: (handle: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const submitting = useRef(false)
  const [handle, setHandle] = useState(initialHandle)
  const [error, setError] = useState(
    initialHandle && !analysisHandleSchema.safeParse(initialHandle).success
      ? '아이디를 확인하고 다시 제출해 주세요.'
      : '',
  )
  function submitAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const result = analysisHandleSchema.safeParse(handle)
    if (!result.success) {
      setError(result.error.issues[0].message)
      inputRef.current?.focus()
      return
    }
    submitting.current = true
    setError('')
    onStart(result.data)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <>
      <a
        className="absolute top-[16px] left-[16px] z-500 -translate-y-[200%] rounded-input bg-primary px-[24px] py-[12px] text-primary-foreground focus-visible:translate-y-0"
        href="#start-main"
      >
        본문으로 이동
      </a>
      <AppHeader />
      <main
        id="start-main"
        className="mx-auto min-h-[calc(100dvh-73px)] w-full max-w-[800px] px-[32px] pt-[72px] pb-[40px] [@media(max-width:45rem)]:min-h-[calc(100dvh-65px)] [@media(max-width:45rem)]:px-[20px] [@media(max-width:45rem)]:pt-[48px] [@media(max-width:45rem)]:pb-[32px]"
      >
        <div className="text-center">
          <span className="inline-flex items-center gap-[8px] text-[14px] font-medium text-primary">
            <ScanLine size={16} aria-hidden="true" />
            SNS 개인정보 노출 분석
          </span>
          <h1 className="mt-[24px] text-[clamp(32px,4vw,46px)] leading-[1.4] font-semibold tracking-[-0.05em] break-keep text-foreground [@media(max-width:45rem)]:text-[32px]">
            내 일상은,
            <br />
            어디까지 드러나 있을까요?
          </h1>
          <p className="mt-[24px] text-[16px] leading-[1.9] break-keep text-ink-secondary [@media(max-width:45rem)]:text-[14px]">
            게시물 하나, 댓글 한 줄에 남은 개인정보의 단서.
            <br className="[@media(max-width:45rem)]:hidden" />
            나를 드러내는 정보와 보호 방법을 함께 살펴보세요.
          </p>
        </div>

        <form
          className="mt-[40px] rounded-[14px] border border-border bg-card p-[28px] [@media(max-width:45rem)]:mt-[32px] [@media(max-width:45rem)]:px-[16px] [@media(max-width:45rem)]:py-[24px]"
          onSubmit={(event) => void submitAnalysis(event)}
          noValidate
        >
          <div className="flex gap-[12px] [@media(max-width:45rem)]:flex-col">
            <div
              className="flex min-h-[56px] min-w-0 flex-1 items-center gap-[8px] rounded-input border border-input bg-card px-[16px] focus-within:border-ring focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring data-[invalid=true]:border-destructive data-[invalid=true]:focus-within:border-destructive"
              data-invalid={!!error}
            >
              <span
                className="text-[18px] text-muted-foreground"
                aria-hidden="true"
              >
                @
              </span>
              <input
                ref={inputRef}
                id="instagram-handle"
                name="handle"
                type="text"
                placeholder="instagram_id"
                value={handle}
                className="min-h-[54px] min-w-0 w-full border-0 bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground"
                onChange={(event) => {
                  setHandle(event.target.value)
                  if (error) setError('')
                }}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Instagram 아이디"
                aria-invalid={!!error}
                aria-describedby={error ? 'handle-error' : undefined}
                enterKeyHint="go"
              />
            </div>
            <Button
              type="submit"
              className="min-h-[56px] shrink-0 gap-[12px] rounded-[6px] bg-clip-border px-[24px] text-sm transition-colors"
            >
              분석 시작하기
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
          {error ? (
            <p
              id="handle-error"
              className="mt-[8px] flex items-start gap-[8px] text-[14px] leading-[1.7] text-destructive"
              role="alert"
            >
              <CircleAlert size={14} className="mt-[4px]" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </form>
      </main>
    </>
  )
}

function AnalysisSession({ initialHandle }: { initialHandle: string }) {
  const stream = useAnalysisStream()
  if (stream.status === 'idle') {
    return (
      <AnalysisStart initialHandle={initialHandle} onStart={stream.start} />
    )
  }
  return (
    <Suspense
      fallback={
        <>
          <AppHeader />
          <main className="mx-auto min-h-[calc(100dvh-73px)] w-full max-w-[880px] px-[40px] py-[56px] [@media(max-width:45rem)]:min-h-[calc(100dvh-65px)] [@media(max-width:45rem)]:px-[20px] [@media(max-width:45rem)]:py-[32px]">
            <section
              className="mt-[40px] min-h-[220px] rounded-card border border-border bg-card px-[32px] py-[28px] [@media(max-width:45rem)]:mt-[24px] [@media(max-width:45rem)]:px-[16px] [@media(max-width:45rem)]:py-[24px]"
              aria-label="분석 답변"
            >
              <p className="text-[14px] text-muted-foreground" role="status">
                분석 화면을 불러오고 있어요…
              </p>
            </section>
          </main>
        </>
      }
    >
      <StreamingPage stream={stream} />
    </Suspense>
  )
}

function HomePage() {
  const [params] = useSearchParams()
  const location = useLocation()
  // Navigation home ends this run. Reloads only prefill the input, never POST.
  return (
    <AnalysisSession
      key={location.key}
      initialHandle={params.get('handle') ?? ''}
    />
  )
}

export default HomePage
