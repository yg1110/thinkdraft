package main

import (
	"context"
	"database/sql"
	"thinkdraft/internal/ai"
	"thinkdraft/internal/db"
	"thinkdraft/internal/memo"
)

type App struct {
	ctx       context.Context
	conn      *sql.DB
	memoSvc   *memo.Service
	organizer *ai.Organizer
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
}

func (a *App) shutdown(ctx context.Context) {
	if a.conn != nil {
		a.conn.Close()
	}
}

// --- Memo Bindings (exposed to React) ---

func (a *App) CreateMemo(content string) (*memo.Memo, error) {
	return a.memoSvc.Create(content)
}

func (a *App) UpdateMemo(id string, title *string, content *string) (*memo.Memo, error) {
	return a.memoSvc.Update(id, title, content)
}

func (a *App) DeleteMemo(id string) error {
	return a.memoSvc.Delete(id)
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
