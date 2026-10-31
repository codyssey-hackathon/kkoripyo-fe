// Local backend-contract fixture only. No account lookup, database, or AI calls.
import { createServer } from 'node:http'

const port = Number(process.env.SSE_FIXTURE_PORT ?? 8000)
let requestCount = 0
const server = createServer(async (req, res) => {
  const allowedOrigins = [
    'http://localhost:3011',
    'http://127.0.0.1:3011',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]
  if (allowedOrigins.includes(req.headers.origin))
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end()
    return
  }
  const path = new URL(req.url, `http://localhost:${port}`).pathname
  const json = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }
  if (req.method !== 'POST' || path !== '/api/v1/agent/stream') {
    json(404, {})
    return
  }
  let handle
  try {
    let body = ''
    for await (const chunk of req) {
      body += chunk
      if (body.length > 1024) {
        json(413, {})
        return
      }
    }
    handle = JSON.parse(body).handle
    if (typeof handle !== 'string' || !/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
      json(422, {})
      return
    }
    handle = handle.toLowerCase()
  } catch {
    json(400, {})
    return
  }
  requestCount += 1
  console.log(`Analysis request ${requestCount}: ${handle} (fixture only)`)
  if (handle === 'fixture_http') {
    json(503, {})
    return
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\r\n\r\n`)
  res.write(': connected\r\n\r\n')
  send({
    type: 'stage',
    id: 'collect:profile',
    text: '프로필 확인하는 중',
    state: 'running',
  })
  const pieces = [
    '이 답변은 **로컬 SSE 연동 테스트**예요. 실제 계정은 조회하지 않았어요.\n\n',
    '## 1. 위치 정보 노출 가능성\n\n',
    '**위험도 보통** · 테스트 데이터\n\n',
    '여러 게시물에 같은 위치가 반복된다면 생활 범위가 추정될 수 있어요.\n\n',
    '**판단 근거**\n\n> 위치 태그와 게시물 본문을 함께 확인하는 예시입니다.\n\n',
    '**권장 조치**\n\n- 공개된 위치 태그를 확인하세요.\n- 사진의 주소 등 식별 정보를 가려보세요.\n\n',
    '## 유형별 확인 결과\n\n| 항목 | 위험도 | 판단 근거 | 권장 조치 |\n',
    '| --- | ---: | --- | --- |\n',
    '| 거주 지역 | **높음** | 반복되는 위치 태그 | 위치 태그 삭제 |\n',
    '| 연락처 | 보통 | 공개 프로필 문구 | 공개 범위 확인 |\n\n',
    '- [x] 위치 태그 확인\n- [ ] 공개 범위 수정\n\n`위치 태그`를 확인하고 ~~기존 문구~~를 수정하세요.\n\n',
    '## 분석을 마치며\n\n',
    '한글과 줄바꿈, **Markdown**이 스트림 경계에서도 유지되는지 확인하세요. 😀\n',
  ]
  let index = 0
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 10_000)
  const timer = setInterval(
    () => {
      if (handle === 'fixture_pending') return
      if (handle === 'fixture_empty') {
        send({ type: 'done' })
        res.end()
        return
      }
      if (index === 0) {
        send({
          type: 'stage',
          id: 'collect:profile',
          text: '프로필 확인: 테스트 프로필',
          state: 'done',
        })
        for (const [id, text] of [
          ['followers', '팔로워 263명 확인'],
          ['following', '팔로잉 294명 확인'],
          ['posts', '피드 10개 확인'],
          ['ocr', '사진 10장 중 9장에서 글자 발견'],
          ['comments', '댓글 13개 확인'],
        ])
          send({ type: 'stage', id: `collect:${id}`, text, state: 'done' })
        send({ type: 'status', text: '분석하는 중' })
      }
      if (index === 3) {
        send({
          type: 'stage',
          id: 'friends:posts',
          text: '친구 피드 읽는 중 (3개 계정)',
          state: 'running',
        })
      }
      if (index === 5) {
        send({
          type: 'stage',
          id: 'friends:posts',
          text: '친구 피드 확인 (3개 계정)',
          state: 'done',
        })
        send({
          type: 'stage',
          id: 'friends:private',
          text: '일부 친구 계정 확인 불가 (테스트)',
          state: 'error',
        })
      }
      if (index === 3 && handle === 'fixture_error') {
        send({
          type: 'error',
          message: 'RuntimeError: fixture-internal-details',
        })
        res.end()
        return
      }
      if (index === 3 && handle === 'fixture_disconnect') {
        res.end()
        return
      }
      if (index < pieces.length) {
        send({ type: 'token', text: pieces[index++] })
        return
      }
      send({ type: 'done' })
      res.end()
    },
    handle === 'fixture_slow' ? 2000 : 450,
  )
  res.on('close', () => {
    clearInterval(timer)
    clearInterval(heartbeat)
  })
})
server.listen(port, '127.0.0.1', () =>
  console.log(`SSE fixture: http://127.0.0.1:${port} (local test data only)`),
)
