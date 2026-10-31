import { useEffect, useReducer, useState } from 'react'

type StreamStatus = 'streaming' | 'stopped' | 'complete' | 'error'

type StreamState = {
  status: StreamStatus
  offset: number
  errorConsumed: boolean
}

type StreamAction =
  | {
      type: 'tick'
      length: number
      reducedMotion: boolean
      simulateError: boolean
    }
  | { type: 'stop' }
  | { type: 'resume' }
  | { type: 'restart'; empty: boolean }

function initialState(empty: boolean): StreamState {
  return {
    status: empty ? 'complete' : 'streaming',
    offset: 0,
    errorConsumed: false,
  }
}

function reduceStream(state: StreamState, action: StreamAction): StreamState {
  if (action.type === 'restart') return initialState(action.empty)
  if (action.type === 'stop') {
    return state.status === 'streaming'
      ? { ...state, status: 'stopped' }
      : state
  }
  if (action.type === 'resume') {
    return state.status === 'stopped' || state.status === 'error'
      ? { ...state, status: 'streaming', errorConsumed: true }
      : state
  }
  if (state.status !== 'streaming') return state
  if (action.simulateError && !state.errorConsumed && state.offset >= 100) {
    return { ...state, status: 'error', errorConsumed: true }
  }
  const offset = Math.min(
    action.length,
    state.offset + (action.reducedMotion ? 512 : 24),
  )
  return {
    ...state,
    offset,
    status: offset === action.length ? 'complete' : 'streaming',
  }
}

// Keep text stable for a session; remount the parent for a different analysis.
export function useMockStream({
  text,
  simulateError = false,
}: {
  text: string
  simulateError?: boolean
}) {
  const [state, dispatch] = useReducer(
    reduceStream,
    text.length === 0,
    initialState,
  )
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (state.status !== 'streaming') return
    const timer = window.setTimeout(
      () => {
        dispatch({
          type: 'tick',
          length: text.length,
          reducedMotion,
          simulateError,
        })
      },
      reducedMotion ? 180 : 40,
    )
    return () => window.clearTimeout(timer)
  }, [text.length, reducedMotion, simulateError, state.status, state.offset])

  return {
    visibleText: text.slice(0, state.offset),
    status: state.status,
    stop: () => dispatch({ type: 'stop' }),
    resume: () => dispatch({ type: 'resume' }),
    restart: () => dispatch({ type: 'restart', empty: text.length === 0 }),
  }
}
