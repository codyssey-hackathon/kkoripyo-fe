import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-5xl px-[24px] py-[64px]">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소를 확인하거나 홈으로 이동해 주세요.</p>
      <Link className="text-primary underline underline-offset-4" to="/">
        홈으로 돌아가기
      </Link>
    </main>
  )
}

export default NotFoundPage
