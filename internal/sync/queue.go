package sync

import (
	"database/sql"
	"time"
)

// QueueItem represents a single pending sync operation stored in the sync_queue table.
type QueueItem struct {
	ID        int64  `json:"id"`
	Entity    string `json:"entity"`
	EntityID  string `json:"entityId"`
	Action    string `json:"action"` // "create", "update", "delete"
	Payload   string `json:"payload"`
	CreatedAt string `json:"createdAt"`
	Retries   int    `json:"retries"`
}

// Queue manages the local sync_queue table, buffering mutations that need to
// be pushed to the remote NestJS server.
type Queue struct {
	db *sql.DB
}

// NewQueue creates a new Queue backed by the given SQLite connection.
func NewQueue(db *sql.DB) *Queue {
	return &Queue{db: db}
}

// Enqueue inserts a new item into the sync queue.
func (q *Queue) Enqueue(entity, entityID, action, payload string) error {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := q.db.Exec(
		`INSERT INTO sync_queue (entity, entity_id, action, payload, created_at, retries)
		 VALUES (?, ?, ?, ?, ?, 0)`,
		entity, entityID, action, payload, now,
	)
	return err
}

// Peek returns the oldest N items from the queue without removing them.
func (q *Queue) Peek(limit int) ([]QueueItem, error) {
	rows, err := q.db.Query(
		`SELECT id, entity, entity_id, action, payload, created_at, retries
		 FROM sync_queue
		 ORDER BY id ASC
		 LIMIT ?`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []QueueItem
	for rows.Next() {
		var item QueueItem
		if err := rows.Scan(&item.ID, &item.Entity, &item.EntityID, &item.Action, &item.Payload, &item.CreatedAt, &item.Retries); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// Remove deletes a queue item by ID after it has been successfully pushed.
func (q *Queue) Remove(id int64) error {
	_, err := q.db.Exec(`DELETE FROM sync_queue WHERE id = ?`, id)
	return err
}

// IncrementRetries bumps the retry counter for a failed queue item.
func (q *Queue) IncrementRetries(id int64) error {
	_, err := q.db.Exec(`UPDATE sync_queue SET retries = retries + 1 WHERE id = ?`, id)
	return err
}

// Count returns the total number of items waiting in the sync queue.
func (q *Queue) Count() (int, error) {
	var count int
	err := q.db.QueryRow(`SELECT COUNT(*) FROM sync_queue`).Scan(&count)
	return count, err
}
