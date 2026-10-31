import {
  categoryScores,
  report,
  severityLabels,
  warnings,
} from '@/features/privacy-report/report-data'

// A single sample response, matching the text-only shape planned for the backend.
// The renderer does not look up warnings or evidence while the answer streams.
export const exampleResponse = [
  `공개된 게시물 **${report.posts}개**와 댓글 **${report.comments}개**를 살펴본 예시 분석이에요. 내 콘텐츠뿐 아니라 타인이 남긴 댓글과 연관 계정의 단서도 함께 확인했어요.`,
  '먼저 나를 특정할 수 있는 정보부터 살펴볼게요. 각 항목에서 **노출된 정보 → 판단 근거 → 보호 방법**을 순서대로 확인할 수 있어요.',
  ...warnings.flatMap((warning, index) => [
    `## ${index + 1}. ${warning.title}`,
    `**위험도 ${severityLabels[warning.severity]}** · ${warning.category} · ${warning.detection}`,
    warning.information,
    '**판단 근거**',
    ...warning.reason,
    '**단서가 발견된 콘텐츠**',
    ...warning.evidence.flatMap((evidence) => [
      `> ${evidence.text}\n>\n> — ${evidence.source} · ${evidence.date}`,
      ...(evidence.url ? [`[원문 보기](${evidence.url})`] : []),
    ]),
    ...(index === 0
      ? [
          '아래 사진은 게시물의 화면 구성을 보여주기 위한 예시예요. 실제 위치를 판별한 사진은 아니에요.',
          '![게시물 예시: 커피 머신에서 에스프레소를 내리는 장면](/images/mock-coffee.jpg)',
          '예시 사진: [Shixart1985 / CC BY 2.0](https://commons.wikimedia.org/wiki/File:Espresso_coffee_pouring_from_retro_espresso_machine.jpg)',
        ]
      : []),
    '**권장 조치**',
    `- ${warning.actionDetail}`,
    ...(warning.evidence.some((evidence) => evidence.kind === 'image')
      ? [
          '- 사진이나 위치 태그에 같은 단서가 있다면 해당 부분을 가리거나 삭제하세요. 실제 이미지 편집 기능은 아직 제공하지 않아요.',
        ]
      : []),
  ]),
  '## 분석을 마치며',
  `예시 종합 노출 위험 점수는 **${report.score}/100점**이에요. 발견한 경고 ${warnings.length}개 중 **위험도가 높은 ${warnings.filter((warning) => warning.severity === 'high').length}개**를 먼저 확인해 주세요. 점수가 높을수록 노출 위험이 커요.`,
  '**유형별 예시 위험 점수**',
  ...categoryScores.map(
    (category) => `- ${category.label}: **${category.score}/100점**`,
  ),
  '거주 지역과 개인 연락처처럼 나를 특정할 수 있는 단서부터 공개 범위를 줄여보세요. 타인이 작성한 댓글은 작성자에게 수정을 요청하거나 숨김·삭제 기능을 확인하세요.',
  '> 이 결과는 가상의 계정과 콘텐츠로 구성한 예시예요. AI의 추론은 실제 사실과 다를 수 있고, 분석한 범위 밖의 위험까지 확인했다는 의미는 아니에요.',
].join('\n\n')
