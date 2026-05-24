package tag

import (
	"crypto/rand"
	"database/sql"

	"github.com/oklog/ulid/v2"
)

// Repository handles SQLite CRUD operations for tags and memo_tags.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new tag repository backed by the given database connection.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// Insert creates a new tag row.
func (r *Repository) Insert(t *Tag) error {
	_, err := r.db.Exec(
		`INSERT INTO tags (id, name) VALUES (?, ?)`,
		t.ID, t.Name,
	)
	return err
}

// FindByName retrieves a tag by its name.
func (r *Repository) FindByName(name string) (*Tag, error) {
	t := &Tag{}
	err := r.db.QueryRow(
		`SELECT id, name FROM tags WHERE name = ?`, name,
	).Scan(&t.ID, &t.Name)
	if err != nil {
		return nil, err
	}
	return t, nil
}

// FindOrCreate retrieves a tag by name, creating it with a new ULID if it does not exist.
func (r *Repository) FindOrCreate(name string) (*Tag, error) {
	t, err := r.FindByName(name)
	if err == nil {
		return t, nil
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	t = &Tag{
		ID:   ulid.MustNew(ulid.Now(), rand.Reader).String(),
		Name: name,
	}
	if err := r.Insert(t); err != nil {
		return nil, err
	}
	return t, nil
}

// List returns all tags together with the number of memos each is applied to,
// ordered by count descending.
func (r *Repository) List() ([]TagWithCount, error) {
	rows, err := r.db.Query(
		`SELECT t.id, t.name, COUNT(mt.memo_id) AS cnt
		 FROM tags t
		 LEFT JOIN memo_tags mt ON mt.tag_id = t.id
		 GROUP BY t.id
		 ORDER BY cnt DESC, t.name ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []TagWithCount
	for rows.Next() {
		var t TagWithCount
		if err := rows.Scan(&t.ID, &t.Name, &t.Count); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, rows.Err()
}

// Search returns tags whose name starts with the given prefix, for autocomplete.
func (r *Repository) Search(prefix string) ([]Tag, error) {
	rows, err := r.db.Query(
		`SELECT id, name FROM tags WHERE name LIKE ? ORDER BY name ASC LIMIT 20`,
		prefix+"%",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, rows.Err()
}

// AddMemoTag associates a tag with a memo. The source indicates how the tag was
// applied (e.g. "user" or "ai").
func (r *Repository) AddMemoTag(memoID, tagID, source string) error {
	_, err := r.db.Exec(
		`INSERT OR IGNORE INTO memo_tags (memo_id, tag_id, source) VALUES (?, ?, ?)`,
		memoID, tagID, source,
	)
	return err
}

// RemoveMemoTag removes a tag association from a memo.
func (r *Repository) RemoveMemoTag(memoID, tagID string) error {
	_, err := r.db.Exec(
		`DELETE FROM memo_tags WHERE memo_id = ? AND tag_id = ?`,
		memoID, tagID,
	)
	return err
}

// GetMemoTags returns all tags applied to the given memo.
func (r *Repository) GetMemoTags(memoID string) ([]Tag, error) {
	rows, err := r.db.Query(
		`SELECT t.id, t.name
		 FROM tags t
		 JOIN memo_tags mt ON mt.tag_id = t.id
		 WHERE mt.memo_id = ?
		 ORDER BY t.name ASC`, memoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []Tag
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, rows.Err()
}

// GetMemosByTag returns the IDs of all memos that have the given tag.
func (r *Repository) GetMemosByTag(tagID string) ([]string, error) {
	rows, err := r.db.Query(
		`SELECT mt.memo_id
		 FROM memo_tags mt
		 JOIN memos m ON m.id = mt.memo_id
		 WHERE mt.tag_id = ? AND m.deleted_at IS NULL
		 ORDER BY m.updated_at DESC`, tagID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}
