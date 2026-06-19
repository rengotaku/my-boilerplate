package observability

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHandler_ExposesObservedRuns(t *testing.T) {
	m := New()
	m.ObserveRun("succeeded", 2*time.Second)
	m.ObserveRun("failed", time.Second)
	m.ObserveRun("succeeded", 3*time.Second)

	rec := httptest.NewRecorder()
	m.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/metrics", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "admin_runs_total") {
		t.Error("expected admin_runs_total in /metrics output")
	}
	if !strings.Contains(body, `status="succeeded"`) {
		t.Error("expected succeeded label in /metrics output")
	}
	if !strings.Contains(body, "admin_run_duration_seconds") {
		t.Error("expected admin_run_duration_seconds in /metrics output")
	}
}
