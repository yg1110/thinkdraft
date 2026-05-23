package ai

import (
	"crypto/rand"
	"fmt"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	"thinkdraft/internal/memo"
)

// Organizer handles blog draft generation and management.
type Organizer struct {
	claude   *ClaudeClient
	repo     *BlogDraftRepository
	memoRepo *memo.Repository
}

// NewOrganizer creates an Organizer with the required dependencies.
func NewOrganizer(claude *ClaudeClient, repo *BlogDraftRepository, memoRepo *memo.Repository) *Organizer {
	return &Organizer{
		claude:   claude,
		repo:     repo,
		memoRepo: memoRepo,
	}
}

// GenerateBlogDraft fetches the specified memos, builds a prompt using the
// given template, calls the Claude CLI, and saves the resulting draft.
func (o *Organizer) GenerateBlogDraft(memoIDs []string, template string) (*BlogDraft, error) {
	if len(memoIDs) == 0 {
		return nil, fmt.Errorf("at least one memo ID is required")
	}

	// Fetch each memo and concatenate their contents.
	var parts []string
	for _, id := range memoIDs {
		m, err := o.memoRepo.FindByID(id)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch memo %s: %w", id, err)
		}
		parts = append(parts, m.Content)
	}
	memoContents := strings.Join(parts, "\n\n---\n\n")

	// Build the prompt and call Claude.
	prompt := BuildPrompt(template, memoContents)
	response, err := o.claude.Execute(prompt)
	if err != nil {
		return nil, fmt.Errorf("claude generation failed: %w", err)
	}

	// Parse the response: first line as title, rest as content.
	title, content := parseResponse(response)

	now := time.Now().UTC().Format(time.RFC3339)
	draft := &BlogDraft{
		ID:        ulid.MustNew(ulid.Now(), rand.Reader).String(),
		MemoIDs:   strings.Join(memoIDs, ","),
		Template:  template,
		Title:     title,
		Content:   content,
		Status:    "draft",
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := o.repo.Insert(draft); err != nil {
		return nil, fmt.Errorf("failed to save blog draft: %w", err)
	}

	return draft, nil
}

// GetDraft retrieves a blog draft by ID.
func (o *Organizer) GetDraft(id string) (*BlogDraft, error) {
	return o.repo.FindByID(id)
}

// ListDrafts returns all blog draft summaries.
func (o *Organizer) ListDrafts() ([]BlogDraftSummary, error) {
	return o.repo.List()
}

// UpdateDraft updates the title and/or content of an existing draft.
func (o *Organizer) UpdateDraft(id string, title *string, content *string) (*BlogDraft, error) {
	draft, err := o.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if title != nil {
		draft.Title = *title
	}
	if content != nil {
		draft.Content = *content
	}
	draft.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := o.repo.Update(draft); err != nil {
		return nil, err
	}
	return draft, nil
}

// DeleteDraft removes a blog draft by ID.
func (o *Organizer) DeleteDraft(id string) error {
	return o.repo.Delete(id)
}

// parseResponse extracts the title from the first line of the Claude response.
// If the first line is a markdown heading (# Title), the heading prefix is stripped.
func parseResponse(response string) (title, content string) {
	lines := strings.SplitN(response, "\n", 2)
	if len(lines) == 0 {
		return "Untitled", response
	}

	title = strings.TrimSpace(lines[0])
	// Strip markdown heading prefix.
	title = strings.TrimLeft(title, "# ")
	if title == "" {
		title = "Untitled"
	}

	if len(lines) > 1 {
		content = strings.TrimSpace(lines[1])
	} else {
		content = ""
	}

	return title, content
}
