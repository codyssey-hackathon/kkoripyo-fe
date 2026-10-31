import { lazy, Suspense, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CircleAlert, Info, ScanLine } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { analysisHandleSchema } from '@/features/privacy-stream/analysis-handle'

const StreamingPage = lazy(() => import('@/pages/streaming-page'))

function AnalysisStart({ initialHandle }: { initialHandle: string }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [handle, setHandle] = useState(initialHandle)
  const [error, setError] = useState(
    initialHandle ? '아이디를 확인하고 다시 제출해 주세요.' : '',
  )

  function submitAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = analysisHandleSchema.safeParse(handle)
    if (!result.success) {
      setError(result.error.issues[0].message)
      inputRef.current?.focus()
      return
    }
    navigate({
      pathname: '/',
      search: new URLSearchParams({ handle: result.data }).toString(),
    })
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

        <form className="analysis-form" onSubmit={submitAnalysis} noValidate>
          <label htmlFor="instagram-handle">Instagram 아이디</label>
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
                aria-invalid={!!error}
                aria-describedby={`handle-help${error ? ' handle-error' : ''}`}
                enterKeyHint="go"
              />
            </div>
            <Button type="submit" className="analysis-submit transition-colors">
              분석 시작하기
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
          <p id="handle-help" className="analysis-input-help">
            영문, 숫자, 마침표(.), 밑줄(_) · 최대 30자
          </p>
          {error ? (
            <p id="handle-error" className="analysis-input-error" role="alert">
              <CircleAlert size={14} aria-hidden="true" />
              {error}
            </p>
          ) : null}
          <div className="analysis-example-note">
            <Info size={15} aria-hidden="true" />
            <p>
              현재는 실제 계정 조회 없이 예시 분석을 보여드려요. 입력한 아이디는
              분석 화면에만 표시됩니다.
            </p>
          </div>
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

function HomePage() {
  const [params] = useSearchParams()
  const rawHandle = params.get('handle') ?? ''
  const result = analysisHandleSchema.safeParse(rawHandle)

  if (!result.success) {
    return <AnalysisStart key={rawHandle} initialHandle={rawHandle} />
  }

  return (
    <Suspense
      fallback={
        <>
          <AppHeader showStartAction />
          <main className="route-loading" role="status">
            분석 화면을 불러오고 있어요…
          </main>
        </>
      }
    >
      <StreamingPage key={result.data} handle={result.data} />
    </Suspense>
  )
}

export default HomePage
