package wiki

// BacklinkInfo represents a memo that links to a given memo.
type BacklinkInfo struct {
	MemoID  string  `json:"memoId"`
	Title   *string `json:"title"`
	Preview string  `json:"preview"`
}

// ResolvedLink represents a wiki link title resolved to an existing (or missing) memo.
type ResolvedLink struct {
	Title  string `json:"title"`
	MemoID string `json:"memoId,omitempty"`
	Exists bool   `json:"exists"`
}
