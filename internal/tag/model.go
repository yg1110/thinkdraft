package tag

// Tag represents a single tag.
type Tag struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// TagWithCount represents a tag together with the number of memos it is applied to.
type TagWithCount struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Count int    `json:"count"`
}
