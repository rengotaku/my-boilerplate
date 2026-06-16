package persistlog

import (
	"testing"
	"time"
)

func TestAppendAndRead(t *testing.T) {
	w, err := New(t.TempDir())
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	now := time.Now().UTC()
	for i, msg := range []string{"line one", "line two", "line three"} {
		if err = w.Append(Line{
			TS:      now.Add(time.Duration(i) * time.Second),
			RunID:   7,
			Phase:   "execute",
			Level:   "info",
			Message: msg,
		}); err != nil {
			t.Fatalf("Append: %v", err)
		}
	}

	lines, err := w.Read(7)
	if err != nil {
		t.Fatalf("Read: %v", err)
	}
	if len(lines) != 3 {
		t.Fatalf("read %d lines, want 3", len(lines))
	}
	if lines[0].Message != "line one" || lines[2].Message != "line three" {
		t.Errorf("lines out of order: %+v", lines)
	}
	if lines[0].RunID != 7 || lines[0].Phase != "execute" {
		t.Errorf("metadata not preserved: %+v", lines[0])
	}
}

func TestRead_MissingRunReturnsEmpty(t *testing.T) {
	w, err := New(t.TempDir())
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	lines, err := w.Read(123)
	if err != nil {
		t.Fatalf("Read(missing): %v", err)
	}
	if len(lines) != 0 {
		t.Errorf("want empty slice, got %d lines", len(lines))
	}
}

func TestAppend_SeparatesByRun(t *testing.T) {
	w, _ := New(t.TempDir())
	_ = w.Append(Line{RunID: 1, Message: "a"})
	_ = w.Append(Line{RunID: 2, Message: "b"})

	r1, _ := w.Read(1)
	r2, _ := w.Read(2)
	if len(r1) != 1 || len(r2) != 1 {
		t.Fatalf("runs not separated: r1=%d r2=%d", len(r1), len(r2))
	}
	if r1[0].Message != "a" || r2[0].Message != "b" {
		t.Error("messages crossed between runs")
	}
}
