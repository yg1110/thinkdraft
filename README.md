# Thinkdraft

> 개발자를 위한 macOS 메모 앱 — 빠르게 적고, AI가 정리하고, 블로그로 키운다.

Thinkdraft는 개발자가 학습하며 남긴 짧은 메모를 **AI로 정리해 블로그 초안으로 키우고**, 메모 간 연결(위키 링크)과 주간 회고까지 이어주는 오프라인 우선(offline-first) 데스크톱 앱입니다. Wails(Go + React)로 만든 로컬 앱과 NestJS 백업/동기화 서버로 구성됩니다.

핵심 가치는 **"열자마자 바로 적을 수 있는 것"** 입니다. 모든 읽기/쓰기는 로컬 SQLite에서 즉시 일어나고, 네트워크가 연결되면 백그라운드에서 서버로 동기화됩니다.

---

## 주요 기능

| 영역 | 기능 |
|------|------|
| **퀵 메모** | Tiptap 기반 마크다운 에디터, 자동 저장, FTS5 전문 검색, 커맨드 팔레트(`Cmd+K`), 패널 리사이즈, 메모 고정(pin) |
| **AI 정리** | 선택한 메모들을 Claude CLI로 블로그 초안 생성 (TIL / 트러블슈팅 / 개념 정리 / 회고 템플릿) |
| **위키 & 태그** | `[[메모 제목]]` 위키 링크 + 자동완성, 역링크(backlink), 태그 관리, AI 자동 태그 제안 |
| **AI 코치** | 주간 리포트(메모 수·주제·트렌드), 블로그 주제 추천, 작성 공백 넛지(nudge) |
| **동기화** | 오프라인 변경 큐 적재 → 온라인 시 자동 push/pull, last-write-wins 충돌 해결, 동기화 상태 인디케이터 |

---

## 아키텍처

```
┌──────────────────────────── macOS (Wails App) ────────────────────────────┐
│  React UI  ◄──Wails bindings──►  Go Backend                                │
│  (Tiptap, Zustand)                ├─ SQLite (로컬 DB, FTS5)                 │
│                                   ├─ Claude CLI (subprocess) → AI 기능     │
│                                   └─ Sync Queue + Engine                   │
└────────────────────────────────────────┬───────────────────────────────────┘
                                          │ HTTPS (온라인일 때만)
                                          ▼
┌──────────────────────────── Server (NestJS) ──────────────────────────────┐
│  API Key Guard │ Sync Module │ Health │  →  PostgreSQL (백업/미러)         │
└────────────────────────────────────────────────────────────────────────────┘
```

- **SQLite + PostgreSQL 이중 구조**: 로컬은 즉시성, 서버는 백업/동기화. 서버가 죽어도 앱은 정상 동작.
- **Claude CLI 사용**: API 키·HTTP 클라이언트 구현 없이 `exec.Command("claude", ...)`로 호출. Pro/Max 구독에 포함되어 추가 비용 없음.
- **Push 기반 동기화**: 1인 사용 전제로 단방향 동기화 + last-write-wins로 단순화.

자세한 설계 배경, DB 스키마, API 명세는 [`architecture.md`](./architecture.md)를, UI 디자인 시스템은 [`design.md`](./design.md)를, 구현 로드맵은 [`workflow.md`](./workflow.md)를 참고하세요.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 데스크톱 | Wails v2 |
| 프론트엔드 | React 19, Zustand 5, Tailwind CSS 4, Tiptap 3 |
| 로컬 백엔드 | Go 1.25, `modernc.org/sqlite` (CGo-free), ULID |
| 서버 | NestJS 11, TypeORM 0.3, PostgreSQL |
| AI | Claude CLI |

---

## 프로젝트 구조

```
thinkdraft/
├── main.go, app.go         # Wails 진입점 + React에 노출되는 바인딩
├── internal/               # Go 백엔드
│   ├── memo/               #   메모 CRUD + 검색 + 고정
│   ├── tag/                #   태그 관리
│   ├── wiki/               #   위키 링크 파싱 + 역링크
│   ├── ai/                 #   Claude 래퍼, 블로그 초안, 태거, 코치
│   ├── sync/               #   동기화 큐 / 클라이언트 / 엔진
│   └── db/                 #   SQLite 연결 + migrations/
├── frontend/               # React (Wails 내장)
│   └── src/
│       ├── components/      #   Editor, MemoList, Sidebar, Coach, BlogDraft …
│       └── stores/          #   Zustand 스토어 (memo, ui, sync, coach, tag, blog)
└── server/                 # NestJS 백업/동기화 서버
    └── src/
        ├── sync/           #   POST /api/sync/push, /pull
        ├── health/         #   헬스 체크
        ├── common/guards/  #   X-API-Key 검증
        └── entities/       #   TypeORM 엔티티
```

---

## 시작하기

### 사전 요구사항

- [Go](https://go.dev) 1.25+
- [Node.js](https://nodejs.org) (npm 포함)
- [Wails v2](https://wails.io/docs/gettingstarted/installation) CLI
- [Claude CLI](https://docs.claude.com/claude-code) — AI 기능 사용 시 (설치 안 되어 있어도 메모 기능은 동작)
- (선택) 동기화 서버용 PostgreSQL

### 데스크톱 앱 실행

```bash
# 개발 모드 (Vite HMR + Go 핫리로드)
wails dev

# 프로덕션 빌드
wails build
```

동기화를 활성화하려면 환경변수로 서버 주소와 API 키를 지정합니다 (미설정 시 `http://localhost:3000` 기본값):

```bash
export THINKDRAFT_SYNC_URL="http://localhost:3000"
export THINKDRAFT_API_KEY="<your-api-key>"
```

### 동기화 서버 실행

```bash
cd server
cp .env.example .env   # DB 접속 정보 / API_KEY 설정
npm install
npm run start:dev      # http://localhost:3000
```

---

## 단축키

| 단축키 | 동작 |
|--------|------|
| `Cmd+Shift+N` | 새 메모 (글로벌) |
| `Cmd+N` | 새 메모 (앱 내) |
| `Cmd+K` | 검색 / 커맨드 팔레트 |
| `Cmd+Enter` | AI 정리 실행 |
| `Cmd+\` | 사이드바 토글 |
| `Cmd+[` / `Cmd+]` | 메모 리스트 이동 |
