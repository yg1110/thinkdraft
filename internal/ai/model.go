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

// CoachLog represents a single AI coach log entry stored in the database.
type CoachLog struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
	Dismissed bool   `json:"dismissed"`
}

// WeeklyReport contains the analysis of a user's weekly memo activity.
type WeeklyReport struct {
	ID              string    `json:"id"`
	MemoCount       int       `json:"memoCount"`
	WordCount       int       `json:"wordCount"`
	TagDistribution []TagStat `json:"tagDistribution"`
	Insights        string    `json:"insights"`
	CreatedAt       string    `json:"createdAt"`
}

// TagStat represents the count of memos associated with a single tag.
type TagStat struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// TopicSuggestion represents a single blog topic suggestion from the AI coach.
type TopicSuggestion struct {
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	RelatedMemoIDs []string `json:"relatedMemoIds"`
}

// NudgeMessage represents a reminder to the user to write a memo.
type NudgeMessage struct {
	ID        string `json:"id"`
	Message   string `json:"message"`
	DaysSince int    `json:"daysSince"`
	CreatedAt string `json:"createdAt"`
}
