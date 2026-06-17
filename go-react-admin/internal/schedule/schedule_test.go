package schedule

import (
	"testing"
	"time"
)

func TestParse_AcceptsCronDescriptorAndSeconds(t *testing.T) {
	for _, spec := range []string{"0 2 * * *", "@every 20s", "@hourly", "*/10 * * * * *"} {
		if _, err := Parse(spec); err != nil {
			t.Errorf("Parse(%q) error = %v, want nil", spec, err)
		}
	}
}

func TestParse_RejectsGarbage(t *testing.T) {
	if _, err := Parse("not a cron"); err == nil {
		t.Error("Parse(garbage) = nil error, want error")
	}
}

func TestValid(t *testing.T) {
	if err := Valid("@every 1m"); err != nil {
		t.Errorf("Valid(@every 1m) = %v", err)
	}
	if err := Valid("?!"); err == nil {
		t.Error("Valid(?!) = nil, want error")
	}
}

func TestNext(t *testing.T) {
	base := time.Date(2026, 6, 16, 10, 0, 0, 0, time.UTC)
	next := Next("@every 1h", base)
	if !next.Equal(base.Add(time.Hour)) {
		t.Errorf("Next = %v, want %v", next, base.Add(time.Hour))
	}
	// Invalid spec yields the zero time.
	if !Next("garbage", base).IsZero() {
		t.Error("Next(garbage) should be zero time")
	}
}
