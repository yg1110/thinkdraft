package memo

import (
	"database/sql"
	"strings"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Insert(m *Memo) error {
	_, err := r.db.Exec(
		`INSERT INTO memos (id, title, content, pinned, created_at, updated_at, sync_status)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		m.ID, m.Title, m.Content, boolToInt(m.Pinned), m.CreatedAt, m.UpdatedAt, m.SyncStatus,
	)
	return err
}

func (r *Repository) Update(m *Memo) error {
	_, err := r.db.Exec(
		`UPDATE memos SET title = ?, content = ?, updated_at = ?, sync_status = 'pending'
		 WHERE id = ? AND deleted_at IS NULL`,
		m.Title, m.Content, m.UpdatedAt, m.ID,
	)
	return err
}

func (r *Repository) SetPinned(id string, pinned bool) error {
	_, err := r.db.Exec(
		`UPDATE memos SET pinned = ?, sync_status = 'pending' WHERE id = ? AND deleted_at IS NULL`,
		boolToInt(pinned), id,
	)
	return err
}

func (r *Repository) SoftDelete(id string, deletedAt string) error {
	_, err := r.db.Exec(
		`UPDATE memos SET deleted_at = ?, sync_status = 'pending' WHERE id = ?`,
		deletedAt, id,
	)
	return err
}

func (r *Repository) FindByID(id string) (*Memo, error) {
	m := &Memo{}
	var pinned int
	err := r.db.QueryRow(
		`SELECT id, title, content, pinned, created_at, updated_at, deleted_at, sync_status
		 FROM memos WHERE id = ?`, id,
	).Scan(&m.ID, &m.Title, &m.Content, &pinned, &m.CreatedAt, &m.UpdatedAt, &m.DeletedAt, &m.SyncStatus)
	if err != nil {
		return nil, err
	}
	m.Pinned = pinned != 0
	return m, nil
}

func (r *Repository) List(offset, limit int) ([]MemoSummary, error) {
	rows, err := r.db.Query(
		`SELECT id, title, content, pinned, created_at, updated_at
		 FROM memos WHERE deleted_at IS NULL
		 ORDER BY pinned DESC, updated_at DESC
		 LIMIT ? OFFSET ?`, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanSummaries(rows)
}

func (r *Repository) Search(query string) ([]MemoSummary, error) {
	rows, err := r.db.Query(
		`SELECT m.id, m.title, m.content, m.pinned, m.created_at, m.updated_at
		 FROM memos m
		 JOIN memos_fts f ON m.rowid = f.rowid
		 WHERE memos_fts MATCH ? AND m.deleted_at IS NULL
		 ORDER BY m.pinned DESC, rank
		 LIMIT 50`, query,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanSummaries(rows)
}

func scanSummaries(rows *sql.Rows) ([]MemoSummary, error) {
	var summaries []MemoSummary
	for rows.Next() {
		var s MemoSummary
		var content string
		var pinned int
		if err := rows.Scan(&s.ID, &s.Title, &content, &pinned, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		s.Preview = truncate(content, 100)
		s.Pinned = pinned != 0
		summaries = append(summaries, s)
	}
	return summaries, rows.Err()
}

// ListSince returns all non-deleted memos with created_at >= the given ISO 8601 string.
func (r *Repository) ListSince(since string) ([]Memo, error) {
	rows, err := r.db.Query(
		`SELECT id, title, content, pinned, created_at, updated_at, deleted_at, sync_status
		 FROM memos
		 WHERE deleted_at IS NULL AND created_at >= ?
		 ORDER BY created_at DESC`, since,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var memos []Memo
	for rows.Next() {
		var m Memo
		var pinned int
		if err := rows.Scan(&m.ID, &m.Title, &m.Content, &pinned, &m.CreatedAt, &m.UpdatedAt, &m.DeletedAt, &m.SyncStatus); err != nil {
			return nil, err
		}
		m.Pinned = pinned != 0
		memos = append(memos, m)
	}
	return memos, rows.Err()
}

// GetLastMemoDate returns the created_at of the most recent non-deleted memo.
func (r *Repository) GetLastMemoDate() (string, error) {
	var createdAt string
	err := r.db.QueryRow(
		`SELECT created_at FROM memos
		 WHERE deleted_at IS NULL
		 ORDER BY created_at DESC
		 LIMIT 1`,
	).Scan(&createdAt)
	if err != nil {
		return "", err
	}
	return createdAt, nil
}

func truncate(s string, maxLen int) string {
	s = strings.ReplaceAll(s, "\n", " ")
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
