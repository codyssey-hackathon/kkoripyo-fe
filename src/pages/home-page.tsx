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
      <a className="skip-link" href="#start-main">
        본문으로 이동
      </a>
      <AppHeader />
      <main id="start-main" className="analysis-start">
        <div className="analysis-intro">
          <span className="analysis-eyebrow">
            <ScanLine size={16} aria-hidden="true" />
            SNS 개인정보 노출 분석
          </span>
          <h1>
            내 일상은,
            <br />
            어디까지 드러나 있을까요?
          </h1>
          <p>
            게시물 하나, 댓글 한 줄에 남은 개인정보의 단서.
            <br className="analysis-desktop-break" />
            나를 드러내는 정보와 보호 방법을 함께 살펴보세요.
          </p>
        </div>

        <form
          className="analysis-form"
          onSubmit={(event) => void submitAnalysis(event)}

          noValidate
        >
          <div className="analysis-input-row">
            <div className="analysis-handle-field" data-invalid={!!error}>
              <span aria-hidden="true">@</span>
              <input
                ref={inputRef}
                id="instagram-handle"
                name="handle"
                type="text"
                placeholder="instagram_id"
                value={handle}

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
            <Button type="submit" className="analysis-submit transition-colors">
              분석 시작하기
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
          {error ? (
            <p id="handle-error" className="analysis-input-error" role="alert">
              <CircleAlert size={14} aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </form>

        <div className="analysis-flow" aria-label="분석 이용 순서">
          <span>
            <b>01</b> 아이디 입력
          </span>
          <ArrowRight size={14} aria-hidden="true" />
          <span>
            <b>02</b> 분석 답변 확인
          </span>
          <ArrowRight size={14} aria-hidden="true" />
          <span>
            <b>03</b> 보호 방법 확인
          </span>
        </div>
        <p className="analysis-footnote">
          나를 드러내는 정보에, 한 번 더 주의를.
        </p>
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
          <main className="streaming-page">
            <section className="stream-answer-panel" aria-label="분석 답변">
              <p className="route-loading" role="status">
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
