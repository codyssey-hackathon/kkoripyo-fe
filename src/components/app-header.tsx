import { Tag } from 'lucide-react'
import { Link } from 'react-router'

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-container header-inner">
        <Link to="/" className="brand" aria-label="꼬리표 홈">
          <Tag size={25} strokeWidth={1.8} aria-hidden="true" />
          <span>꼬리표</span>
        </Link>
      </div>
    </header>
  )
}
