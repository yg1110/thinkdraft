package memo

type Memo struct {
	ID         string  `json:"id"`
	Title      *string `json:"title"`
	Content    string  `json:"content"`
	Pinned     bool    `json:"pinned"`
	CreatedAt  string  `json:"createdAt"`
	UpdatedAt  string  `json:"updatedAt"`
	DeletedAt  *string `json:"deletedAt,omitempty"`
	SyncStatus string  `json:"syncStatus"`
}

type MemoSummary struct {
	ID        string  `json:"id"`
	Title     *string `json:"title"`
	Preview   string  `json:"preview"`
	Pinned    bool    `json:"pinned"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}
