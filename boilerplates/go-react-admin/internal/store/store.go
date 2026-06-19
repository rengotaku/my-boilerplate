// Package store is the SQLite persistence layer for the example jobs/runs
// domain. It uses database/sql with the pure-Go modernc.org/sqlite driver (no
// cgo) and applies its schema on open via Migrate.
package store

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	_ "modernc.org/sqlite" // pure-Go SQLite driver
)

// ErrNotFound is returned when a lookup finds no row.
var ErrNotFound = errors.New("not found")

// RunStatus enumerates the lifecycle states of a run.
type RunStatus string

const (
	StatusQueued    RunStatus = "queued"
	StatusRunning   RunStatus = "running"
	StatusSucceeded RunStatus = "succeeded"
	StatusFailed    RunStatus = "failed"
)

// Job is a unit of work the worker runs on a cron schedule.
type Job struct {
	CreatedAt time.Time `json:"createdAt"`
	Name      string    `json:"name"`
	Kind      string    `json:"kind"`
	Schedule  string    `json:"schedule"` // cron spec (see internal/schedule)
	ID        int64     `json:"id"`
	Enabled   bool      `json:"enabled"`
}

// Run is one execution of a Job.
type Run struct {
	StartedAt  time.Time  `json:"startedAt"`
	CreatedAt  time.Time  `json:"createdAt"`
	FinishedAt *time.Time `json:"finishedAt"`
	JobName    string     `json:"jobName"`
	Status     RunStatus  `json:"status"`
	ID         int64      `json:"id"`
	JobID      int64      `json:"jobId"`
}

// Phase is a named step within a Run.
type Phase struct {
	StartedAt  time.Time  `json:"startedAt"`
	FinishedAt *time.Time `json:"finishedAt"`
	Name       string     `json:"name"`
	Status     RunStatus  `json:"status"`
	ID         int64      `json:"id"`
	RunID      int64      `json:"runId"`
	Seq        int        `json:"seq"`
}

// Metric is a single numeric time-series sample tied to a Run.
type Metric struct {
	TS    time.Time `json:"ts"`
	Name  string    `json:"name"`
	ID    int64     `json:"id"`
	RunID int64     `json:"runId"`
	Value float64   `json:"value"`
}

// Store wraps a SQLite database for the jobs/runs domain.
type Store struct {
	db *sql.DB
}

const schema = `
CREATE TABLE IF NOT EXISTS jobs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  schedule   TEXT NOT NULL DEFAULT '',
  enabled    INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id      INTEGER NOT NULL REFERENCES jobs(id),
  status      TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  finished_at TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_job ON runs(job_id);
CREATE TABLE IF NOT EXISTS phases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id      INTEGER NOT NULL REFERENCES runs(id),
  seq         INTEGER NOT NULL,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_phases_run ON phases(run_id);
CREATE TABLE IF NOT EXISTS metrics (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES runs(id),
  name   TEXT NOT NULL,
  value  REAL NOT NULL,
  ts     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_metrics_ts ON metrics(ts);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(name);
`

// Open opens (or creates) the SQLite database at dsn and applies the schema.
func Open(dsn string) (*Store, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	// SQLite is single-writer; one connection avoids "database is locked".
	db.SetMaxOpenConns(1)
	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		_ = db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) migrate() error {
	if _, err := s.db.Exec(schema); err != nil {
		return fmt.Errorf("apply schema: %w", err)
	}
	// Additive migration for databases created before `schedule` existed.
	if err := s.addColumnIfMissing("jobs", "schedule", "TEXT NOT NULL DEFAULT ''"); err != nil {
		return err
	}
	return nil
}

// addColumnIfMissing performs an idempotent ALTER TABLE ADD COLUMN, so upgrading
// an existing database picks up new columns without a migration tool.
func (s *Store) addColumnIfMissing(table, column, ddl string) error {
	rows, err := s.db.Query(fmt.Sprintf("PRAGMA table_info(%s)", table))
	if err != nil {
		return fmt.Errorf("inspect %s: %w", table, err)
	}
	defer func() { _ = rows.Close() }()
	for rows.Next() {
		var (
			cid        int
			name, ctyp string
			notnull    int
			dflt       sql.NullString
			pk         int
		)
		if err := rows.Scan(&cid, &name, &ctyp, &notnull, &dflt, &pk); err != nil {
			return err
		}
		if name == column {
			return rows.Close()
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if _, err := s.db.Exec(fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", table, column, ddl)); err != nil {
		return fmt.Errorf("add column %s.%s: %w", table, column, err)
	}
	return nil
}

// Close releases the underlying database handle.
func (s *Store) Close() error { return s.db.Close() }

const rfc = time.RFC3339Nano

func fmtTime(t time.Time) string { return t.UTC().Format(rfc) }

func parseTime(s string) (time.Time, error) { return time.Parse(rfc, s) }

func parseNullTime(ns sql.NullString) (*time.Time, error) {
	if !ns.Valid || ns.String == "" {
		return nil, nil
	}
	t, err := parseTime(ns.String)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
