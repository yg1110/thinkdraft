# Thinkdraft - Implementation Workflow

> 주 10시간 기준, 1차 MVP (A: 퀵메모, B: AI 정리, C: 위키, D: AI 코치)

---

## Phase 0: 프로젝트 셋업 (Week 1 - 10h)

### 0-1. Wails + React 프로젝트 초기화 (3h)
- [ ] Wails v2 설치 및 프로젝트 생성 (`wails init -n thinkdraft -t react-ts`)
- [ ] React 프로젝트 정리: 불필요한 보일러플레이트 제거
- [ ] Tailwind CSS 4 설치 및 `tokens.css` 작성 (design.md 기반 CSS variables)
- [ ] Wails dev 모드 실행 확인

### 0-2. Go 백엔드 기반 구조 (3h)
- [ ] `internal/` 디렉토리 구조 생성
- [ ] SQLite 연결 설정 (`modernc.org/sqlite`)
- [ ] 마이그레이션 시스템: `db/migrations/` SQL 파일 기반 순차 실행
- [ ] 전체 스키마 초기 마이그레이션 파일 작성

### 0-3. NestJS 서버 초기화 (2h)
- [ ] NestJS 프로젝트 생성 (`server/`)
- [ ] TypeORM + PostgreSQL 연결
- [ ] API Key Guard 구현
- [ ] Entity 파일 생성 (memo, tag, memo_tag, wiki_link, blog_draft)

### 0-4. 개발환경 확인 (2h)
- [ ] Wails dev + NestJS dev 동시 실행 확인
- [ ] Go → SQLite CRUD 동작 확인 (간단한 테스트)
- [ ] Wails binding 호출 테스트 (React → Go 함수 호출)

**Checkpoint**: Wails 앱이 뜨고, Go에서 SQLite 읽기/쓰기 되고, NestJS 서버 `/health` 응답

---

## Phase 1: 퀵메모 (Feature A) (Week 2-3 - 20h)

### 1-1. Go: 메모 서비스 (4h)
- [ ] `internal/memo/repository.go` — SQLite CRUD
- [ ] `internal/memo/service.go` — Create, Update, Delete, Get, List, Search
- [ ] FTS5 검색 쿼리 구현
- [ ] ULID 생성 유틸리티
- [ ] Wails binding 등록

### 1-2. React: 3패널 레이아웃 (4h)
- [ ] `App.tsx` — 3패널 레이아웃 (Sidebar | MemoList | Editor)
- [ ] CSS variables 적용 (design.md 토큰)
- [ ] 패널 크기 조절 (드래그 리사이즈)
- [ ] 반응형: 윈도우 900px 미만 시 사이드바 축소

### 1-3. React: 메모 에디터 (5h)
- [ ] Tiptap 설치 및 기본 에디터 구성
- [ ] 마크다운 입력 지원 (headings, bold, italic, code, list)
- [ ] 코드 블록 하이라이팅 (lowlight 확장)
- [ ] 제목 입력 (별도 input, placeholder: "제목 없음")
- [ ] 자동 저장: 입력 멈춤 후 500ms debounce → Go binding 호출

### 1-4. React: 메모 리스트 (3h)
- [ ] 메모 목록 컴포넌트 (제목, 미리보기 2줄, 날짜)
- [ ] 활성 메모 하이라이트
- [ ] 새 메모 버튼 (`Cmd+N`)
- [ ] 삭제 (soft delete, 확인 모달)

### 1-5. React: 검색 (2h)
- [ ] 검색 바 (리스트 패널 상단)
- [ ] FTS5 검색 결과 표시
- [ ] `Cmd+K` 글로벌 검색 (커맨드 팔레트 스타일)

### 1-6. 글로벌 단축키 (2h)
- [ ] Wails 글로벌 단축키 등록: `Cmd+Shift+N` → 앱 포커스 + 새 메모
- [ ] `Cmd+\` 사이드바 토글
- [ ] `Cmd+[` / `Cmd+]` 메모 리스트 네비게이션

**Checkpoint**: 앱에서 메모 생성/편집/삭제/검색이 되고, 자동저장이 동작하고, 단축키가 동작

---

## Phase 2: AI 정리 (Feature B) (Week 4-5 - 20h)

### 2-1. Go: Claude CLI 래퍼 (3h)
- [ ] `internal/ai/claude.go` — `exec.Command` 래퍼
- [ ] 타임아웃 처리 (30초)
- [ ] 에러 핸들링 (CLI 미설치, 네트워크 없음 등)
- [ ] CLI 설치 여부 체크 함수

### 2-2. Go: 프롬프트 템플릿 (3h)
- [ ] `internal/ai/prompts.go` — 4개 템플릿 정의
  - TIL
  - Troubleshoot (트러블슈팅)
  - Concept (개념 정리)
  - Retrospective (회고)
- [ ] 메모 내용 삽입 로직
- [ ] JSON 응답 파싱 유틸리티

### 2-3. Go: 블로그 초안 서비스 (3h)
- [ ] `internal/ai/organizer.go` — GenerateBlogDraft
- [ ] 메모 ID 배열 → 내용 합치기 → 프롬프트 생성 → Claude CLI 호출
- [ ] blog_drafts 테이블 저장
- [ ] 초안 CRUD (Get, List, Update, Delete)

### 2-4. React: 메모 선택 UI (3h)
- [ ] 메모 리스트에서 다중 선택 모드 (체크박스)
- [ ] 선택된 메모 카운트 표시
- [ ] "AI로 정리하기" 버튼 (선택 시 활성화)

### 2-5. React: 템플릿 선택 + 생성 (4h)
- [ ] 템플릿 선택 모달 (TIL / Troubleshoot / Concept / Retrospective)
- [ ] 템플릿 칩 UI (design.md의 blog-template-chip)
- [ ] 생성 중 로딩 상태 (Claude CLI 응답 대기)
- [ ] 에러 상태 처리

### 2-6. React: 블로그 초안 편집 (4h)
- [ ] 블로그 프리뷰 패널 (design.md의 blog-preview: 라이트 모드 표시)
- [ ] 초안 편집 (Tiptap 재사용, 라이트 테마)
- [ ] 원본 메모 ↔ 초안 나란히 보기
- [ ] 초안 저장/삭제
- [ ] 초안 목록 (사이드바에 "Blog Drafts" 섹션)

**Checkpoint**: 메모 3개 선택 → TIL 템플릿 → Claude가 블로그 글 생성 → 편집 → 저장

---

## Phase 3: 위키 모드 (Feature C) (Week 6-7 - 20h)

### 3-1. Go: 위키 링크 서비스 (4h)
- [ ] `internal/wiki/service.go`
- [ ] `[[메모 제목]]` 파싱 (정규식)
- [ ] 메모 저장 시 자동으로 wiki_links 테이블 업데이트
- [ ] 역링크(backlink) 조회
- [ ] 존재하지 않는 메모 링크 감지 (빨간 링크)

### 3-2. Go: 태그 서비스 (3h)
- [ ] `internal/tag/service.go` — CRUD
- [ ] 태그별 메모 수 집계
- [ ] 태그 자동완성 (prefix 검색)

### 3-3. React: Tiptap 위키링크 확장 (5h)
- [ ] Tiptap custom node: `WikiLink`
- [ ] `[[` 입력 시 자동완성 팝업 (메모 제목 검색)
- [ ] 위키링크 클릭 → 해당 메모로 이동
- [ ] 존재하지 않는 링크: 빨간색 표시 (design.md wiki-link-missing)
- [ ] 새 메모 생성 옵션 ("이 제목으로 새 메모 만들기")

### 3-4. React: 태그 UI (3h)
- [ ] 에디터 하단 태그 입력 (TagInput 컴포넌트)
- [ ] 태그 자동완성
- [ ] 태그 추가/삭제
- [ ] 사이드바 태그 목록 (태그별 메모 수 표시)
- [ ] 태그 클릭 → 해당 태그 메모 필터링

### 3-5. Go: AI 태그 제안 (2h)
- [ ] `internal/ai/tagger.go` — SuggestTags
- [ ] 메모 저장 후 백그라운드에서 태그 제안 생성
- [ ] 기존 태그 목록을 프롬프트에 포함

### 3-6. React: AI 태그 제안 UI (3h)
- [ ] 태그 영역에 AI 제안 태그 표시 (점선 테두리, design.md tag-ai-suggested)
- [ ] 클릭으로 수락/거절
- [ ] 제안 태그 애니메이션 (fade in)

**Checkpoint**: `[[Guard 정리]]` 입력 → 자동완성 → 클릭 시 이동, AI가 태그 3개 제안 → 수락

---

## Phase 4: AI 코치 (Feature D) (Week 8-9 - 20h)

### 4-1. Go: 주간 리포트 생성 (5h)
- [ ] `internal/ai/coach.go` — GetWeeklyReport
- [ ] 이번 주 메모 집계 (개수, 태그 분포, 단어 수)
- [ ] Claude CLI에 주간 메모 요약 전달 → 분석 결과 수신
- [ ] ai_coach_logs 테이블 저장
- [ ] GetTopicSuggestions — 블로그 주제 추천

### 4-2. Go: 넛지 시스템 (3h)
- [ ] 마지막 메모 작성일 체크
- [ ] 3일 이상 미기록 시 넛지 메시지 생성
- [ ] 앱 시작 시 체크 → ai_coach_logs에 저장

### 4-3. React: AI 코치 배너 (4h)
- [ ] 에디터 상단 또는 사이드바에 코치 배너 (design.md ai-coach-banner)
- [ ] 주간 리포트 카드: 메모 수, 주요 주제, 트렌드
- [ ] 블로그 주제 추천 목록 ("이 주제로 글 써볼래?" + 관련 메모 링크)
- [ ] 넛지 알림 ("3일째 메모가 없어요")
- [ ] 배너 닫기 (dismissed 처리)

### 4-4. React: 주간 리포트 페이지 (4h)
- [ ] 사이드바 "Weekly Report" 메뉴
- [ ] 리포트 카드 UI (design.md report-card, stat-number, stat-label)
- [ ] 이번 주 메모 수, 단어 수, 태그 분포
- [ ] 주제 추천 카드 목록
- [ ] 지난 주 대비 변화 표시

### 4-5. 자동 실행 스케줄 (2h)
- [ ] 앱 시작 시 마지막 리포트 날짜 체크
- [ ] 월요일 첫 실행 시 자동 주간 리포트 생성
- [ ] 백그라운드 goroutine으로 주기적 넛지 체크

### 4-6. 통합 테스트 + 폴리시 (2h)
- [ ] 전체 흐름 테스트: 메모 → AI 태그 → 위키링크 → 블로그 초안 → 코치 추천
- [ ] 엣지 케이스: 빈 메모, 매우 긴 메모, 특수문자 제목
- [ ] UI 다듬기: 전환 애니메이션, 로딩 상태 일관성

**Checkpoint**: 월요일에 앱 열면 "지난주 메모 7개, NestJS 주제 추천" 배너가 보임

---

## Phase 5: 동기화 + 마무리 (Week 10 - 10h)

### 5-1. Go: 동기화 엔진 (4h)
- [ ] `internal/sync/queue.go` — 큐 관리 (추가, 조회, 삭제)
- [ ] `internal/sync/client.go` — NestJS API 호출 (push/pull)
- [ ] `internal/sync/engine.go` — 동기화 루프
  - 앱 시작 시 pull → push
  - 5분 간격 polling
  - 네트워크 상태 변경 감지 시 즉시 실행
- [ ] Last-write-wins 충돌 해결

### 5-2. NestJS: Sync API 구현 (3h)
- [ ] `POST /api/sync/push` — 변경사항 수신 → PostgreSQL 반영
- [ ] `POST /api/sync/pull` — last_synced_at 이후 변경분 반환
- [ ] 트랜잭션 처리 (부분 실패 방지)

### 5-3. React: 동기화 상태 표시 (1h)
- [ ] 상태 표시: Synced / Syncing / Offline (design.md sync-indicator)
- [ ] 에디터 하단 우측에 작은 인디케이터

### 5-4. 최종 마무리 (2h)
- [ ] 전체 기능 통합 테스트
- [ ] 앱 아이콘 설정
- [ ] Wails 빌드 (`wails build`) 확인
- [ ] README.md 작성

**Checkpoint**: 오프라인에서 메모 3개 작성 → 와이파이 켜기 → 자동 동기화 → 서버 DB에 반영 확인

---

## Timeline Summary

```
Week 1   ██████████ Phase 0: 프로젝트 셋업
Week 2   ██████████ Phase 1: 퀵메모 (전반)
Week 3   ██████████ Phase 1: 퀵메모 (후반)
Week 4   ██████████ Phase 2: AI 정리 (전반)
Week 5   ██████████ Phase 2: AI 정리 (후반)
Week 6   ██████████ Phase 3: 위키 모드 (전반)
Week 7   ██████████ Phase 3: 위키 모드 (후반)
Week 8   ██████████ Phase 4: AI 코치 (전반)
Week 9   ██████████ Phase 4: AI 코치 (후반)
Week 10  ██████████ Phase 5: 동기화 + 마무리
```

| Phase | 기간 | 시간 | 핵심 산출물 |
|-------|------|------|-----------|
| 0 | Week 1 | 10h | Wails + NestJS 프로젝트 뼈대 |
| 1 | Week 2-3 | 20h | 메모 CRUD + 에디터 + 검색 + 단축키 |
| 2 | Week 4-5 | 20h | Claude CLI 연동 + 블로그 초안 생성 |
| 3 | Week 6-7 | 20h | 위키링크 + 태그 + AI 태그 제안 |
| 4 | Week 8-9 | 20h | 주간 리포트 + 주제 추천 + 넛지 |
| 5 | Week 10 | 10h | 동기화 + 빌드 + 마무리 |
| **Total** | **10주** | **100h** | **1차 MVP 완성** |

---

## 2차 기능 (Week 11~)

| 기능 | 예상 | 의존성 |
|------|------|--------|
| E. Tistory 블로그 배포 | 2주 (20h) | Phase 5 동기화 완료 후 |
| F. 성장 대시보드 | 2주 (20h) | Phase 4 코치 데이터 기반 |

---

## Risk & Mitigation

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Tiptap 위키링크 커스텀이 예상보다 복잡 | Phase 3 지연 | 먼저 프로토타입 (Week 1에 spike), 안 되면 단순 regex 파싱 + 링크 렌더링 |
| Claude CLI 응답 속도가 느림 (>10초) | UX 저하 | 스트리밍 출력 표시, 백그라운드 생성 후 알림 |
| Wails 글로벌 단축키가 macOS에서 불안정 | Phase 1 일부 기능 누락 | macOS 네이티브 키 바인딩 라이브러리 대체 검토 |
| SQLite + PostgreSQL 동기화 충돌 | 데이터 불일치 | 1인 사용이므로 LWW로 충분. 심각한 경우 서버 데이터 우선 |

---

## Definition of Done (MVP)

- [ ] 앱 실행 → 2초 이내 입력 가능
- [ ] 오프라인에서 메모 작성/편집/삭제/검색 동작
- [ ] 메모 선택 → 템플릿 선택 → AI 블로그 초안 생성 → 편집 → 저장
- [ ] `[[메모 제목]]` 위키링크 동작 (자동완성 + 이동)
- [ ] AI 태그 제안 → 수락/거절
- [ ] 주간 리포트 + 블로그 주제 추천
- [ ] 온라인 시 서버 자동 동기화
- [ ] `Cmd+Shift+N` 글로벌 단축키로 즉시 메모
