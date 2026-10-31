import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAnalysisClient } from '../src/features/privacy-stream/analysis-api.ts'
import { createSseParser, readSse } from '../src/lib/sse.ts'

const callbacks = () => ({
  signal: new AbortController().signal,
  onOpen() {},
  onDelta() {},
  onStage() {},
  onStatus() {},
})
const frame = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`

function streamResponse(text: string, closed: () => void = () => {}) {
  const bytes = new TextEncoder().encode(text)
  let offset = 0
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        // Split every byte, including the middle of Korean characters and CRLF.
        if (offset === bytes.length) controller.close()
        else controller.enqueue(bytes.slice(offset, ++offset))
      },
      cancel: closed,
    }),
    { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } },
  )
}

test('SSE handles LF/CR/CRLF, comments, multiline data, empty data, unknown fields and partial tails', async () => {
  const events = []
  for await (const event of readSse(
    streamResponse(
      '\uFEFF: heartbeat\r\nid: 1\r\nretry: 3000\r\n\r\n' +
        'event: delta\r\ndata: {"text":\r\ndata: "한글 😀"}\r\n\r\n' +
        'data: second\r\rdata\n\nevent: delta\ndata: incomplete',
    ).body!,
  ))
    events.push(event)
  assert.deepEqual(events, [
    { event: 'delta', data: '{"text":\n"한글 😀"}' },
    { event: 'message', data: 'second' },
    { event: 'message', data: '' },
  ])
})

test('SSE parser handles several frames per chunk and bounds unfinished event size', () => {
  const events = []
  const parser = createSseParser((event) => events.push(event))
  parser.feed('event: delta\ndata: one\n\ndata: two\n\n')
  assert.deepEqual(events, [
    { event: 'delta', data: 'one' },
    { event: 'message', data: 'two' },
  ])
  assert.throws(() => parser.feed('x'.repeat(1024 * 1024 + 1)), /너무 커서/)
})

test('POST streams actual backend type events and keeps stages/status out of Markdown', async (t) => {
  let cancelled = false
  t.mock.method(globalThis, 'fetch', async (input: URL, init: RequestInit) => {
    assert.equal(String(input), 'https://api.example.test/api/v1/agent/stream')
    assert.equal(init.method, 'POST')
    assert.equal(init.body, '{"handle":"example_user"}')
    assert.deepEqual(init.headers, {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    })
    return streamResponse(
      ': keepalive\n\n' +
        frame({
          type: 'stage',
          id: 'collect:profile',
          text: '프로필 확인하는 중',
          state: 'running',
        }) +
        frame({
          type: 'stage',
          id: 'collect:profile',
          text: '프로필 확인',
          state: 'done',
        }) +
        frame({ type: 'status', text: '분석하는 중' }) +
        frame({ type: 'future_metadata', text: 'must not appear' }) +
        frame({ type: 'token', text: '## 개인정보\n' }) +
        frame({ type: 'token', text: '본문 😀' }) +
        frame({ type: 'done' }) +
        frame({ type: 'token', text: 'ignored after done' }),
      () => {
        cancelled = true
      },
    )
  })
  const chunks: string[] = []
  const stages: unknown[] = []
  const statuses: string[] = []
  let opened = false
  await createAnalysisClient('https://api.example.test').stream(
    'example_user',
    {
      ...callbacks(),
      onOpen: () => {
        opened = true
      },
      onDelta: (text) => chunks.push(text),
      onStage: (stage) => stages.push(stage),
      onStatus: (text) => statuses.push(text),
    },
  )
  assert.equal(opened, true)
  assert.equal(chunks.join(''), '## 개인정보\n본문 😀')
  assert.equal(stages.length, 2)
  assert.deepEqual(statuses, ['분석하는 중'])
  assert.equal(cancelled, true)
})

test('received text is preserved on EOF and raw backend errors never reach the UI', async (t) => {
  const secret = 'RuntimeError: secret-api-key-and-internal-host'
  for (const ending of ['', frame({ type: 'error', message: secret })]) {
    t.mock.method(globalThis, 'fetch', async () =>
      streamResponse(frame({ type: 'token', text: '받은 답변' }) + ending),
    )
    const chunks: string[] = []
    await assert.rejects(
      createAnalysisClient('https://api.example.test').stream('example_user', {
        ...callbacks(),
        onDelta: (text) => chunks.push(text),
      }),
      (error: Error) => {
        assert.doesNotMatch(error.message, /secret|internal-host/)
        assert.match(error.message, ending ? /분석 중 오류/ : /연결이 끊겼어요/)
        return true
      },
    )
    assert.equal(chunks.join(''), '받은 답변')
  }
})

test('whitespace is buffered until text, preserved exactly, and cannot complete an empty answer', async (t) => {
  const parts = ['\n  ', '\t', '## 답변', '\n\n', '본문', '  ']
  t.mock.method(globalThis, 'fetch', async () =>
    streamResponse(
      parts.map((text) => frame({ type: 'token', text })).join('') +
        frame({ type: 'done' }),
    ),
  )
  const chunks: string[] = []
  await createAnalysisClient('https://api.example.test').stream(
    'example_user',
    { ...callbacks(), onDelta: (text) => chunks.push(text) },
  )
  assert.equal(chunks[0], '\n  \t## 답변')
  assert.equal(chunks.join(''), parts.join(''))
  t.mock.method(globalThis, 'fetch', async () =>
    streamResponse(
      frame({ type: 'token', text: ' \n' }) + frame({ type: 'done' }),
    ),
  )
  await assert.rejects(
    createAnalysisClient('https://api.example.test').stream(
      'example_user',
      callbacks(),
    ),
    /비어 있어요/,
  )
})

test('HTTP failures, wrong MIME, malformed known events and empty completion are rejected', async (t) => {
  const cases: [() => Response, RegExp][] = [
    [() => new Response('', { status: 404 }), /연결하지 못했어요/],
    [() => new Response('', { status: 422 }), /아이디/],
    [() => new Response('', { status: 429 }), /요청이 많아요/],
    [() => new Response('', { status: 503 }), /서버 설정/],
    [() => Response.json({ text: 'not SSE' }), /형식을/],
    [() => streamResponse('data: not json\n\n'), /형식을/],
    [() => streamResponse(frame(null)), /형식을/],
    [() => streamResponse(frame({ text: 'missing type' })), /형식을/],
    [() => streamResponse(frame({ type: 'token', text: 42 })), /형식을/],
    [
      () =>
        streamResponse(
          frame({ type: 'stage', id: 'x', text: 'x', state: 'unknown' }),
        ),
      /형식을/,
    ],
    [() => streamResponse(frame({ type: 'status', text: null })), /형식을/],
    [() => streamResponse(frame({ type: 'done' })), /비어 있어요/],
  ]
  for (const [response, message] of cases) {
    t.mock.method(globalThis, 'fetch', async () => response())
    await assert.rejects(
      createAnalysisClient('https://api.example.test').stream(
        'example_user',
        callbacks(),
      ),
      message,
    )
  }
})

test('pre-aborted requests never start an analysis', async (t) => {
  let called = false
  t.mock.method(globalThis, 'fetch', async () => {
    called = true
    return new Response()
  })
  const connection = new AbortController()
  connection.abort()
  await assert.rejects(
    createAnalysisClient('https://api.example.test').stream('example_user', {
      ...callbacks(),
      signal: connection.signal,
    }),
    { name: 'AbortError' },
  )
  assert.equal(called, false)
})

test('abort cancels an active body; heartbeat activity resets the idle timeout', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let bodyController: ReadableStreamDefaultController<Uint8Array>
  let cancelled = false
  const connection = new AbortController()
  t.mock.method(globalThis, 'fetch', async (_url: URL, init: RequestInit) => {
    const signal = init.signal!
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          bodyController = controller
          signal.addEventListener(
            'abort',
            () => {
              cancelled = true
              controller.error(signal.reason)
            },
            { once: true },
          )
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    )
  })
  let opened!: () => void
  const ready = new Promise<void>((resolve) => {
    opened = resolve
  })
  const stream = createAnalysisClient('https://api.example.test').stream(
    'example_user',
    {
      ...callbacks(),
      signal: connection.signal,
      onOpen: opened,
      onDelta: () => {},
    },
  )
  await ready
  t.mock.timers.tick(280_000)
  bodyController!.enqueue(new TextEncoder().encode(': heartbeat\n\n'))
  // Allow the reader continuation to reset its timer before advancing the clock.
  await Promise.resolve()
  await Promise.resolve()
  t.mock.timers.tick(280_000)
  assert.equal(cancelled, false)
  connection.abort()
  await assert.rejects(stream, { name: 'AbortError' })
  assert.equal(cancelled, true)
})

test('idle stream timeout reports an actionable error and closes its body', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  t.mock.method(globalThis, 'fetch', async (_url: URL, init: RequestInit) => {
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          init.signal!.addEventListener(
            'abort',
            () => controller.error(init.signal!.reason),
            { once: true },
          )
        },
      }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    )
  })
  let opened!: () => void
  const ready = new Promise<void>((resolve) => {
    opened = resolve
  })
  const stream = createAnalysisClient('https://api.example.test').stream(
    'example_user',
    {
      ...callbacks(),
      signal: new AbortController().signal,
      onOpen: opened,
      onDelta: () => {},
    },
  )
  await ready
  t.mock.timers.tick(300_000)
  await assert.rejects(stream, /대기 시간이 길어/)
})
