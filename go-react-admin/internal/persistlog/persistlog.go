// Package persistlog appends run log lines to per-run JSONL files and reads
// them back for the run-detail API. There is no live tailing or SSE (Decision
// Log #6): logs are written as runs progress and returned statically.
package persistlog

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Line is one structured log record for a run.
type Line struct {
	TS      time.Time `json:"ts"`
	Phase   string    `json:"phase"`
	Level   string    `json:"level"`
	Message string    `json:"message"`
	RunID   int64     `json:"runId"`
}

// Writer appends Lines to <dir>/run-<id>.jsonl. It is safe for concurrent use.
type Writer struct {
	dir string
	mu  sync.Mutex
}

// New creates the log directory and returns a Writer rooted there.
func New(dir string) (*Writer, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("create log dir: %w", err)
	}
	return &Writer{dir: dir}, nil
}

func (w *Writer) path(runID int64) string {
	return filepath.Join(w.dir, fmt.Sprintf("run-%d.jsonl", runID))
}

// Append writes one line to the run's JSONL file.
func (w *Writer) Append(line Line) error {
	w.mu.Lock()
	defer w.mu.Unlock()

	f, err := os.OpenFile(w.path(line.RunID), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return fmt.Errorf("open log file: %w", err)
	}
	defer func() { _ = f.Close() }()

	enc := json.NewEncoder(f)
	if err := enc.Encode(line); err != nil {
		return fmt.Errorf("encode log line: %w", err)
	}
	return nil
}

// Read returns all lines for a run. A missing file yields an empty slice (a run
// may legitimately have produced no logs yet).
func (w *Writer) Read(runID int64) ([]Line, error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	f, err := os.Open(w.path(runID))
	if err != nil {
		if os.IsNotExist(err) {
			return []Line{}, nil
		}
		return nil, fmt.Errorf("open log file: %w", err)
	}
	defer func() { _ = f.Close() }()

	var lines []Line
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for sc.Scan() {
		if len(sc.Bytes()) == 0 {
			continue
		}
		var l Line
		if err := json.Unmarshal(sc.Bytes(), &l); err != nil {
			return nil, fmt.Errorf("decode log line: %w", err)
		}
		lines = append(lines, l)
	}
	if err := sc.Err(); err != nil {
		return nil, fmt.Errorf("scan log file: %w", err)
	}
	if lines == nil {
		lines = []Line{}
	}
	return lines, nil
}
