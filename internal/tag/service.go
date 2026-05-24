package tag

import "strings"

// Service wraps the tag repository with business logic.
type Service struct {
	repo *Repository
}

// NewService creates a new tag service.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// AddTagToMemo finds or creates a tag by name and associates it with a memo.
// The source parameter indicates how the tag was applied (e.g. "user" or "ai").
func (s *Service) AddTagToMemo(memoID string, tagName string, source string) (*Tag, error) {
	tagName = strings.TrimSpace(strings.ToLower(tagName))
	if tagName == "" {
		return nil, nil
	}

	t, err := s.repo.FindOrCreate(tagName)
	if err != nil {
		return nil, err
	}

	if err := s.repo.AddMemoTag(memoID, t.ID, source); err != nil {
		return nil, err
	}

	return t, nil
}

// RemoveTagFromMemo removes a tag association from a memo.
func (s *Service) RemoveTagFromMemo(memoID string, tagID string) error {
	return s.repo.RemoveMemoTag(memoID, tagID)
}

// GetMemoTags returns all tags applied to the given memo.
func (s *Service) GetMemoTags(memoID string) ([]Tag, error) {
	return s.repo.GetMemoTags(memoID)
}

// ListTags returns all tags with their memo counts.
func (s *Service) ListTags() ([]TagWithCount, error) {
	return s.repo.List()
}

// SearchTags returns tags matching the given prefix for autocomplete.
func (s *Service) SearchTags(prefix string) ([]Tag, error) {
	prefix = strings.TrimSpace(strings.ToLower(prefix))
	return s.repo.Search(prefix)
}

// GetMemosByTag returns the IDs of all memos that have the given tag.
func (s *Service) GetMemosByTag(tagID string) ([]string, error) {
	return s.repo.GetMemosByTag(tagID)
}
