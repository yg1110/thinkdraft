# Thinkdraft - System Architecture

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    macOS (Wails App)                         │
│                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────┐   │
│  │   React UI   │◄──►│         Go Backend               │   │
│  │              │    │                                  │   │
│  │  - Editor    │    │  ┌────────────┐ ┌─────────────┐  │   │
│  │  - Memo List │    │  │ SQLite     │ │ Claude CLI  │  │   │
│  │  - Sidebar   │    │  │ (local DB) │ │ (subprocess)│  │   │
│  │  - AI Panel  │    │  └────────────┘ └─────────────┘  │   │
│  │  - Wiki      │    │                                  │   │
│  └──────────────┘    │  ┌────────────┐ ┌─────────────┐  │   │
│                      │  │ Sync Queue │ │ File Watcher│  │   │
│                      │  └─────┬──────┘ └─────────────┘  │   │
│                      └────────┼──────────────────────────┘   │
└───────────────────────────────┼──────────────────────────────┘
                                │ HTTPS (online only)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server (NestJS)                           │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Auth     │  │ Sync      │  │ Blog     │  │ Stats     │  │
│  │ (API Key)│  │ Module    │  │ Module   │  │ Module    │  │
│  └──────────┘  └───────────┘  └──────────┘  └───────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐                                       │
│  │ Tistory API      │                                       │
│  │ (Blog Publish)   │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

## 2. 계층별 역할 분리

| 계층 | 기술 | 역할 | 오프라인 동작 |
|------|------|------|-------------|
| UI | React (Wails 내장) | 렌더링, 사용자 입력, 상태 관리 | O |
| Local Backend | Go (Wails) | SQLite CRUD, Claude CLI 호출, 동기화 큐 관리 | O (AI는 CLI 의존) |
| Remote Server | NestJS | 메모 백업, 블로그 배포, 통계 집계 | - |
| Local DB | SQLite | 메모, 태그, 위키 링크, 동기화 메타 | O |
| Remote DB | PostgreSQL | 메모 백업, 블로그 글, 통계 | - |
| AI | Claude CLI | 메모 정리, 태그 제안, 주제 추천, 블로그 초안 | O (로컬 CLI) |

### 설계 판단 근거

**왜 SQLite + PostgreSQL 이중 구조인가?**
- 메모 앱의 핵심은 "열자마자 바로 적을 수 있는 것". 네트워크 의존성을 제거하면 cold start가 0에 수렴
- SQLite는 단일 사용자 로컬 읽기/쓰기에 최적. 복잡한 쿼리 없이 key-value + FTS로 충분
- PostgreSQL은 백업/동기화/통계 집계용. 서버가 죽어도 앱은 정상 동작

**왜 Claude CLI인가?**
- API key 관리, HTTP 클라이언트 구현, 에러 핸들링 불필요
- Go에서 `exec.Command("claude", ...)` 한 줄로 호출
- Pro/Max 구독 내 포함 = 추가 비용 없음
- 오프라인에서도 로컬 CLI가 설치되어 있으면 동작 (캐시된 모델 기준)

---

## 3. Database Schema

### 3.1 SQLite (Local)

```sql
-- 메모 본체
CREATE TABLE memos (
  id          TEXT PRIMARY KEY,  -- ULID (시간순 정렬 가능)
  title       TEXT,              -- nullable: 제목 없이 시작 가능
  content     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,     -- ISO 8601
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT,              -- soft delete
  sync_status TEXT NOT NULL DEFAULT 'pending'  -- 'pending' | 'synced' | 'conflict'
);

-- 전문 검색 (FTS5)
CREATE VIRTUAL TABLE memos_fts USING fts5(
  title,
  content,
  content='memos',
  content_rowid='rowid'
);

-- 트리거: 메모 변경 시 FTS 자동 업데이트
CREATE TRIGGER memos_ai AFTER INSERT ON memos BEGIN
  INSERT INTO memos_fts(rowid, title, content)
  VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER memos_ad AFTER DELETE ON memos BEGIN
  INSERT INTO memos_fts(memos_fts, rowid, title, content)
  VALUES ('delete', old.rowid, old.title, old.content);
END;

CREATE TRIGGER memos_au AFTER UPDATE ON memos BEGIN
  INSERT INTO memos_fts(memos_fts, rowid, title, content)
  VALUES ('delete', old.rowid, old.title, old.content);
  INSERT INTO memos_fts(rowid, title, content)
  VALUES (new.rowid, new.title, new.content);
END;

-- 태그
CREATE TABLE tags (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE memo_tags (
  memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source  TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'ai'
  PRIMARY KEY (memo_id, tag_id)
);

-- 위키 링크 (메모 간 연결)
CREATE TABLE wiki_links (
  source_memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  target_memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  PRIMARY KEY (source_memo_id, target_memo_id)
);

-- AI 생성 블로그 초안
CREATE TABLE blog_drafts (
  id           TEXT PRIMARY KEY,
  memo_ids     TEXT NOT NULL,        -- JSON array of memo IDs used as source
  template     TEXT NOT NULL,        -- 'til' | 'troubleshoot' | 'concept' | 'retrospective'
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  published_at TEXT,
  published_url TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

-- 동기화 큐 (오프라인 → 온라인 전환 시 처리)
CREATE TABLE sync_queue (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entity     TEXT NOT NULL,    -- 'memo' | 'tag' | 'memo_tag' | 'wiki_link' | 'blog_draft'
  entity_id  TEXT NOT NULL,
  action     TEXT NOT NULL,    -- 'create' | 'update' | 'delete'
  payload    TEXT NOT NULL,    -- JSON
  created_at TEXT NOT NULL,
  retries    INTEGER NOT NULL DEFAULT 0
);

-- AI 코치 히스토리
CREATE TABLE ai_coach_logs (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,    -- 'weekly_report' | 'topic_suggestion' | 'nudge'
  content     TEXT NOT NULL,    -- JSON: 분석 결과 + 추천 내용
  created_at  TEXT NOT NULL,
  dismissed   INTEGER NOT NULL DEFAULT 0
);

-- 인덱스
CREATE INDEX idx_memos_updated ON memos(updated_at);
CREATE INDEX idx_memos_sync ON memos(sync_status);
CREATE INDEX idx_memos_deleted ON memos(deleted_at);
CREATE INDEX idx_memo_tags_memo ON memo_tags(memo_id);
CREATE INDEX idx_memo_tags_tag ON memo_tags(tag_id);
CREATE INDEX idx_wiki_links_target ON wiki_links(target_memo_id);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity, entity_id);
```

### 3.2 PostgreSQL (Server)

```sql
-- 서버는 SQLite의 미러 + 블로그 배포 메타데이터

CREATE TABLE memos (
  id          TEXT PRIMARY KEY,
  title       TEXT,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE tags (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE memo_tags (
  memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source  TEXT NOT NULL DEFAULT 'user',
  PRIMARY KEY (memo_id, tag_id)
);

CREATE TABLE wiki_links (
  source_memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  target_memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  PRIMARY KEY (source_memo_id, target_memo_id)
);

CREATE TABLE blog_drafts (
  id            TEXT PRIMARY KEY,
  memo_ids      JSONB NOT NULL,
  template      TEXT NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft',
  published_at  TIMESTAMPTZ,
  published_url TEXT,
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL
);

-- 통계용 (2차 기능 대비)
CREATE TABLE daily_stats (
  date        DATE PRIMARY KEY,
  memo_count  INTEGER NOT NULL DEFAULT 0,
  tag_counts  JSONB NOT NULL DEFAULT '{}',
  word_count  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_memos_updated ON memos(updated_at);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
```

### 3.3 ER Diagram

```
┌──────────┐     ┌───────────┐     ┌──────────┐
│  memos   │────<│ memo_tags │>────│   tags   │
│          │     └───────────┘     └──────────┘
│  id (PK) │
│  title   │     ┌─────────────┐
│  content │────<│ wiki_links  │>──── memos (self-ref)
│  ...     │     └─────────────┘
│          │
│          │     ┌──────────────┐
│          │────<│ blog_drafts  │
│          │     │ (memo_ids[]) │
└──────────┘     └──────────────┘

┌────────────────┐     ┌─────────────┐
│  sync_queue    │     │ ai_coach    │
│  (local only)  │     │ _logs       │
└────────────────┘     │ (local only)│
                       └─────────────┘
```

---

## 4. Go Backend (Wails) - Internal Architecture

```
internal/
  app/
    app.go              # Wails app lifecycle (OnStartup, OnShutdown)
  memo/
    service.go          # CRUD + search
    repository.go       # SQLite queries
  tag/
    service.go          # tag CRUD + AI tag suggestion trigger
    repository.go
  wiki/
    service.go          # link parsing ([[...]])  + backlink query
    repository.go
  ai/
    claude.go           # Claude CLI subprocess wrapper
    organizer.go        # 메모 → 블로그 초안 생성
    coach.go            # 주간 분석 + 주제 추천
    tagger.go           # 자동 태그 제안
    prompts.go          # 프롬프트 템플릿 관리
  sync/
    queue.go            # 오프라인 큐 관리
    client.go           # NestJS API 호출 (HTTP)
    engine.go           # 동기화 루프 (온라인 감지 → 큐 처리)
  db/
    sqlite.go           # SQLite 연결 + 마이그레이션
```

### Wails Bindings (React에서 호출 가능한 Go 함수)

```go
// memo/service.go
func (s *MemoService) Create(content string) (*Memo, error)
func (s *MemoService) Update(id string, title *string, content *string) (*Memo, error)
func (s *MemoService) Delete(id string) error
func (s *MemoService) Get(id string) (*Memo, error)
func (s *MemoService) List(offset, limit int) ([]MemoSummary, error)
func (s *MemoService) Search(query string) ([]MemoSummary, error)

// tag/service.go
func (s *TagService) AddTag(memoID, tagName string) error
func (s *TagService) RemoveTag(memoID, tagID string) error
func (s *TagService) ListByMemo(memoID string) ([]Tag, error)
func (s *TagService) ListAll() ([]TagWithCount, error)

// wiki/service.go
func (s *WikiService) GetBacklinks(memoID string) ([]MemoSummary, error)
func (s *WikiService) ParseAndLink(memoID, content string) error

// ai/organizer.go
func (s *AIService) GenerateBlogDraft(memoIDs []string, template string) (*BlogDraft, error)
func (s *AIService) SuggestTags(memoID string) ([]string, error)

// ai/coach.go
func (s *AIService) GetWeeklyReport() (*CoachReport, error)
func (s *AIService) GetTopicSuggestions() ([]TopicSuggestion, error)

// sync/engine.go
func (s *SyncEngine) GetStatus() SyncStatus
func (s *SyncEngine) ForceSync() error
```

### Claude CLI Wrapper

```go
// ai/claude.go
type ClaudeRunner struct {
    model string  // "sonnet" (default) or "opus"
}

func (c *ClaudeRunner) Run(prompt string) (string, error) {
    cmd := exec.Command("claude", "-p", prompt, "--model", c.model)
    output, err := cmd.Output()
    if err != nil {
        return "", fmt.Errorf("claude cli error: %w", err)
    }
    return string(output), nil
}
```

---

## 5. NestJS Server - API Design

### Base URL: `http://localhost:3000/api`

### Authentication

모든 요청에 `X-API-Key` 헤더 포함:
```
X-API-Key: <user-generated-key>
```

### 5.1 Sync API

동기화는 **push 기반**: 클라이언트가 변경사항을 서버로 밀어넣음.

```
POST /api/sync/push
```
```json
// Request
{
  "changes": [
    {
      "entity": "memo",
      "action": "create",
      "data": {
        "id": "01HXK...",
        "title": "NestJS Guard 정리",
        "content": "...",
        "created_at": "2026-05-23T10:00:00Z",
        "updated_at": "2026-05-23T10:00:00Z"
      }
    },
    {
      "entity": "memo_tag",
      "action": "create",
      "data": {
        "memo_id": "01HXK...",
        "tag_id": "01HXL...",
        "source": "user"
      }
    }
  ],
  "last_synced_at": "2026-05-23T09:00:00Z"
}

// Response
{
  "synced": 2,
  "conflicts": [],
  "server_time": "2026-05-23T10:01:00Z"
}
```

```
POST /api/sync/pull
```
```json
// Request
{
  "last_synced_at": "2026-05-23T09:00:00Z"
}

// Response
{
  "changes": [
    {
      "entity": "memo",
      "action": "update",
      "data": { ... }
    }
  ],
  "server_time": "2026-05-23T10:01:00Z"
}
```

**충돌 전략**: `updated_at`이 더 최신인 쪽이 이김 (last-write-wins).

### 5.2 Blog API

```
POST /api/blog/publish
```
```json
// Request
{
  "draft_id": "01HXK...",
  "platform": "tistory",
  "category_id": 123  // optional
}

// Response
{
  "published_url": "https://username.tistory.com/42",
  "published_at": "2026-05-23T10:05:00Z"
}
```

```
GET /api/blog/drafts
GET /api/blog/drafts/:id
DELETE /api/blog/drafts/:id/unpublish
```

### 5.3 Stats API (2차 기능)

```
GET /api/stats/overview
```
```json
// Response
{
  "total_memos": 142,
  "total_tags": 28,
  "streak_days": 12,
  "this_week": {
    "memo_count": 7,
    "word_count": 3200,
    "top_tags": [
      { "name": "NestJS", "count": 4 },
      { "name": "Go", "count": 3 }
    ]
  }
}
```

```
GET /api/stats/heatmap?year=2026
```
```json
// Response
{
  "days": [
    { "date": "2026-05-23", "count": 3 },
    { "date": "2026-05-22", "count": 1 }
  ]
}
```

### 5.4 Tistory Integration

```
GET  /api/tistory/auth          # OAuth redirect
GET  /api/tistory/callback      # OAuth callback
GET  /api/tistory/categories    # 카테고리 목록
```

Tistory Open API 흐름:
```
App → Server → Tistory OAuth → Access Token 저장
App → "Publish" → Server → Tistory API (POST /post/write)
```

### NestJS Module Structure

```
src/
  app.module.ts
  auth/
    api-key.guard.ts          # X-API-Key 검증
  sync/
    sync.module.ts
    sync.controller.ts        # POST /sync/push, /sync/pull
    sync.service.ts           # 충돌 해결 로직
  blog/
    blog.module.ts
    blog.controller.ts
    blog.service.ts
    tistory/
      tistory.service.ts      # Tistory Open API 래퍼
      tistory.controller.ts   # OAuth endpoints
  stats/
    stats.module.ts
    stats.controller.ts
    stats.service.ts
  database/
    database.module.ts        # TypeORM + PostgreSQL
    entities/
      memo.entity.ts
      tag.entity.ts
      memo-tag.entity.ts
      wiki-link.entity.ts
      blog-draft.entity.ts
      daily-stat.entity.ts
```

---

## 6. Data Flow Diagrams

### 6.1 메모 작성 (오프라인 우선)

```
User types → React UI → Wails binding (Go)
                              │
                    ┌─────────▼──────────┐
                    │  SQLite INSERT/     │
                    │  UPDATE (즉시)      │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  sync_queue에       │
                    │  변경 기록 추가     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Online?           │
                    │  Yes → POST /sync  │
                    │  No  → 큐 대기     │
                    └────────────────────┘
```

### 6.2 AI 블로그 초안 생성

```
User selects memos → Choose template
         │
         ▼
┌─────────────────────────────────┐
│  Go: 메모 content 합치기       │
│  + 템플릿별 프롬프트 조합      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  exec.Command("claude", "-p",  │
│    prompt, "--model", "sonnet") │
└────────────┬────────────────────┘
             │ stdout
             ▼
┌─────────────────────────────────┐
│  blog_drafts 테이블에 저장     │
│  React UI에 초안 표시          │
│  User 편집 → 저장              │
└─────────────────────────────────┘
```

### 6.3 동기화 흐름

```
┌─ App Start ──────────────────────────────┐
│                                          │
│  1. Check network connectivity           │
│  2. If online:                           │
│     a. Pull: POST /sync/pull             │
│        → 서버 변경분 로컬 반영           │
│     b. Push: POST /sync/push             │
│        → sync_queue 항목 전송            │
│     c. 성공 시 sync_queue 비우기         │
│  3. If offline:                          │
│     → sync_queue에 계속 적재            │
│     → 네트워크 복귀 감지 시 2번 실행    │
│                                          │
│  * 주기: 5분 간격 polling               │
│  * 네트워크 변경 이벤트 시 즉시 실행    │
└──────────────────────────────────────────┘
```

---

## 7. AI Prompt Templates

### 블로그 초안 생성

```
# TIL Template
아래 메모들을 "Today I Learned" 블로그 글로 정리해줘.

규칙:
- 제목은 핵심 키워드를 포함한 한 줄
- "## 배경", "## 내용", "## 배운 점" 3섹션 구조
- 코드가 있으면 코드블록으로 포맷팅
- 구어체를 자연스러운 기술 블로그 문체로
- 원본 의미를 왜곡하지 마

메모:
---
{memo_contents}
---
```

```
# Troubleshoot Template
아래 메모들을 "트러블슈팅" 블로그 글로 정리해줘.

규칙:
- "## 문제 상황", "## 원인 분석", "## 해결 방법", "## 정리" 4섹션
- 에러 메시지가 있으면 코드블록으로
- 시도한 것과 실패한 것도 포함
...
```

### 태그 제안

```
아래 메모의 내용을 분석해서 적절한 태그를 3~5개 추천해줘.
기존 태그 목록: {existing_tags}
기존 태그에 있으면 그걸 우선 사용하고, 없으면 새 태그를 제안해.
JSON 배열로만 응답해: ["tag1", "tag2", ...]

메모:
---
{memo_content}
---
```

### 주간 코치

```
아래는 이번 주에 작성된 메모 목록이야.

{weekly_memos_summary}

다음을 분석해줘:
1. 이번 주 주요 학습 주제 (2~3개)
2. 블로그 글로 정리하면 좋을 주제 추천 (구체적 제목 포함)
3. 지난주 대비 변화 (주제, 빈도)
4. 한 줄 응원 메시지

JSON으로 응답해:
{
  "topics": [...],
  "blog_suggestions": [{ "title": "...", "reason": "...", "source_memo_ids": [...] }],
  "trend": "...",
  "message": "..."
}
```

---

## 8. Project Structure

```
thinkdraft/
├── frontend/                    # React (Wails embedded)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar/
│   │   │   ├── MemoList/
│   │   │   ├── Editor/
│   │   │   ├── AIPanel/
│   │   │   ├── BlogPreview/
│   │   │   ├── TagInput/
│   │   │   └── WikiLink/
│   │   ├── hooks/
│   │   │   ├── useMemo.ts
│   │   │   ├── useTags.ts
│   │   │   ├── useWiki.ts
│   │   │   ├── useAI.ts
│   │   │   └── useSync.ts
│   │   ├── stores/              # Zustand
│   │   │   ├── memoStore.ts
│   │   │   ├── uiStore.ts
│   │   │   └── syncStore.ts
│   │   ├── styles/
│   │   │   └── tokens.css       # design.md 기반 CSS variables
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
│
├── internal/                    # Go backend
│   ├── app/
│   ├── memo/
│   ├── tag/
│   ├── wiki/
│   ├── ai/
│   ├── sync/
│   └── db/
│
├── server/                      # NestJS
│   ├── src/
│   │   ├── auth/
│   │   ├── sync/
│   │   ├── blog/
│   │   │   └── tistory/
│   │   ├── stats/
│   │   └── database/
│   ├── package.json
│   └── tsconfig.json
│
├── wails.json
├── go.mod
├── design.md
├── architecture.md
└── README.md
```

---

## 9. 기술 스택 확정

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|----------|
| Desktop Framework | Wails | v2 | Go + 웹 프론트, 회사 프로젝트 시너지 |
| Frontend | React | 19 | 기존 강점 |
| State | Zustand | 5 | 보일러플레이트 최소, Wails와 궁합 좋음 |
| Styling | Tailwind CSS | 4 | design.md 토큰 → CSS variables로 매핑 |
| Editor | Tiptap | 2 | 마크다운 + 위키링크 확장 가능, React 네이티브 |
| Local DB | SQLite | - | Go의 modernc.org/sqlite (CGo-free) |
| Server | NestJS | 11 | 풀스택 역량 증명, TypeORM 통합 |
| Server DB | PostgreSQL | 16 | 실무 스택 일치 |
| ORM | TypeORM | 0.3 | NestJS 공식 통합 |
| AI | Claude CLI | - | 비용 절감, 구현 단순 |
| ID | ULID | - | 시간순 정렬 + 분산 생성 가능 |

---

## 10. MVP Scope Decision Log

| 결정 | 선택 | 대안 | 근거 |
|------|------|------|------|
| 에디터 | Tiptap | CodeMirror, Monaco | 마크다운 + 위키링크 커스텀 쉬움, 번들 사이즈 작음 |
| 상태관리 | Zustand | Redux, Jotai | Wails binding과 직접 연결, 최소 보일러플레이트 |
| SQLite 드라이버 | modernc.org/sqlite | mattn/go-sqlite3 | CGo 불필요 = 크로스컴파일 쉬움 |
| 동기화 | Push 기반 (클라→서버) | CRDT, 실시간 WebSocket | 1인 사용, 단방향이면 충분. CRDT는 과잉 |
| 충돌 해결 | Last-write-wins | Manual merge | 1인 사용이므로 충돌 자체가 거의 불가능 |
| 블로그 연동 | Tistory | Velog | Tistory는 공식 Open API 제공, Velog는 비공식 |
