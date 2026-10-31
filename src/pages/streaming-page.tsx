import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowDownToLine,
  Check,
  CircleAlert,
  Copy,
  LoaderCircle,
  Square,
} from 'lucide-react'
import Markdown, { type Components } from 'react-markdown'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import type { AnalysisStream } from '@/features/privacy-stream/use-analysis-stream'
import { analysisMarkdownOptions } from '@/features/privacy-stream/markdown-options'

const markdownComponents: Components = {
  ...analysisMarkdownOptions.components,
  img: ({ src, alt }) => <img src={src} alt={alt ?? ''} loading="lazy" />,
  table: ({ children }) => (
    <div
      className="stream-table-scroll"
      role="region"
      aria-label="분석 결과 표"
      tabIndex={0}
    >
      <table>{children}</table>
    </div>
  ),
}

function StreamingPage({ stream }: { stream: AnalysisStream }) {
  const handle = stream.handle
  const [copyMessage, setCopyMessage] = useState('')
  const [awayFromBottom, setAwayFromBottom] = useState(false)
  const followTail = useRef(true)
  const progressRef = useRef<HTMLElement>(null)
  const isStreaming = stream.status === 'streaming'
  const isReceiving = isStreaming || stream.status === 'connecting'
  const isComplete = stream.status === 'complete'

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight <
        160
      followTail.current = nearBottom
      setAwayFromBottom(!nearBottom)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (followTail.current) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'instant',
      })
    }
  }, [stream.visibleText, stream.stages])

  function jumpToLatest() {
    followTail.current = true
    setAwayFromBottom(false)
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    })
  }

  function jumpToProgress() {
    followTail.current = false
    setAwayFromBottom(true)
    progressRef.current?.focus({ preventScroll: true })
    progressRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  async function copyResponse() {
    try {
      await navigator.clipboard.writeText(stream.visibleText)
      setCopyMessage('분석 답변을 복사했어요.')
    } catch {
      setCopyMessage('복사하지 못했어요. 본문을 선택해 직접 복사해 주세요.')
    }
  }

  function saveResponse() {
    const url = URL.createObjectURL(
      new Blob([stream.visibleText], { type: 'text/plain;charset=utf-8' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kkoripyo-${handle}.md`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <>
      <a className="skip-link" href="#stream-main">
        본문으로 이동
      </a>
      <AppHeader />
      <main
        id="stream-main"
        className="streaming-page"
        data-receiving={isReceiving}
      >
        <header className="stream-page-heading">
          <div className="stream-account-line">
            <span>@{handle}</span>
          </div>
          <h1>공개된 일상 속, 개인정보의 단서를 살펴볼게요</h1>
        </header>

        <section className="stream-answer-panel" aria-label="분석 답변">
          {stream.stages.length > 0 ? (
            <section
              ref={progressRef}
              id="analysis-progress"
              className="stream-progress"
              aria-label="분석 진행 상황"
              tabIndex={-1}
            >
              <h2>분석 진행 상황</h2>
              <ul>
                {stream.stages.map((stage) => (
                  <li key={stage.id} data-state={stage.state}>
                    {stage.state === 'running' && isReceiving ? (
                      <LoaderCircle
                        size={14}
                        className="stream-loader"
                        aria-hidden="true"
                      />
                    ) : stage.state === 'done' ? (
                      <Check size={14} aria-hidden="true" />
                    ) : stage.state === 'error' ? (
                      <CircleAlert size={14} aria-hidden="true" />
                    ) : (
                      <Square size={12} aria-hidden="true" />
                    )}
                    <span className="stream-stage-text">{stage.text}</span>
                    <span className="stream-stage-state">
                      {stage.state === 'done'
                        ? '완료'
                        : stage.state === 'error'
                          ? '실패'
                          : isReceiving
                            ? '진행 중'
                            : '중단됨'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <article
            className="stream-document"
            aria-label="개인정보 노출 분석 답변"
            aria-busy={isReceiving}
          >
            <Markdown
              {...analysisMarkdownOptions}
              components={markdownComponents}
            >
              {stream.visibleText}
            </Markdown>
            {!stream.visibleText && isReceiving ? (
              <div className="stream-starting" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </article>

          {stream.status === 'error' || stream.status === 'stopped' ? (
            <div className="stream-connection-notice" role="alert">
              <p>
                {stream.error ||
                  '수신을 중지했어요. 지금까지 받은 답변은 유지됩니다.'}
              </p>
              <p>
                새 분석은 상단 꼬리표 로고를 눌러 시작할 수 있어요.
                새로고침하거나 화면을 나가면 이 답변을 복원할 수 없어요.
              </p>
            </div>
          ) : null}

          {isComplete ? (
            <div className="stream-result-actions" aria-label="분석 답변 저장">
              <Button
                type="button"
                variant="ghost"
                className="transition-colors"
                onClick={() => void copyResponse()}
              >
                <Copy size={15} aria-hidden="true" />
                답변 복사
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="transition-colors"
                onClick={saveResponse}
              >
                <ArrowDownToLine size={15} aria-hidden="true" />
                답변 저장
              </Button>
            </div>
          ) : null}
          <p className="stream-copy-feedback" role="status">
            {copyMessage}
          </p>

          <p className="sr-only" role="status">
            {isComplete ? '분석 답변이 도착했어요.' : ''}
          </p>
        </section>
        <footer className="stream-notes">
          <p className="stream-disclaimer">
            새로고침하면 답변이 사라져요. 완료 후 답변을 저장해 주세요.
          </p>
          <p className="stream-disclaimer">
            AI의 추론은 실제 사실과 다를 수 있어요. 판단 근거를 함께 확인하세요.
          </p>
        </footer>

        {isReceiving ? (
          <div className="stream-bottom-bar">
            {awayFromBottom ? (
              <Button
                type="button"
                variant="outline"
                className="stream-jump transition-colors"
                onClick={jumpToLatest}
              >
                <ArrowDown size={14} aria-hidden="true" />
                최근 답변으로
              </Button>
            ) : null}
            <div className="stream-playback-bar">
              <div className="stream-status" role="status" aria-live="polite">
                <LoaderCircle
                  className="stream-loader"
                  size={16}
                  aria-hidden="true"
                />
                <div className="stream-status-copy">
                  <span className="stream-status-text">
                    {isStreaming
                      ? stream.progressText ||
                        (stream.visibleText
                          ? '분석 답변을 작성하고 있어요'
                          : '분석 정보를 확인하고 있어요')
                      : '분석 답변에 연결하고 있어요'}
                  </span>
                  {stream.stages.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="stream-progress-link"
                      aria-controls="analysis-progress"
                      onClick={jumpToProgress}
                    >
                      진행 내역 보기
                    </Button>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="stream-control transition-colors"
                onClick={stream.stop}
              >
                <Square size={13} aria-hidden="true" />
                수신 중지
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </>
  )
}

export default StreamingPage
