package memo

import (
	"crypto/rand"
	"time"

	"github.com/oklog/ulid/v2"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(content string) (*Memo, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	m := &Memo{
		ID:         ulid.MustNew(ulid.Now(), rand.Reader).String(),
		Content:    content,
		CreatedAt:  now,
		UpdatedAt:  now,
		SyncStatus: "pending",
	}

	if err := s.repo.Insert(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *Service) Update(id string, title *string, content *string) (*Memo, error) {
	m, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if title != nil {
		m.Title = title
	}
	if content != nil {
		m.Content = *content
	}
	m.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := s.repo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *Service) Delete(id string) error {
	now := time.Now().UTC().Format(time.RFC3339)
	return s.repo.SoftDelete(id, now)
}

func (s *Service) Get(id string) (*Memo, error) {
	return s.repo.FindByID(id)
}

func (s *Service) List(offset, limit int) ([]MemoSummary, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.List(offset, limit)
}

func (s *Service) Search(query string) ([]MemoSummary, error) {
	if query == "" {
		return s.List(0, 50)
	}
	return s.repo.Search(query)
}
