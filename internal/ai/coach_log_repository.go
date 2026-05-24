package ai

import "database/sql"

// CoachLogRepository handles SQLite CRUD operations for the ai_coach_logs table.
type CoachLogRepository struct {
	db *sql.DB
}

// NewCoachLogRepository creates a new repository backed by the given database connection.
func NewCoachLogRepository(db *sql.DB) *CoachLogRepository {
	return &CoachLogRepository{db: db}
}

// Insert creates a new coach log row.
func (r *CoachLogRepository) Insert(log *CoachLog) error {
	_, err := r.db.Exec(
		`INSERT INTO ai_coach_logs (id, type, content, created_at, dismissed)
		 VALUES (?, ?, ?, ?, ?)`,
		log.ID, log.Type, log.Content, log.CreatedAt, log.Dismissed,
	)
	return err
}

// FindByID retrieves a single coach log by its ID.
func (r *CoachLogRepository) FindByID(id string) (*CoachLog, error) {
	log := &CoachLog{}
	err := r.db.QueryRow(
		`SELECT id, type, content, created_at, dismissed
		 FROM ai_coach_logs WHERE id = ?`, id,
	).Scan(&log.ID, &log.Type, &log.Content, &log.CreatedAt, &log.Dismissed)
	if err != nil {
		return nil, err
	}
	return log, nil
}

// List returns non-dismissed coach logs filtered by type, ordered by created_at DESC.
func (r *CoachLogRepository) List(logType string, limit int) ([]CoachLog, error) {
	rows, err := r.db.Query(
		`SELECT id, type, content, created_at, dismissed
		 FROM ai_coach_logs
		 WHERE type = ? AND dismissed = 0
		 ORDER BY created_at DESC
		 LIMIT ?`, logType, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []CoachLog
	for rows.Next() {
		var l CoachLog
		if err := rows.Scan(&l.ID, &l.Type, &l.Content, &l.CreatedAt, &l.Dismissed); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}

// Dismiss marks a coach log as dismissed.
func (r *CoachLogRepository) Dismiss(id string) error {
	_, err := r.db.Exec(
		`UPDATE ai_coach_logs SET dismissed = 1 WHERE id = ?`, id,
	)
	return err
}

// GetLatestByType returns the most recent non-dismissed log of the given type.
func (r *CoachLogRepository) GetLatestByType(logType string) (*CoachLog, error) {
	log := &CoachLog{}
	err := r.db.QueryRow(
		`SELECT id, type, content, created_at, dismissed
		 FROM ai_coach_logs
		 WHERE type = ? AND dismissed = 0
		 ORDER BY created_at DESC
		 LIMIT 1`, logType,
	).Scan(&log.ID, &log.Type, &log.Content, &log.CreatedAt, &log.Dismissed)
	if err != nil {
		return nil, err
	}
	return log, nil
}
