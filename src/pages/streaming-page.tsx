import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowDownToLine,
  Check,
  CircleAlert,
  Copy,
  FileText,
  Info,
  LoaderCircle,
  Play,
  RotateCcw,
  Square,
} from 'lucide-react'
import Markdown, { type Components } from 'react-markdown'
import { useSearchParams } from 'react-router'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { exampleResponse } from '@/features/privacy-stream/stream-data'
import { useMockStream } from '@/features/privacy-stream/use-mock-stream'

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  img: ({ src, alt }) => <img src={src} alt={alt ?? ''} loading="lazy" />,
}

const statusLabels = {
  streaming: '분석 답변을 작성하고 있어요',
  stopped: '표시를 중지했어요. 이어서 읽을 수 있어요.',
  error: '예시 연결 오류가 발생했어요. 이어서 다시 표시해 주세요.',
  complete: '예시 분석이 완료됐어요',
}

function StreamingPage({ handle }: { handle: string }) {
  const [params] = useSearchParams()
  const stream = useMockStream({
    text: exampleResponse,
    simulateError: params.get('state') === 'error',
  })
  const [copyMessage, setCopyMessage] = useState('')
  const [awayFromBottom, setAwayFromBottom] = useState(false)
  const followTail = useRef(true)
  const isStreaming = stream.status === 'streaming'
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
  }, [stream.visibleText])

  function jumpToLatest() {
    followTail.current = true
    setAwayFromBottom(false)
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    })
  }

  function restartAnalysis() {
    followTail.current = true
    setAwayFromBottom(false)
    setCopyMessage('')
    stream.restart()
    window.scrollTo({ top: 0, behavior: 'instant' })
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
    anchor.download = `kkoripyo-${handle}-example.md`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <>
      <a className="skip-link" href="#stream-main">
        본문으로 이동
      </a>
      <AppHeader showStartAction />
      <main id="stream-main" className="streaming-page">
        <header className="stream-page-heading">
          <div className="stream-account-line">
            <span>@{handle}</span>
            <span className="stream-example-label">예시 분석</span>
          </div>
          <h1>공개된 일상 속, 개인정보의 단서를 살펴볼게요</h1>
          <p>
            게시물과 댓글에 남은 정보부터 나에게 맞는 보호 방법까지, 하나씩
            확인하세요.
          </p>
          <div className="stream-demo-notice">
            <Info size={14} aria-hidden="true" />
            <span>
              실제 @{handle} 계정을 조회한 결과가 아닌, 가상의 콘텐츠로 구성한
              예시 답변입니다.
            </span>
          </div>
        </header>

        <div className="stream-answer-heading">
          <h2>
            <FileText size={16} aria-hidden="true" />
            분석 답변
          </h2>
          <Button
            type="button"
            variant="ghost"
            className="stream-replay transition-colors"
            onClick={restartAnalysis}
          >
            <RotateCcw size={14} aria-hidden="true" />
            다시 재생
          </Button>
        </div>

        <article
          className="stream-document"
          aria-label="개인정보 노출 분석 답변"
          aria-busy={isStreaming}
        >
          <Markdown components={markdownComponents} skipHtml>
            {stream.visibleText}
          </Markdown>
          {!stream.visibleText ? (
            <div className="stream-starting" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ) : null}
        </article>

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
              {isStreaming ? (
                <LoaderCircle
                  className="stream-loader"
                  size={16}
                  aria-hidden="true"
                />
              ) : isComplete ? (
                <Check size={16} aria-hidden="true" />
              ) : stream.status === 'error' ? (
                <CircleAlert size={16} aria-hidden="true" />
              ) : (
                <Square size={13} aria-hidden="true" />
              )}
              <span>{statusLabels[stream.status]}</span>
            </div>
            {isStreaming ? (
              <Button
                type="button"
                variant="outline"
                className="stream-control transition-colors"
                onClick={stream.stop}
              >
                <Square size={13} aria-hidden="true" />
                표시 중지
              </Button>
            ) : !isComplete ? (
              <Button
                type="button"
                variant="outline"
                className="stream-control transition-colors"
                onClick={stream.resume}
              >
                <Play size={14} aria-hidden="true" />
                이어서 표시
              </Button>
            ) : (
              <span className="stream-complete-label">답변 작성 완료</span>
            )}
          </div>
          <p className="stream-disclaimer">
            AI의 추론은 실제 사실과 다를 수 있어요. 판단 근거를 함께 확인하세요.
          </p>
        </div>
      </main>
    </>
  )
}

export default StreamingPage
