import { Tag } from 'lucide-react'
import { Link } from 'react-router'

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1328px] items-center justify-between gap-[24px] px-[40px] [@media(max-width:60rem)]:px-[24px] [@media(max-width:45rem)]:h-[64px] [@media(max-width:45rem)]:px-[20px]">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-[12px] text-[21px] font-bold tracking-[-0.045em] text-foreground no-underline"
          aria-label="꼬리표 홈"
        >
          <Tag
            size={25}
            strokeWidth={1.8}
            className="rotate-[-12deg] text-primary"
            aria-hidden="true"
          />
          <span>꼬리표</span>
        </Link>
      </div>
    </header>
  )
}
