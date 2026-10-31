import { useState } from 'react'
import {
  Check,
  Building2,
  Clock3,
  Mail,
  ExternalLink,
  EyeOff,
  Image,
  Info,
  MapPin,
  MessageSquare,
  ScanLine,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from './severity-badge'
import type {
  Category,
  Evidence,
  ReportDetailTab,
  Warning,
} from './report-data'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function HighlightedText({
  text,
  highlight,
}: {
  text: string
  highlight: string
}) {
  const index = text.indexOf(highlight)
  if (index < 0 || !highlight) return text
  return (
    <>
      {text.slice(0, index)}
      <mark>{highlight}</mark>
      {text.slice(index + highlight.length)}
    </>
  )
}

export function EvidencePreview({ evidence }: { evidence: Evidence }) {
  return (
    <div
      className={cn(
        'evidence-item',
        evidence.kind === 'image' && 'image-evidence',
      )}
    >
      {evidence.image ? (
        <img
          src={evidence.image}
          width={960}
          height={1438}
          alt="예시 게시물: 커피 머신에서 에스프레소를 내리는 장면"
          className="evidence-photo"
        />
      ) : null}
      <div className="evidence-content">
        <div className="evidence-meta">
          <span>
            {evidence.kind === 'image' ? (
              <Image size={13} />
            ) : (
              <MessageSquare size={13} />
            )}
            {evidence.source}
          </span>
          <time>{evidence.date}</time>
        </div>
        <p>
          <HighlightedText
            text={evidence.text}
            highlight={evidence.highlight}
          />
        </p>
        {evidence.url ? (
          <a
            className="original-link"
            href={evidence.url}
            target="_blank"
            rel="noreferrer"
          >
            원문 보기
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="example-link">예시 콘텐츠 / 원문 링크 없음</span>
        )}
      </div>
    </div>
  )
}

export function ImageProtection({ image }: { image: string }) {
  const [after, setAfter] = useState(false)
  return (
    <div className="image-protection">
      <div className="comparison-heading">
        <span>
          <ScanLine size={14} />
          보호 편집 미리보기
        </span>
        <div
          className="comparison-controls"
          role="group"
          aria-label="수정 전후 비교"
        >
          <button
            type="button"
            aria-pressed={!after}
            className={cn(!after && 'is-active')}
            onClick={() => setAfter(false)}
          >
            Before
          </button>
          <button
            type="button"
            aria-pressed={after}
            className={cn(after && 'is-active')}
            onClick={() => setAfter(true)}
          >
            After
          </button>
        </div>
      </div>
      <div className="comparison-photo">
        <img
          src={image}
          width={960}
          height={1438}
          alt={
            after
              ? '위치 태그를 가린 보호 화면 예시'
              : '위치 태그가 노출된 원본 화면 예시'
          }
        />
        <span className={cn('photo-location', after && 'location-protected')}>
          {after ? (
            <>
              <EyeOff size={13} />
              위치 정보 가림
            </>
          ) : (
            <>
              <MapPin size={13} />
              성수동, 집 앞 단골 카페
            </>
          )}
        </span>
        <span className="comparison-caption">
          {after ? '보호 후 예시' : '보호 전 예시'}
        </span>
      </div>
      <p className="comparison-note">
        위치 태그를 가린 화면 예시예요. 실제 이미지 편집은 아직 제공하지 않아요.
      </p>
    </div>
  )
}

const categoryIcons = {
  위치: MapPin,
  신원: User,
  소속: Building2,
  연락처: Mail,
  '생활 패턴': Clock3,
} satisfies Record<Category, typeof MapPin>

export function WarningDetail({
  warning,
  tab,
  onTabChange,
}: {
  warning: Warning
  tab: ReportDetailTab
  onTabChange: (tab: ReportDetailTab) => void
}) {
  const [showProtection, setShowProtection] = useState(false)
  const image = warning.evidence.find((evidence) => evidence.image)?.image
  const hasOtherSource = warning.sources.some(
    (source) => source.owner === 'other',
  )
  const CategoryIcon = categoryIcons[warning.category]
  return (
    <article
      id="warning-detail"
      className="warning-detail report-warning-detail"
      aria-labelledby="detail-title"
    >
      <div className="detail-heading">
        <div className="detail-meta">
          <SeverityBadge severity={warning.severity} />
          <span>
            <CategoryIcon size={13} />
            {warning.category}
          </span>
          <span className="detection-label">
            {warning.detection === 'AI 추론' ? (
              <Sparkles size={12} />
            ) : (
              <Check size={12} />
            )}
            {warning.detection}
          </span>
        </div>
        <h2 id="detail-title" tabIndex={-1}>
          {warning.title}
        </h2>
        <p className="report-detail-lead">{warning.information}</p>
        <div className="report-detail-sources">
          <span>단서 출처</span>
          {warning.sources.map((source) => (
            <span key={source.label}>
              {source.owner === 'me' ? <User size={12} /> : <Users size={12} />}
              {source.label}
            </span>
          ))}
        </div>
      </div>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (
            value === 'evidence' ||
            value === 'reason' ||
            value === 'protection'
          )
            onTabChange(value)
        }}
        className="report-detail-tabs"
      >
        <TabsList
          variant="line"
          className="report-detail-tablist"
          aria-label="경고 상세 보기"
        >
          <TabsTrigger value="evidence" className="report-detail-tab">
            노출 근거 <span>{warning.evidence.length}</span>
          </TabsTrigger>
          <TabsTrigger value="reason" className="report-detail-tab">
            판단 이유
          </TabsTrigger>
          <TabsTrigger value="protection" className="report-detail-tab">
            보호 방법
          </TabsTrigger>
        </TabsList>
        <TabsContent value="evidence" className="report-detail-panel">
          <div className="report-panel-heading">
            <h3>문제가 된 콘텐츠</h3>
            <p>강조한 부분이 노출 판단에 사용된 단서예요.</p>
          </div>
          <div className="report-evidence-grid">
            {warning.evidence.map((evidence) => (
              <EvidencePreview key={evidence.id} evidence={evidence} />
            ))}
          </div>
          <p className="report-evidence-note">
            <Info size={13} />
            여러 콘텐츠의 단서가 연결되어 하나의 경고가 될 수 있어요.
          </p>
        </TabsContent>
        <TabsContent value="reason" className="report-detail-panel">
          <div className="report-panel-heading">
            <h3>
              {warning.detection === 'AI 추론'
                ? '단서가 이렇게 연결됐어요'
                : '공개된 정보를 확인했어요'}
            </h3>
            <p>게시물과 댓글의 어떤 내용이 판단에 사용됐는지 확인하세요.</p>
          </div>
          <ol className="reason-list report-reason-list">
            {warning.reason.map((reason, index) => (
              <li key={reason}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{reason}</p>
              </li>
            ))}
          </ol>
          <div className="report-interpretation-note">
            {warning.detection === 'AI 추론' ? (
              <Sparkles size={16} />
            ) : (
              <Check size={16} />
            )}
            <p>
              {warning.detection === 'AI 추론'
                ? 'AI가 공개된 단서의 문맥을 연결한 추정이에요. 실제 정보와 다를 수 있어요.'
                : '예시 콘텐츠에 직접 기재된 정보예요. AI의 추정과 구분해 표시합니다.'}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="protection" className="report-detail-panel">
          <section className="report-protection-action">
            <div className="report-panel-heading">
              <h3>
                <ShieldCheck size={18} />
                {warning.action}
              </h3>
              <p>{warning.actionDetail}</p>
            </div>
            {hasOtherSource ? (
              <div className="report-other-source">
                <Users size={16} />
                <p>
                  타인이 작성한 콘텐츠는 직접 수정할 수 없어요. 작성자에게
                  수정을 요청하거나 댓글 숨김·삭제 기능을 확인하세요.
                </p>
              </div>
            ) : null}
            {image ? (
              <>
                <Button
                  type="button"
                  className="report-button protection-button transition-colors"
                  onClick={() => setShowProtection((value) => !value)}
                  aria-expanded={showProtection}
                  aria-controls="image-protection"
                >
                  <ScanLine size={15} />
                  {showProtection ? '수정 예시 접기' : '수정 예시 비교하기'}
                </Button>
                {showProtection ? (
                  <div id="image-protection">
                    <ImageProtection image={image} />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-action-note">
                <MessageSquare size={14} />
                텍스트는 위 안내에 따라 직접 수정하거나 삭제해 주세요.
              </p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </article>
  )
}
