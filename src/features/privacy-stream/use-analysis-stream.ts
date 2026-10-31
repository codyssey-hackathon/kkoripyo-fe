import { useEffect, useRef, useState } from 'react'
import { analysisClient } from './analysis-client'
import type { AnalysisStage } from './analysis-api'

type StreamState = {
  handle: string
  status: 'idle' | 'connecting' | 'streaming' | 'stopped' | 'complete' | 'error'
  visibleText: string
  progressText: string
  stages: AnalysisStage[]
  error: string
}

const initialState: StreamState = {
  handle: '',
  status: 'idle',
  visibleText: '',
  progressText: '',
  stages: [],
  error: '',
}

export function useAnalysisStream() {
  const [state, setState] = useState(initialState)
  const controller = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      controller.current?.abort()
      controller.current = null
    },
    [],
  )

  // POST starts analysis work. Mounts, StrictMode and refresh never start it.
  // Each explicit submit/retry starts a new run; the backend cannot replay it.
  function start(handle: string) {
    controller.current?.abort()
    const connection = new AbortController()
    controller.current = connection
    const isCurrent = () =>
      controller.current === connection && !connection.signal.aborted
    setState({ ...initialState, handle, status: 'connecting' })

    void analysisClient
      .stream(handle, {
        signal: connection.signal,
        onOpen: () => {
          if (isCurrent())
            setState((previous) => ({ ...previous, status: 'streaming' }))
        },
        onDelta: (text) => {
          if (isCurrent())
            setState((previous) => ({
              ...previous,
              visibleText: previous.visibleText + text,
            }))
        },
        onStatus: (text) => {
          if (isCurrent())
            setState((previous) => ({ ...previous, progressText: text }))
        },
        onStage: (stage) => {
          if (!isCurrent()) return
          setState((previous) => {
            const exists = previous.stages.some((item) => item.id === stage.id)
            return {
              ...previous,
              progressText: `${stage.text}${stage.state === 'done' ? ' · 완료' : stage.state === 'error' ? ' · 실패' : ''}`,
              stages: exists
                ? previous.stages.map((item) =>
                    item.id === stage.id ? stage : item,
                  )
                : [...previous.stages, stage],
            }
          })
        },
      })
      .then(() => {
        if (isCurrent())
          setState((previous) => ({ ...previous, status: 'complete' }))
      })
      .catch((error: unknown) => {
        if (isCurrent())
          setState((previous) => ({
            ...previous,
            status: 'error',
            error:
              error instanceof Error ? error.message : '답변을 받지 못했어요.',
          }))
      })
  }

  function stop() {
    controller.current?.abort()
    controller.current = null
    setState((previous) => ({ ...previous, status: 'stopped', error: '' }))
  }

  return { ...state, start, stop }
}

export type AnalysisStream = ReturnType<typeof useAnalysisStream>
