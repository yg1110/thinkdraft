package ai

// BlogDraft represents a full blog draft generated from memos.
type BlogDraft struct {
	ID           string  `json:"id"`
	MemoIDs      string  `json:"memoIds"`
	Template     string  `json:"template"`
	Title        string  `json:"title"`
	Content      string  `json:"content"`
	Status       string  `json:"status"`
	PublishedAt  *string `json:"publishedAt,omitempty"`
	PublishedURL *string `json:"publishedUrl,omitempty"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

// BlogDraftSummary is a lightweight representation for list views.
type BlogDraftSummary struct {
	ID        string `json:"id"`
	Template  string `json:"template"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}
