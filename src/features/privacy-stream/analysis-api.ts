import { z } from 'zod'
import { readSse } from '../../lib/sse.ts'

const envelopeSchema = z.object({ type: z.string() })
const tokenSchema = z.object({ text: z.string() })
const stageSchema = z.object({
  id: z.string().min(1).max(300),
  text: z.string().min(1).max(2000),
  state: z.enum(['running', 'done', 'error']),
})
const statusSchema = z.object({ text: z.string().min(1).max(2000) })

export type AnalysisStage = z.infer<typeof stageSchema>

function formatError() {
  return new Error('서버의 분석 답변 형식을 읽지 못했어요.')
}

function httpError(status: number) {
  if (status === 404)
    return new Error(
      '분석 서비스에 연결하지 못했어요. 서버 주소를 확인해 주세요.',
    )
  if (status === 422) return new Error('아이디를 확인하고 다시 제출해 주세요.')
  if (status === 429)
    return new Error('요청이 많아요. 잠시 후 다시 시도해 주세요.')
  if (status === 503)
    return new Error(
      '분석 서비스가 준비되지 않았어요. 서버 설정을 확인해 주세요.',
    )
  return new Error(
    '서버에서 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
  )
}

export function createAnalysisClient(origin: string) {
  return {
    async stream(
      handle: string,
      {
        signal,
        onOpen,
        onDelta,
        onStage,
        onStatus,
      }: {
        signal: AbortSignal
        onOpen: () => void
        onDelta: (text: string) => void
        onStage: (stage: AnalysisStage) => void
        onStatus: (text: string) => void
      },
    ) {
      const timeout = new AbortController()
      let timer = setTimeout(() => timeout.abort(), 30_000)
      const keepAlive = () => {
        clearTimeout(timer)
        // Backend collection can wait 240s without a heartbeat.
        timer = setTimeout(() => timeout.abort(), 300_000)
      }
      try {
        signal.throwIfAborted()
        const url = new URL('/api/v1/agent/stream', origin)
        if (import.meta.env?.DEV) {
          console.log('[analysis] request', {
            method: 'POST',
            url: url.href,
            body: { handle },
          })
        }
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ handle }),
          cache: 'no-store',
          signal: AbortSignal.any([signal, timeout.signal]),
        })
        if (import.meta.env?.DEV) {
          console.log('[analysis] response', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
          })
        }
        if (!response.ok) {
          if (import.meta.env?.DEV) {
            console.log('[analysis] HTTP error', {
              status: response.status,
              body: (
                await response.text().catch(() => '응답 본문 읽기 실패')
              ).slice(0, 2000),
            })
          }
          throw httpError(response.status)
        }
        if (
          response.headers
            .get('content-type')
            ?.split(';')[0]
            .trim()
            .toLowerCase() !== 'text/event-stream' ||
          !response.body
        )
          throw formatError()
        keepAlive()
        onOpen()
        let hasText = false
        let leadingWhitespace = ''
        for await (const event of readSse(response.body, keepAlive)) {
          signal.throwIfAborted()
          let payload: unknown
          try {
            payload = JSON.parse(event.data)
          } catch {
            throw formatError()
          }
          const envelope = envelopeSchema.safeParse(payload)
          if (!envelope.success) throw formatError()
          switch (envelope.data.type) {
            case 'token': {
              const result = tokenSchema.safeParse(payload)
              if (!result.success) throw formatError()
              if (!hasText) {
                leadingWhitespace += result.data.text
                if (!leadingWhitespace.trim()) break
                hasText = true
                onDelta(leadingWhitespace)
                leadingWhitespace = ''
              } else {
                onDelta(result.data.text)
              }
              break
            }
            case 'stage': {
              const result = stageSchema.safeParse(payload)
              if (!result.success) throw formatError()
              onStage(result.data)
              break
            }
            case 'status': {
              const result = statusSchema.safeParse(payload)
              if (!result.success) throw formatError()
              onStatus(result.data.text)
              break
            }
            case 'done':
              if (!hasText)
                throw new Error('분석 답변이 비어 있어요. 다시 분석해 주세요.')
              if (import.meta.env?.DEV) console.log('[analysis] complete')
              return
            case 'error':
              if (import.meta.env?.DEV)
                console.log('[analysis] stream error', payload)
              // The backend currently returns raw exception details. Keep these
              // out of the UI because they may include credentials or internals.
              throw new Error(
                '분석 중 오류가 발생했어요. 잠시 후 다시 분석해 주세요.',
              )
            default:
              // New metadata types must never be rendered as answer text.
              break
          }
        }
        throw new Error(
          '답변 수신 중 연결이 끊겼어요. 지금까지 받은 내용은 유지됩니다.',
        )
      } catch (error) {
        if (import.meta.env?.DEV) {
          console.log('[analysis] failed', {
            aborted: signal.aborted,
            timedOut: timeout.signal.aborted,
            error,
          })
        }
        if (signal.aborted) throw error
        if (timeout.signal.aborted) {
          throw new Error(
            '답변 대기 시간이 길어 연결을 종료했어요. 다시 분석해 주세요.',
            { cause: error },
          )
        }
        if (error instanceof TypeError) {
          throw new Error(
            '서버 연결이 끊겼어요. 연결 상태를 확인하고 다시 분석해 주세요.',
            { cause: error },
          )
        }
        throw error
      } finally {
        clearTimeout(timer)
        timeout.abort()
      }
    },
  }
}
