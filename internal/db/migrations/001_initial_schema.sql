CREATE TABLE IF NOT EXISTS memos (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    content     TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT,
    sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS tags (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS memo_tags (
    memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    source  TEXT NOT NULL DEFAULT 'user',
    PRIMARY KEY (memo_id, tag_id)
);

CREATE TABLE IF NOT EXISTS wiki_links (
    source_memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
    target_memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
    PRIMARY KEY (source_memo_id, target_memo_id)
);

CREATE TABLE IF NOT EXISTS blog_drafts (
    id           TEXT PRIMARY KEY,
    memo_ids     TEXT NOT NULL,
    template     TEXT NOT NULL,
    title        TEXT NOT NULL,
    content      TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'draft',
    published_at TEXT,
    published_url TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    entity     TEXT NOT NULL,
    entity_id  TEXT NOT NULL,
    action     TEXT NOT NULL,
    payload    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    retries    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_coach_logs (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    dismissed  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_memos_updated ON memos(updated_at);
CREATE INDEX IF NOT EXISTS idx_memos_sync ON memos(sync_status);
CREATE INDEX IF NOT EXISTS idx_memos_deleted ON memos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_memo_tags_memo ON memo_tags(memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_tags_tag ON memo_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_target ON wiki_links(target_memo_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity, entity_id);

CREATE VIRTUAL TABLE IF NOT EXISTS memos_fts USING fts5(title, content, content='memos', content_rowid='rowid');
