import { ArrowRight, CircleAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Category, Severity } from './report-data'
import type { PrivacyReport } from './report-query'

function ScoreChart({ score }: { score: number }) {
  return (
    <div
      className="overview-score-chart"
      role="img"
      aria-label={`개인정보 노출 위험 점수 ${score}점, 100점 만점`}
    >
      <svg viewBox="0 0 144 144" aria-hidden="true">
        <circle className="overview-score-track" cx="72" cy="72" r="61" />
        <circle
          className="overview-score-value"
          cx="72"
          cy="72"
          r="61"
          pathLength="100"
          strokeDasharray={`${score} 100`}
        />
      </svg>
      <div>
        <strong>{score}</strong>
        <span>/ 100</span>
      </div>
    </div>
  )
}

export function ReportSummary({
  data,
  selectedCategory,
  onCategory,
  onPriority,
}: {
  data: PrivacyReport
  selectedCategory: string
  onCategory: (category: Category) => void
  onPriority: () => void
}) {
  const severityCounts = data.warnings.reduce<Record<Severity, number>>(
    (counts, warning) => {
      counts[warning.severity] += 1
      return counts
    },
    { high: 0, medium: 0, low: 0 },
  )
  const hasWarnings = data.warnings.length > 0

  return (
    <section className="report-overview" aria-label="종합 분석 요약">
      <div className="overview-score-region">
        <h2>개인정보 노출 위험 점수</h2>
        <div className="overview-score-body">
          <ScoreChart score={data.score} />
          <div className="overview-score-description">
            <span
              className={cn(
                'overview-risk-label',
                severityCounts.high > 0 && 'overview-risk-high',
                !hasWarnings && 'overview-risk-clear',
              )}
            >
              {severityCounts.high > 0
                ? '높은 위험이 발견됐어요'
                : hasWarnings
                  ? '확인이 필요한 정보가 있어요'
                  : '발견된 위험 없음'}
            </span>
            <p>
              {hasWarnings
                ? '여러 단서가 연결되면 나를 특정할 수 있어요.'
                : '분석한 콘텐츠에서 개인정보 노출 위험을 찾지 못했어요.'}
            </p>
            <span className="overview-score-scale">
              높을수록 노출 위험이 커요
            </span>
          </div>
        </div>
      </div>

      <div className="overview-category-region">
        <div className="overview-region-heading">
          <h2>유형별 노출 위험</h2>
          <span>유형을 선택해 경고 확인</span>
        </div>
        <div className="overview-matrix-heading" aria-hidden="true">
          <span>유형</span>
          <span>노출 점수 / 100</span>
          <span>높음</span>
          <span>보통</span>
          <span>낮음</span>
        </div>
        <div className="overview-category-matrix" aria-label="유형별 경고 필터">
          {data.categoryScores.map((category) => {
            const categoryCounts = data.warnings
              .filter((warning) => warning.category === category.label)
              .reduce<Record<Severity, number>>(
                (counts, warning) => {
                  counts[warning.severity] += 1
                  return counts
                },
                { high: 0, medium: 0, low: 0 },
              )

            return (
              <button
                key={category.label}
                type="button"
                className={cn(
                  'overview-category-row',
                  selectedCategory === category.label && 'is-selected',
                )}
                aria-pressed={selectedCategory === category.label}
                aria-label={`${category.label}, 노출 위험 ${category.score}점, 높은 위험 ${categoryCounts.high}개, 보통 ${categoryCounts.medium}개, 낮음 ${categoryCounts.low}개`}
                onClick={() => onCategory(category.label)}
              >
                <span className="overview-category-name">{category.label}</span>
                <span className="overview-category-score">
                  <span className="overview-bar-track" aria-hidden="true">
                    <span
                      className="overview-bar-fill"
                      style={{ transform: `scaleX(${category.score / 100})` }}
                    />
                  </span>
                  <b>{category.score}</b>
                </span>
                <span
                  className={cn(
                    'overview-category-count',
                    categoryCounts.high > 0 && 'overview-count-high',
                  )}
                >
                  {categoryCounts.high || '—'}
                </span>
                <span className="overview-category-count">
                  {categoryCounts.medium || '—'}
                </span>
                <span className="overview-category-count">
                  {categoryCounts.low || '—'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overview-priority-region">
        <div className="overview-priority-heading">
          <h2>확인할 경고</h2>
          <span>{data.warnings.length}개</span>
        </div>
        <dl className="overview-severity-list">
          <div>
            <dt>
              <CircleAlert size={13} aria-hidden="true" />
              높은 위험
            </dt>
            <dd>
              {severityCounts.high}
              <span>개</span>
            </dd>
          </div>
          <div>
            <dt>보통</dt>
            <dd>
              {severityCounts.medium}
              <span>개</span>
            </dd>
          </div>
          <div>
            <dt>낮음</dt>
            <dd>
              {severityCounts.low}
              <span>개</span>
            </dd>
          </div>
        </dl>
        {severityCounts.high > 0 ? (
          <Button
            type="button"
            className="overview-priority-button transition-colors"
            onClick={onPriority}
          >
            위험도 높은 {severityCounts.high}개 확인
            <ArrowRight size={14} />
          </Button>
        ) : (
          <p className="overview-priority-note">
            <ShieldCheck size={15} aria-hidden="true" />
            {hasWarnings
              ? '발견된 경고의 근거를 확인해 보세요.'
              : '현재 결과는 분석한 범위에 한해요.'}
          </p>
        )}
      </div>
    </section>
  )
}
