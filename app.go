package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"thinkdraft/internal/ai"
	"thinkdraft/internal/db"
	"thinkdraft/internal/memo"
	"thinkdraft/internal/sync"
	"thinkdraft/internal/tag"
	"thinkdraft/internal/wiki"
)

type App struct {
	ctx       context.Context
	conn      *sql.DB
	memoSvc   *memo.Service
	organizer *ai.Organizer
	wikiSvc   *wiki.WikiService
	tagSvc    *tag.Service
	tagger    *ai.Tagger
	coach      *ai.Coach
	syncEngine *sync.Engine
	syncQueue  *sync.Queue
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	conn, err := db.Open()
	if err != nil {
		panic("failed to open database: " + err.Error())
	}
	a.conn = conn

	memoRepo := memo.NewRepository(conn)
	a.memoSvc = memo.NewService(memoRepo)

	claudeClient := ai.NewClaudeClient()
	draftRepo := ai.NewBlogDraftRepository(conn)
	a.organizer = ai.NewOrganizer(claudeClient, draftRepo, memoRepo)

	a.wikiSvc = wiki.NewWikiService(conn)
	tagRepo := tag.NewRepository(conn)
	a.tagSvc = tag.NewService(tagRepo)
	a.tagger = ai.NewTagger(claudeClient)

	coachLogRepo := ai.NewCoachLogRepository(conn)
	a.coach = ai.NewCoach(claudeClient, memoRepo, tagRepo, coachLogRepo)

	// --- Sync Engine ---
	syncQueue := sync.NewQueue(conn)
	a.syncQueue = syncQueue

	syncBaseURL := os.Getenv("THINKDRAFT_SYNC_URL")
	if syncBaseURL == "" {
		syncBaseURL = "http://localhost:3000"
	}
	syncAPIKey := os.Getenv("THINKDRAFT_API_KEY")
	if syncAPIKey == "" {
		syncAPIKey = "your-api-key-here"
	}

	syncClient := sync.NewClient(syncBaseURL, syncAPIKey)
	a.syncEngine = sync.NewEngine(syncQueue, syncClient, memoRepo, conn)
	a.syncEngine.Start()
}

func (a *App) shutdown(ctx context.Context) {
	if a.syncEngine != nil {
		a.syncEngine.Stop()
	}
	if a.conn != nil {
		a.conn.Close()
	}
}

// --- Memo Bindings (exposed to React) ---

func (a *App) CreateMemo(content string) (*memo.Memo, error) {
	m, err := a.memoSvc.Create(content)
	if err == nil && a.syncQueue != nil {
		payload, _ := json.Marshal(m)
		_ = a.syncQueue.Enqueue("memo", m.ID, "create", string(payload))
	}
	return m, err
}

func (a *App) UpdateMemo(id string, title *string, content *string) (*memo.Memo, error) {
	m, err := a.memoSvc.Update(id, title, content)
	if err == nil && a.syncQueue != nil {
		payload, _ := json.Marshal(m)
		_ = a.syncQueue.Enqueue("memo", m.ID, "update", string(payload))
	}
	return m, err
}

func (a *App) DeleteMemo(id string) error {
	err := a.memoSvc.Delete(id)
	if err == nil && a.syncQueue != nil {
		payload, _ := json.Marshal(map[string]string{"id": id})
		_ = a.syncQueue.Enqueue("memo", id, "delete", string(payload))
	}
	return err
}

func (a *App) GetMemo(id string) (*memo.Memo, error) {
	return a.memoSvc.Get(id)
}

func (a *App) ListMemos(offset int, limit int) ([]memo.MemoSummary, error) {
	return a.memoSvc.List(offset, limit)
}

func (a *App) SearchMemos(query string) ([]memo.MemoSummary, error) {
	return a.memoSvc.Search(query)
}

func (a *App) TogglePinMemo(id string) (*memo.Memo, error) {
	m, err := a.memoSvc.TogglePin(id)
	if err == nil && a.syncQueue != nil {
		payload, _ := json.Marshal(m)
		_ = a.syncQueue.Enqueue("memo", m.ID, "update", string(payload))
	}
	return m, err
}

// --- AI / Blog Draft Bindings (exposed to React) ---

func (a *App) CheckClaudeInstalled() bool {
	return ai.CheckInstalled()
}

func (a *App) GenerateBlogDraft(memoIDs []string, template string) (*ai.BlogDraft, error) {
	return a.organizer.GenerateBlogDraft(memoIDs, template)
}

func (a *App) GetBlogDraft(id string) (*ai.BlogDraft, error) {
	return a.organizer.GetDraft(id)
}

func (a *App) ListBlogDrafts() ([]ai.BlogDraftSummary, error) {
	return a.organizer.ListDrafts()
}

func (a *App) UpdateBlogDraft(id string, title *string, content *string) (*ai.BlogDraft, error) {
	return a.organizer.UpdateDraft(id, title, content)
}

func (a *App) DeleteBlogDraft(id string) error {
	return a.organizer.DeleteDraft(id)
}

// --- Wiki Link Bindings (exposed to React) ---

func (a *App) GetBacklinks(memoID string) ([]wiki.BacklinkInfo, error) {
	return a.wikiSvc.GetBacklinks(memoID)
}

func (a *App) ResolveWikiLinks(titles []string) ([]wiki.ResolvedLink, error) {
	return a.wikiSvc.ResolveLinksByTitle(titles)
}

// --- Tag Bindings (exposed to React) ---

func (a *App) AddTagToMemo(memoID string, tagName string) (*tag.Tag, error) {
	return a.tagSvc.AddTagToMemo(memoID, tagName, "user")
}

func (a *App) RemoveTagFromMemo(memoID string, tagID string) error {
	return a.tagSvc.RemoveTagFromMemo(memoID, tagID)
}

func (a *App) GetMemoTags(memoID string) ([]tag.Tag, error) {
	return a.tagSvc.GetMemoTags(memoID)
}

func (a *App) ListTags() ([]tag.TagWithCount, error) {
	return a.tagSvc.ListTags()
}

func (a *App) SearchTags(prefix string) ([]tag.Tag, error) {
	return a.tagSvc.SearchTags(prefix)
}

func (a *App) GetMemosByTag(tagID string) ([]string, error) {
	return a.tagSvc.GetMemosByTag(tagID)
}

// --- AI Tag Suggestion Binding (exposed to React) ---

func (a *App) SuggestTags(memoID string) ([]string, error) {
	m, err := a.memoSvc.Get(memoID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch memo: %w", err)
	}

	// Get existing tag names so Claude can reuse them.
	allTags, err := a.tagSvc.ListTags()
	if err != nil {
		return nil, fmt.Errorf("failed to list tags: %w", err)
	}

	var existingNames []string
	for _, t := range allTags {
		existingNames = append(existingNames, t.Name)
	}

	return a.tagger.SuggestTags(m.Content, existingNames)
}

// --- AI Coach Bindings (exposed to React) ---

func (a *App) GetWeeklyReport() (*ai.WeeklyReport, error) {
	return a.coach.GetWeeklyReport()
}

func (a *App) GetTopicSuggestions() ([]ai.TopicSuggestion, error) {
	return a.coach.GetTopicSuggestions()
}

func (a *App) CheckNudge() (*ai.NudgeMessage, error) {
	return a.coach.CheckNudge()
}

func (a *App) DismissCoachLog(id string) error {
	return a.coach.DismissLog(id)
}

func (a *App) GetCoachLogs(logType string, limit int) ([]ai.CoachLog, error) {
	return a.coach.GetCoachLogs(logType, limit)
}

// --- Sync Bindings (exposed to React) ---

func (a *App) SyncNow() error {
	if a.syncEngine == nil {
		return fmt.Errorf("sync engine not initialized")
	}
	return a.syncEngine.SyncNow()
}

func (a *App) GetSyncStatus() string {
	if a.syncEngine == nil {
		return string(sync.SyncStatusOffline)
	}
	return string(a.syncEngine.GetStatus())
}

func (a *App) GetLastSynced() string {
	if a.syncEngine == nil {
		return ""
	}
	return a.syncEngine.GetLastSynced()
}
