import { ArrowLeft, ShieldCheck, Tag } from 'lucide-react'
import { Link } from 'react-router'

export function AppHeader({
  showStartAction = false,
}: {
  showStartAction?: boolean
}) {
  return (
    <header className="app-header">
      <div className="app-container header-inner">
        <Link to="/" className="brand" aria-label="꼬리표 홈">
          <Tag size={25} strokeWidth={1.8} aria-hidden="true" />
          <span>꼬리표</span>
        </Link>
        <div className="header-actions">
          <span className="header-caption">
            <ShieldCheck size={15} aria-hidden="true" />
            나의 일상, 나만의 범위로
          </span>
          {showStartAction ? (
            <Link to="/" className="new-analysis-link">
              <ArrowLeft size={14} aria-hidden="true" />새 분석 시작
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
