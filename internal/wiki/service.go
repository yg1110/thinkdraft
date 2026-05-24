package wiki

import (
	"database/sql"
	"regexp"
	"strings"
)

var wikiLinkRe = regexp.MustCompile(`\[\[([^\]]+)\]\]`)

// WikiService handles wiki-link parsing, persistence, and backlink queries.
type WikiService struct {
	db *sql.DB
}

// NewWikiService creates a new WikiService backed by the given database connection.
func NewWikiService(db *sql.DB) *WikiService {
	return &WikiService{db: db}
}

// ParseWikiLinks extracts all [[title]] references from the given content.
// It returns a deduplicated slice of titles in the order they first appear.
func ParseWikiLinks(content string) []string {
	matches := wikiLinkRe.FindAllStringSubmatch(content, -1)
	seen := make(map[string]bool)
	var titles []string
	for _, m := range matches {
		title := strings.TrimSpace(m[1])
		if title == "" || seen[title] {
			continue
		}
		seen[title] = true
		titles = append(titles, title)
	}
	return titles
}

// UpdateLinks parses wiki links from content, resolves each title to a memo ID,
// and replaces all rows in wiki_links for the given source memo.
func (s *WikiService) UpdateLinks(memoID string, content string) error {
	titles := ParseWikiLinks(content)

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Remove all existing outgoing links for this memo.
	if _, err := tx.Exec(`DELETE FROM wiki_links WHERE source_memo_id = ?`, memoID); err != nil {
		return err
	}

	if len(titles) == 0 {
		return tx.Commit()
	}

	// Resolve each title and insert a link row when the target memo exists.
	stmt, err := tx.Prepare(`INSERT OR IGNORE INTO wiki_links (source_memo_id, target_memo_id)
		SELECT ?, id FROM memos WHERE title = ? AND deleted_at IS NULL LIMIT 1`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, title := range titles {
		if _, err := stmt.Exec(memoID, title); err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetBacklinks returns all memos that link TO the given memo.
func (s *WikiService) GetBacklinks(memoID string) ([]BacklinkInfo, error) {
	rows, err := s.db.Query(
		`SELECT m.id, m.title, m.content
		 FROM wiki_links wl
		 JOIN memos m ON m.id = wl.source_memo_id
		 WHERE wl.target_memo_id = ? AND m.deleted_at IS NULL
		 ORDER BY m.updated_at DESC`, memoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var backlinks []BacklinkInfo
	for rows.Next() {
		var b BacklinkInfo
		var content string
		if err := rows.Scan(&b.MemoID, &b.Title, &content); err != nil {
			return nil, err
		}
		b.Preview = truncate(content, 100)
		backlinks = append(backlinks, b)
	}
	return backlinks, rows.Err()
}

// CheckLinkExists checks whether a memo with the given title exists.
// It returns the memo ID and true if found, or empty string and false otherwise.
func (s *WikiService) CheckLinkExists(title string) (string, bool, error) {
	var id string
	err := s.db.QueryRow(
		`SELECT id FROM memos WHERE title = ? AND deleted_at IS NULL LIMIT 1`, title,
	).Scan(&id)
	if err == sql.ErrNoRows {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return id, true, nil
}

// ResolveLinksByTitle resolves each title to a memo ID, indicating whether the memo exists.
func (s *WikiService) ResolveLinksByTitle(titles []string) ([]ResolvedLink, error) {
	results := make([]ResolvedLink, 0, len(titles))
	for _, title := range titles {
		rl := ResolvedLink{Title: title}
		id, exists, err := s.CheckLinkExists(title)
		if err != nil {
			return nil, err
		}
		rl.MemoID = id
		rl.Exists = exists
		results = append(results, rl)
	}
	return results, nil
}

// truncate shortens a string to maxLen characters, replacing newlines with spaces.
func truncate(s string, maxLen int) string {
	s = strings.ReplaceAll(s, "\n", " ")
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
