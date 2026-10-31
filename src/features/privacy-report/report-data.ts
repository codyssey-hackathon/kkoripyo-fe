export type Severity = 'high' | 'medium' | 'low'

export type ReportDetailTab = 'evidence' | 'reason' | 'protection'

export const severityLabels: Record<Severity, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export type Category = '위치' | '신원' | '소속' | '연락처' | '생활 패턴'

export type Source = {
  label: string
  owner: 'me' | 'other'
}

export type Evidence = {
  id: string
  kind: 'image' | 'text'
  source: string
  date: string
  text: string
  highlight: string
  image?: string
  url?: string
}

export type Warning = {
  id: string
  title: string
  severity: Severity
  category: Category
  information: string
  detection: 'AI 추론' | '직접 확인'
  reason: string[]
  sources: Source[]
  evidence: Evidence[]
  action: string
  actionDetail: string
}

// All account details, analysis scores, captions, and comments are fictional samples.
export const report = {
  account: 'daily.example',
  displayName: '일상을 기록하는 예시 계정',
  score: 72,
  analyzedAt: '2026-10-31T14:30:00+09:00',
  posts: 24,
  comments: 86,
}

export const categoryScores: { label: Category; score: number }[] = [
  { label: '위치', score: 86 },
  { label: '신원', score: 68 },
  { label: '소속', score: 52 },
  { label: '연락처', score: 74 },
  { label: '생활 패턴', score: 40 },
]

export const warnings: Warning[] = [
  {
    id: 'home-location',
    title: '거주 지역이 추정될 수 있어요',
    severity: 'high',
    category: '위치',
    information: '서울 성수동 인근에 거주할 가능성이 있어요.',
    detection: 'AI 추론',
    reason: [
      '게시글에 성수동을 언급하면서 해당 카페를 집 앞이라고 표현했어요.',
      '타인의 댓글에서도 같은 장소가 집 근처라는 단서가 반복돼요.',
      '사진 자체가 아니라 예시 게시글과 댓글의 문맥을 연결한 추정이에요. 실제 거주지는 확인되지 않았어요.',
    ],
    sources: [
      { label: '내 게시물', owner: 'me' },
      { label: '타인의 댓글', owner: 'other' },
    ],
    evidence: [
      {
        id: 'home-caption',
        kind: 'image',
        source: '내 게시물',
        date: '2026.10.24',
        text: '오늘도 집 앞 단골 카페. 성수동에서 보내는 느린 아침.',
        highlight: '성수동',
        image: '/images/mock-coffee.jpg',
      },
      {
        id: 'home-comment',
        kind: 'text',
        source: '타인의 댓글',
        date: '2026.10.24',
        text: '여기 너희 집 바로 앞이잖아! 다음에 같이 가자.',
        highlight: '너희 집 바로 앞',
      },
    ],
    action: '위치와 집 근처라는 표현을 지워주세요',
    actionDetail:
      '게시글의 상세 위치와 집 앞이라는 표현을 삭제하세요. 타인의 댓글은 작성자에게 수정을 요청하거나 숨김 기능을 확인하세요.',
  },
  {
    id: 'public-contact',
    title: '연락처가 공개되어 있어요',
    severity: 'high',
    category: '연락처',
    information: '프로필에 기재한 이메일을 누구나 확인할 수 있어요.',
    detection: '직접 확인',
    reason: [
      '공개 프로필 소개글에 이메일 주소가 그대로 표시되어 있어요.',
      '계정을 방문한 사람이 별도 승인 없이 연락처를 복사할 수 있어요.',
    ],
    sources: [{ label: '내 프로필', owner: 'me' }],
    evidence: [
      {
        id: 'profile-contact',
        kind: 'text',
        source: '내 프로필',
        date: '2026.10.31',
        text: '느린 일상을 기록합니다. 연락: daily@example.com',
        highlight: 'daily@example.com',
      },
    ],
    action: '소개글에서 개인 연락처를 삭제하세요',
    actionDetail:
      '개인 이메일을 삭제하거나 공개용으로 분리한 연락처로 변경하세요.',
  },
  {
    id: 'real-name',
    title: '댓글에서 실명이 언급됐어요',
    severity: 'high',
    category: '신원',
    information: '댓글에 적힌 이름과 계정 주인이 연결될 수 있어요.',
    detection: 'AI 추론',
    reason: [
      '타인이 계정 주인을 부르는 문맥으로 성과 이름을 함께 작성했어요.',
      '해당 이름이 실제 계정 주인의 실명인지는 확인되지 않았어요.',
    ],
    sources: [{ label: '타인의 댓글', owner: 'other' }],
    evidence: [
      {
        id: 'name-comment',
        kind: 'text',
        source: '타인의 댓글',
        date: '2026.10.21',
        text: '김예시, 사진 잘 찍었네! 다음에도 같이 가자.',
        highlight: '김예시',
      },
    ],
    action: '이름이 포함된 댓글의 수정을 요청하세요',
    actionDetail:
      '댓글 작성자에게 이름을 지워달라고 요청하세요. 직접 수정할 수 없다면 댓글 숨김이나 삭제 기능을 확인하세요.',
  },
  {
    id: 'work-affiliation',
    title: '소속 회사를 추정할 수 있어요',
    severity: 'medium',
    category: '소속',
    information: '예시스튜디오 소속일 가능성이 있어요.',
    detection: 'AI 추론',
    reason: [
      '게시글에서 회사명을 언급하고 출근이라는 표현을 사용했어요.',
      '재직 여부나 구체적인 직무는 확인되지 않았어요.',
    ],
    sources: [{ label: '내 게시물', owner: 'me' }],
    evidence: [
      {
        id: 'work-caption',
        kind: 'text',
        source: '내 게시물',
        date: '2026.10.18',
        text: '예시스튜디오로 출근한 지 한 달. 오늘도 잘 부탁해요.',
        highlight: '예시스튜디오로 출근',
      },
    ],
    action: '회사명과 출근 관련 표현을 수정하세요',
    actionDetail:
      '회사를 특정하는 이름을 삭제하거나 해당 게시물의 공개 범위를 제한하세요.',
  },
  {
    id: 'daily-routine',
    title: '반복되는 활동 시간이 드러나요',
    severity: 'medium',
    category: '생활 패턴',
    information: '평일 오전 7시 전후에 운동할 가능성이 있어요.',
    detection: 'AI 추론',
    reason: [
      '서로 다른 날짜의 게시글에서 평일 오전 7시 운동을 반복해서 언급했어요.',
      '게시 시간과 실제 활동 시간은 다를 수 있어요.',
    ],
    sources: [{ label: '내 게시물', owner: 'me' }],
    evidence: [
      {
        id: 'routine-caption-one',
        kind: 'text',
        source: '내 게시물',
        date: '2026.10.20',
        text: '평일 오전 7시 러닝 완료. 오늘도 상쾌하게 시작.',
        highlight: '평일 오전 7시',
      },
      {
        id: 'routine-caption-two',
        kind: 'text',
        source: '내 게시물',
        date: '2026.10.22',
        text: '이번 주도 평일 오전 7시 러닝을 이어가는 중.',
        highlight: '평일 오전 7시',
      },
    ],
    action: '정확한 활동 시간을 삭제하세요',
    actionDetail:
      '규칙적인 시간 표현을 삭제하고 활동이 끝난 뒤 시차를 두고 게시하세요.',
  },
  {
    id: 'frequent-place',
    title: '자주 찾는 장소가 언급됐어요',
    severity: 'low',
    category: '위치',
    information: '예시책방을 자주 방문할 가능성이 있어요.',
    detection: 'AI 추론',
    reason: [
      '연관 계정이 공개 댓글에서 반복적인 방문을 언급했어요.',
      '댓글 내용만으로 실제 방문 빈도를 확인할 수는 없어요.',
    ],
    sources: [{ label: '연관 계정', owner: 'other' }],
    evidence: [
      {
        id: 'place-comment',
        kind: 'text',
        source: '연관 계정의 댓글',
        date: '2026.10.12',
        text: '이번 달도 예시책방에서 자주 만나네요. 다음에 또 봐요!',
        highlight: '예시책방에서 자주',
      },
    ],
    action: '장소가 특정되는 댓글을 확인하세요',
    actionDetail:
      '해당 장소의 공개가 부담된다면 댓글 작성자에게 장소명 수정을 요청하세요.',
  },
]
