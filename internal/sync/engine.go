package sync

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	gosync "sync"
	"thinkdraft/internal/memo"
	"time"
)

// SyncStatus describes the current state of the sync engine.
type SyncStatus string

const (
	SyncStatusIdle    SyncStatus = "idle"
	SyncStatusSyncing SyncStatus = "syncing"
	SyncStatusError   SyncStatus = "error"
	SyncStatusOffline SyncStatus = "offline"
)

const (
	syncInterval  = 5 * time.Minute
	maxRetries    = 3
	pushBatchSize = 50
)

// Engine orchestrates background synchronisation between the local SQLite
// database and the remote NestJS server. It runs a periodic pull-then-push
// cycle in its own goroutine.
type Engine struct {
	queue    *Queue
	client   *Client
	memoRepo *memo.Repository
	db       *sql.DB

	mu         gosync.Mutex
	status     SyncStatus
	lastSynced string // ISO 8601 timestamp of last successful sync

	stopCh chan struct{}
}

// NewEngine creates a new sync Engine.
func NewEngine(queue *Queue, client *Client, memoRepo *memo.Repository, db *sql.DB) *Engine {
	return &Engine{
		queue:    queue,
		client:   client,
		memoRepo: memoRepo,
		db:       db,
		status:   SyncStatusIdle,
		stopCh:   make(chan struct{}),
	}
}

// Start launches the background sync loop. It performs an initial sync cycle
// immediately and then repeats every 5 minutes.
func (e *Engine) Start() {
	// Load persisted lastSynced value from the settings table.
	e.loadLastSynced()

	go func() {
		// Initial sync on startup.
		e.runCycle()

		ticker := time.NewTicker(syncInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				e.runCycle()
			case <-e.stopCh:
				return
			}
		}
	}()
}

// Stop signals the background goroutine to exit.
func (e *Engine) Stop() {
	select {
	case <-e.stopCh:
		// Already closed.
	default:
		close(e.stopCh)
	}
}

// SyncNow triggers an immediate sync cycle (pull then push). It blocks until
// the cycle completes or fails.
func (e *Engine) SyncNow() error {
	return e.runCycle()
}

// GetStatus returns the current sync status.
func (e *Engine) GetStatus() SyncStatus {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.status
}

// GetLastSynced returns the ISO 8601 timestamp of the last successful sync.
func (e *Engine) GetLastSynced() string {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.lastSynced
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

func (e *Engine) setStatus(s SyncStatus) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.status = s
}

func (e *Engine) runCycle() error {
	e.setStatus(SyncStatusSyncing)

	if err := e.pull(); err != nil {
		log.Printf("[sync] pull failed: %v", err)
		e.setStatus(SyncStatusOffline)
		return err
	}

	if err := e.push(); err != nil {
		log.Printf("[sync] push failed: %v", err)
		e.setStatus(SyncStatusError)
		return err
	}

	// Mark the cycle as successful.
	now := time.Now().UTC().Format(time.RFC3339)
	e.mu.Lock()
	e.lastSynced = now
	e.status = SyncStatusIdle
	e.mu.Unlock()

	e.saveLastSynced(now)

	return nil
}

// pull fetches remote changes and applies them to the local database using
// a last-write-wins strategy (comparing updated_at).
func (e *Engine) pull() error {
	e.mu.Lock()
	lastSynced := e.lastSynced
	e.mu.Unlock()

	items, err := e.client.Pull(lastSynced)
	if err != nil {
		return fmt.Errorf("client pull: %w", err)
	}

	for _, item := range items {
		if err := e.applyPullItem(item); err != nil {
			log.Printf("[sync] failed to apply pull item %s/%s: %v", item.Entity, item.EntityID, err)
			// Continue processing other items; do not abort the entire pull.
		}
	}

	return nil
}

// applyPullItem merges a single remote change into the local SQLite database.
func (e *Engine) applyPullItem(item PullItem) error {
	switch item.Entity {
	case "memo":
		return e.applyMemoPullItem(item)
	default:
		log.Printf("[sync] unknown entity type in pull: %s", item.Entity)
		return nil
	}
}

// applyMemoPullItem handles memo-specific pull logic with last-write-wins.
func (e *Engine) applyMemoPullItem(item PullItem) error {
	var remoteMemo memo.Memo
	if err := json.Unmarshal([]byte(item.Payload), &remoteMemo); err != nil {
		return fmt.Errorf("unmarshalling memo payload: %w", err)
	}

	switch item.Action {
	case "create", "update":
		local, err := e.memoRepo.FindByID(remoteMemo.ID)
		if err == sql.ErrNoRows || local == nil {
			// Memo does not exist locally — insert it.
			remoteMemo.SyncStatus = "synced"
			return e.memoRepo.Insert(&remoteMemo)
		}
		if err != nil {
			return fmt.Errorf("finding local memo: %w", err)
		}

		// Last-write-wins: only overwrite if remote is newer.
		remoteTime, errR := time.Parse(time.RFC3339, remoteMemo.UpdatedAt)
		localTime, errL := time.Parse(time.RFC3339, local.UpdatedAt)
		if errR != nil || errL != nil {
			// If we cannot parse timestamps, prefer the remote version.
			remoteMemo.SyncStatus = "synced"
			return e.memoRepo.Update(&remoteMemo)
		}

		if remoteTime.After(localTime) {
			remoteMemo.SyncStatus = "synced"
			return e.memoRepo.Update(&remoteMemo)
		}

		// Local version is newer — keep it, nothing to do.
		return nil

	case "delete":
		now := time.Now().UTC().Format(time.RFC3339)
		return e.memoRepo.SoftDelete(remoteMemo.ID, now)

	default:
		log.Printf("[sync] unknown action in pull item: %s", item.Action)
		return nil
	}
}

// push sends queued local changes to the remote server.
func (e *Engine) push() error {
	items, err := e.queue.Peek(pushBatchSize)
	if err != nil {
		return fmt.Errorf("peeking queue: %w", err)
	}

	if len(items) == 0 {
		return nil
	}

	// Filter out items that have exceeded the retry limit.
	var pushable []QueueItem
	for _, item := range items {
		if item.Retries > maxRetries {
			log.Printf("[sync] dropping queue item %d after %d retries", item.ID, item.Retries)
			_ = e.queue.Remove(item.ID)
			continue
		}
		pushable = append(pushable, item)
	}

	if len(pushable) == 0 {
		return nil
	}

	pushItems := make([]PushItem, len(pushable))
	for i, qi := range pushable {
		pushItems[i] = PushItem{
			Entity:   qi.Entity,
			EntityID: qi.EntityID,
			Action:   qi.Action,
			Payload:  qi.Payload,
		}
	}

	if err := e.client.Push(pushItems); err != nil {
		// Increment retries for all items in the failed batch.
		for _, qi := range pushable {
			_ = e.queue.IncrementRetries(qi.ID)
		}
		return fmt.Errorf("client push: %w", err)
	}

	// Push succeeded — remove all items from the queue.
	for _, qi := range pushable {
		if err := e.queue.Remove(qi.ID); err != nil {
			log.Printf("[sync] failed to remove queue item %d: %v", qi.ID, err)
		}
	}

	return nil
}

// loadLastSynced reads the persisted last_synced_at value from the settings table.
func (e *Engine) loadLastSynced() {
	var value string
	err := e.db.QueryRow(`SELECT value FROM settings WHERE key = 'last_synced_at'`).Scan(&value)
	if err != nil {
		// Table might not exist yet or no row — start from epoch.
		return
	}

	e.mu.Lock()
	e.lastSynced = value
	e.mu.Unlock()
}

// saveLastSynced persists the last_synced_at value into the settings table.
func (e *Engine) saveLastSynced(ts string) {
	_, err := e.db.Exec(
		`INSERT INTO settings (key, value) VALUES ('last_synced_at', ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		ts,
	)
	if err != nil {
		log.Printf("[sync] failed to save last_synced_at: %v", err)
	}
}
