package ai

import "database/sql"

// BlogDraftRepository handles SQLite CRUD operations for the blog_drafts table.
type BlogDraftRepository struct {
	db *sql.DB
}

// NewBlogDraftRepository creates a new repository backed by the given database connection.
func NewBlogDraftRepository(db *sql.DB) *BlogDraftRepository {
	return &BlogDraftRepository{db: db}
}

// Insert creates a new blog draft row.
func (r *BlogDraftRepository) Insert(d *BlogDraft) error {
	_, err := r.db.Exec(
		`INSERT INTO blog_drafts (id, memo_ids, template, title, content, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		d.ID, d.MemoIDs, d.Template, d.Title, d.Content, d.Status, d.CreatedAt, d.UpdatedAt,
	)
	return err
}

// Update persists changes to an existing blog draft.
func (r *BlogDraftRepository) Update(d *BlogDraft) error {
	_, err := r.db.Exec(
		`UPDATE blog_drafts SET title = ?, content = ?, status = ?, published_at = ?, published_url = ?, updated_at = ?
		 WHERE id = ?`,
		d.Title, d.Content, d.Status, d.PublishedAt, d.PublishedURL, d.UpdatedAt, d.ID,
	)
	return err
}

// Delete removes a blog draft by ID.
func (r *BlogDraftRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM blog_drafts WHERE id = ?`, id)
	return err
}

// FindByID retrieves a single blog draft by its ID.
func (r *BlogDraftRepository) FindByID(id string) (*BlogDraft, error) {
	d := &BlogDraft{}
	err := r.db.QueryRow(
		`SELECT id, memo_ids, template, title, content, status, published_at, published_url, created_at, updated_at
		 FROM blog_drafts WHERE id = ?`, id,
	).Scan(&d.ID, &d.MemoIDs, &d.Template, &d.Title, &d.Content, &d.Status, &d.PublishedAt, &d.PublishedURL, &d.CreatedAt, &d.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return d, nil
}

// List returns all blog draft summaries ordered by most recently updated.
func (r *BlogDraftRepository) List() ([]BlogDraftSummary, error) {
	rows, err := r.db.Query(
		`SELECT id, template, title, status, created_at, updated_at
		 FROM blog_drafts
		 ORDER BY updated_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []BlogDraftSummary
	for rows.Next() {
		var s BlogDraftSummary
		if err := rows.Scan(&s.ID, &s.Template, &s.Title, &s.Status, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		summaries = append(summaries, s)
	}
	return summaries, rows.Err()
}
