import { categoryScores, report, warnings } from './report-data'

export type ReportMode = 'full' | 'partial' | 'empty' | 'unavailable' | 'error'

export function getReportMode(value: string | null): ReportMode {
  return value === 'partial' ||
    value === 'empty' ||
    value === 'unavailable' ||
    value === 'error'
    ? value
    : 'full'
}

export async function getMockReport(mode: ReportMode, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, 450)
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  })
  if (mode === 'error') throw new Error('예시 분석 결과를 불러오지 못했어요.')
  return {
    ...report,
    mode,
    score: mode === 'empty' ? 0 : report.score,
    categoryScores:
      mode === 'empty'
        ? categoryScores.map((category) => ({ ...category, score: 0 }))
        : categoryScores,
    warnings: mode === 'empty' || mode === 'unavailable' ? [] : warnings,
  }
}

export type PrivacyReport = Awaited<ReturnType<typeof getMockReport>>
