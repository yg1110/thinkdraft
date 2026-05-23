-- Migration 002: FTS5 sync triggers for memos_fts
-- The memos_fts table uses content-sync mode (content='memos'), so we need
-- triggers to keep the FTS index in sync with the memos source table.

-- After INSERT: add the new row to the FTS index
CREATE TRIGGER IF NOT EXISTS memos_fts_insert AFTER INSERT ON memos BEGIN
    INSERT INTO memos_fts(rowid, title, content)
    VALUES (new.rowid, new.title, new.content);
END;

-- After UPDATE: remove the old entry and insert the updated one
CREATE TRIGGER IF NOT EXISTS memos_fts_update AFTER UPDATE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, title, content)
    VALUES ('delete', old.rowid, old.title, old.content);
    INSERT INTO memos_fts(rowid, title, content)
    VALUES (new.rowid, new.title, new.content);
END;

-- After DELETE: remove the deleted row from the FTS index
CREATE TRIGGER IF NOT EXISTS memos_fts_delete AFTER DELETE ON memos BEGIN
    INSERT INTO memos_fts(memos_fts, rowid, title, content)
    VALUES ('delete', old.rowid, old.title, old.content);
END;

-- Populate the FTS index from any existing data in the memos table
INSERT INTO memos_fts(rowid, title, content)
SELECT rowid, title, content FROM memos;
