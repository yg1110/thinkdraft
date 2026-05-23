package memo

type Memo struct {
	ID         string  `json:"id"`
	Title      *string `json:"title"`
	Content    string  `json:"content"`
	CreatedAt  string  `json:"createdAt"`
	UpdatedAt  string  `json:"updatedAt"`
	DeletedAt  *string `json:"deletedAt,omitempty"`
	SyncStatus string  `json:"syncStatus"`
}

type MemoSummary struct {
	ID        string  `json:"id"`
	Title     *string `json:"title"`
	Preview   string  `json:"preview"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}
