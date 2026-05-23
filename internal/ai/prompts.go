package ai

import "fmt"

// Template type constants for blog draft generation.
const (
	TemplateTIL           = "til"
	TemplateTroubleshoot  = "troubleshoot"
	TemplateConcept       = "concept"
	TemplateRetrospective = "retrospective"
)

var templatePrompts = map[string]string{
	TemplateTIL: `오늘 배운 내용을 정리해서 TIL 블로그 글을 작성해줘.
마크다운 형식으로 작성하고, 다음 구조를 포함해줘:
- 제목 (첫 줄에 # 제목 형식으로)
- 핵심 내용
- 배운 점
- 다음 단계

아래는 정리할 메모 내용이야:

---
%s`,

	TemplateTroubleshoot: `다음 트러블슈팅 과정을 블로그 글로 정리해줘.
마크다운 형식으로 작성하고, 다음 구조를 포함해줘:
- 제목 (첫 줄에 # 제목 형식으로)
- 문제 상황
- 원인 분석
- 해결 과정
- 교훈

아래는 정리할 메모 내용이야:

---
%s`,

	TemplateConcept: `다음 개념을 정리한 블로그 글을 작성해줘.
마크다운 형식으로 작성하고, 다음 구조를 포함해줘:
- 제목 (첫 줄에 # 제목 형식으로)
- 개념 설명
- 왜 중요한지
- 실제 활용 사례
- 핵심 정리

아래는 정리할 메모 내용이야:

---
%s`,

	TemplateRetrospective: `다음 내용을 바탕으로 회고 블로그 글을 작성해줘.
마크다운 형식으로 작성하고, 다음 구조를 포함해줘:
- 제목 (첫 줄에 # 제목 형식으로)
- 목표
- 한 일
- 잘한 점
- 개선할 점
- 다음 액션

아래는 정리할 메모 내용이야:

---
%s`,
}

// BuildPrompt constructs a full prompt for the given template and memo contents.
func BuildPrompt(template string, memoContents string) string {
	tmpl, ok := templatePrompts[template]
	if !ok {
		tmpl = templatePrompts[TemplateTIL]
	}
	return fmt.Sprintf(tmpl, memoContents)
}
