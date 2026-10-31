import { CircleAlert } from 'lucide-react'
import { severityLabels, type Severity } from './report-data'
import { cn } from '@/lib/utils'

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn('severity-badge', `severity-${severity}`)}>
      {severity === 'high' ? (
        <CircleAlert size={12} aria-hidden="true" />
      ) : null}
      {severityLabels[severity]}
    </span>
  )
}
