package store

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// CreateJob inserts a job and returns it with its assigned ID.
func (s *Store) CreateJob(name, kind, schedule string, enabled bool) (Job, error) {
	now := time.Now().UTC()
	res, err := s.db.Exec(
		`INSERT INTO jobs (name, kind, schedule, enabled, created_at) VALUES (?, ?, ?, ?, ?)`,
		name, kind, schedule, boolToInt(enabled), fmtTime(now),
	)
	if err != nil {
		return Job{}, fmt.Errorf("insert job: %w", err)
	}
	id, _ := res.LastInsertId()
	return Job{ID: id, Name: name, Kind: kind, Schedule: schedule, Enabled: enabled, CreatedAt: now}, nil
}

const jobColumns = `id, name, kind, schedule, enabled, created_at`

func scanJob(sc rowScanner) (Job, error) {
	var j Job
	var enabled int
	var created string
	if err := sc.Scan(&j.ID, &j.Name, &j.Kind, &j.Schedule, &enabled, &created); err != nil {
		return Job{}, err
	}
	j.Enabled = enabled != 0
	t, err := parseTime(created)
	if err != nil {
		return Job{}, err
	}
	j.CreatedAt = t
	return j, nil
}

// ListJobs returns all jobs ordered by id.
func (s *Store) ListJobs() ([]Job, error) {
	rows, err := s.db.Query(`SELECT ` + jobColumns + ` FROM jobs ORDER BY id`)
	if err != nil {
		return nil, fmt.Errorf("query jobs: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var jobs []Job
	for rows.Next() {
		j, err := scanJob(rows)
		if err != nil {
			return nil, err
		}
		jobs = append(jobs, j)
	}
	return jobs, rows.Err()
}

// GetJob returns one job by id, or ErrNotFound.
func (s *Store) GetJob(id int64) (Job, error) {
	j, err := scanJob(s.db.QueryRow(`SELECT `+jobColumns+` FROM jobs WHERE id = ?`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return Job{}, ErrNotFound
	}
	return j, err
}

// UpdateJob updates a job's mutable fields. Returns ErrNotFound if absent.
func (s *Store) UpdateJob(id int64, name, kind, schedule string, enabled bool) (Job, error) {
	res, err := s.db.Exec(
		`UPDATE jobs SET name = ?, kind = ?, schedule = ?, enabled = ? WHERE id = ?`,
		name, kind, schedule, boolToInt(enabled), id,
	)
	if err != nil {
		return Job{}, fmt.Errorf("update job: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return Job{}, ErrNotFound
	}
	return s.GetJob(id)
}

// DeleteJob removes a job and all of its runs/phases/metrics in one
// transaction. Returns ErrNotFound if the job does not exist.
func (s *Store) DeleteJob(id int64) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if _, err = tx.Exec(
		`DELETE FROM phases WHERE run_id IN (SELECT id FROM runs WHERE job_id = ?)`, id); err != nil {
		return fmt.Errorf("delete phases: %w", err)
	}
	if _, err = tx.Exec(
		`DELETE FROM metrics WHERE run_id IN (SELECT id FROM runs WHERE job_id = ?)`, id); err != nil {
		return fmt.Errorf("delete metrics: %w", err)
	}
	if _, err = tx.Exec(`DELETE FROM runs WHERE job_id = ?`, id); err != nil {
		return fmt.Errorf("delete runs: %w", err)
	}
	res, err := tx.Exec(`DELETE FROM jobs WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete job: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return tx.Commit()
}

// LastRunStart returns the most recent run start time for a job, or nil if the
// job has never run.
func (s *Store) LastRunStart(jobID int64) (*time.Time, error) {
	var started sql.NullString
	err := s.db.QueryRow(`SELECT MAX(started_at) FROM runs WHERE job_id = ?`, jobID).Scan(&started)
	if err != nil {
		return nil, fmt.Errorf("last run start: %w", err)
	}
	return parseNullTime(started)
}

// CountRunsByJob returns how many runs a job has produced.
func (s *Store) CountRunsByJob(jobID int64) (int, error) {
	var n int
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM runs WHERE job_id = ?`, jobID).Scan(&n); err != nil {
		return 0, fmt.Errorf("count runs by job: %w", err)
	}
	return n, nil
}

// CreateRun inserts a run in the running state and returns it.
func (s *Store) CreateRun(jobID int64, startedAt time.Time) (Run, error) {
	res, err := s.db.Exec(
		`INSERT INTO runs (job_id, status, started_at, created_at) VALUES (?, ?, ?, ?)`,
		jobID, string(StatusRunning), fmtTime(startedAt), fmtTime(startedAt),
	)
	if err != nil {
		return Run{}, fmt.Errorf("insert run: %w", err)
	}
	id, _ := res.LastInsertId()
	return Run{ID: id, JobID: jobID, Status: StatusRunning, StartedAt: startedAt, CreatedAt: startedAt}, nil
}

// FinishRun marks a run terminal (succeeded/failed) at finishedAt.
func (s *Store) FinishRun(runID int64, status RunStatus, finishedAt time.Time) error {
	_, err := s.db.Exec(
		`UPDATE runs SET status = ?, finished_at = ? WHERE id = ?`,
		string(status), fmtTime(finishedAt), runID,
	)
	if err != nil {
		return fmt.Errorf("finish run: %w", err)
	}
	return nil
}

// AddPhase inserts a phase in the running state and returns its ID.
func (s *Store) AddPhase(runID int64, seq int, name string, startedAt time.Time) (int64, error) {
	res, err := s.db.Exec(
		`INSERT INTO phases (run_id, seq, name, status, started_at) VALUES (?, ?, ?, ?, ?)`,
		runID, seq, name, string(StatusRunning), fmtTime(startedAt),
	)
	if err != nil {
		return 0, fmt.Errorf("insert phase: %w", err)
	}
	id, _ := res.LastInsertId()
	return id, nil
}

// FinishPhase marks a phase terminal at finishedAt.
func (s *Store) FinishPhase(phaseID int64, status RunStatus, finishedAt time.Time) error {
	_, err := s.db.Exec(
		`UPDATE phases SET status = ?, finished_at = ? WHERE id = ?`,
		string(status), fmtTime(finishedAt), phaseID,
	)
	if err != nil {
		return fmt.Errorf("finish phase: %w", err)
	}
	return nil
}

// AddMetric records one numeric sample for a run.
func (s *Store) AddMetric(runID int64, name string, value float64, ts time.Time) error {
	_, err := s.db.Exec(
		`INSERT INTO metrics (run_id, name, value, ts) VALUES (?, ?, ?, ?)`,
		runID, name, value, fmtTime(ts),
	)
	if err != nil {
		return fmt.Errorf("insert metric: %w", err)
	}
	return nil
}

// RunFilter narrows ListRuns. Zero-value fields are ignored.
type RunFilter struct {
	Status RunStatus
	JobID  int64
}

// ListRuns returns a page of runs (newest first) and the total matching count.
func (s *Store) ListRuns(f RunFilter, page, pageSize int) ([]Run, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	where := "WHERE 1=1"
	var args []any
	if f.Status != "" {
		where += " AND r.status = ?"
		args = append(args, string(f.Status))
	}
	if f.JobID != 0 {
		where += " AND r.job_id = ?"
		args = append(args, f.JobID)
	}

	var total int
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM runs r `+where, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count runs: %w", err)
	}

	q := `SELECT r.id, r.job_id, j.name, r.status, r.started_at, r.finished_at, r.created_at
	      FROM runs r JOIN jobs j ON j.id = r.job_id ` + where +
		` ORDER BY r.id DESC LIMIT ? OFFSET ?`
	args = append(args, pageSize, (page-1)*pageSize)

	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query runs: %w", err)
	}
	defer func() { _ = rows.Close() }()

	runs, err := scanRuns(rows)
	if err != nil {
		return nil, 0, err
	}
	return runs, total, nil
}

// GetRun returns a single run by id, or ErrNotFound.
func (s *Store) GetRun(id int64) (Run, error) {
	row := s.db.QueryRow(
		`SELECT r.id, r.job_id, j.name, r.status, r.started_at, r.finished_at, r.created_at
		 FROM runs r JOIN jobs j ON j.id = r.job_id WHERE r.id = ?`, id)
	run, err := scanRun(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Run{}, ErrNotFound
	}
	return run, err
}

// ListPhases returns the phases of a run ordered by sequence.
func (s *Store) ListPhases(runID int64) ([]Phase, error) {
	rows, err := s.db.Query(
		`SELECT id, run_id, seq, name, status, started_at, finished_at
		 FROM phases WHERE run_id = ? ORDER BY seq`, runID)
	if err != nil {
		return nil, fmt.Errorf("query phases: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var phases []Phase
	for rows.Next() {
		var p Phase
		var started string
		var finished sql.NullString
		if err = rows.Scan(&p.ID, &p.RunID, &p.Seq, &p.Name, &p.Status, &started, &finished); err != nil {
			return nil, err
		}
		if p.StartedAt, err = parseTime(started); err != nil {
			return nil, err
		}
		if p.FinishedAt, err = parseNullTime(finished); err != nil {
			return nil, err
		}
		phases = append(phases, p)
	}
	return phases, rows.Err()
}

// MetricSeries is a named sequence of time-ordered points.
type MetricSeries struct {
	Name   string        `json:"name"`
	Points []MetricPoint `json:"points"`
}

// MetricPoint is one sample in a MetricSeries.
type MetricPoint struct {
	TS    time.Time `json:"ts"`
	Value float64   `json:"value"`
}

// AggregateMetrics returns one series per metric name within [from, to],
// summed into time buckets of the given width (e.g. time.Hour). A zero bucket
// returns each raw sample as its own point.
func (s *Store) AggregateMetrics(from, to time.Time, bucket time.Duration) ([]MetricSeries, error) {
	rows, err := s.db.Query(
		`SELECT name, value, ts FROM metrics WHERE ts >= ? AND ts <= ? ORDER BY ts`,
		fmtTime(from), fmtTime(to))
	if err != nil {
		return nil, fmt.Errorf("query metrics: %w", err)
	}
	defer func() { _ = rows.Close() }()

	// name -> bucketStart(unix) -> summed value
	agg := map[string]map[int64]float64{}
	order := map[string][]int64{}
	for rows.Next() {
		var name, tsStr string
		var value float64
		if err = rows.Scan(&name, &value, &tsStr); err != nil {
			return nil, err
		}
		var ts time.Time
		if ts, err = parseTime(tsStr); err != nil {
			return nil, err
		}
		key := ts.Unix()
		if bucket > 0 {
			key = ts.Truncate(bucket).Unix()
		}
		if agg[name] == nil {
			agg[name] = map[int64]float64{}
		}
		if _, seen := agg[name][key]; !seen {
			order[name] = append(order[name], key)
		}
		agg[name][key] += value
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	var series []MetricSeries
	for name, buckets := range agg {
		ms := MetricSeries{Name: name}
		for _, key := range order[name] {
			ms.Points = append(ms.Points, MetricPoint{TS: time.Unix(key, 0).UTC(), Value: buckets[key]})
		}
		series = append(series, ms)
	}
	return series, nil
}

func scanRuns(rows *sql.Rows) ([]Run, error) {
	var runs []Run
	for rows.Next() {
		var r Run
		var started, created string
		var finished sql.NullString
		if err := rows.Scan(&r.ID, &r.JobID, &r.JobName, &r.Status, &started, &finished, &created); err != nil {
			return nil, err
		}
		var err error
		if r.StartedAt, err = parseTime(started); err != nil {
			return nil, err
		}
		if r.CreatedAt, err = parseTime(created); err != nil {
			return nil, err
		}
		if r.FinishedAt, err = parseNullTime(finished); err != nil {
			return nil, err
		}
		runs = append(runs, r)
	}
	return runs, rows.Err()
}

type rowScanner interface{ Scan(...any) error }

func scanRun(row rowScanner) (Run, error) {
	var r Run
	var started, created string
	var finished sql.NullString
	if err := row.Scan(&r.ID, &r.JobID, &r.JobName, &r.Status, &started, &finished, &created); err != nil {
		return Run{}, err
	}
	var err error
	if r.StartedAt, err = parseTime(started); err != nil {
		return Run{}, err
	}
	if r.CreatedAt, err = parseTime(created); err != nil {
		return Run{}, err
	}
	if r.FinishedAt, err = parseNullTime(finished); err != nil {
		return Run{}, err
	}
	return r, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
