package web

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"go-react-admin/internal/observability"
	"go-react-admin/internal/persistlog"
	"go-react-admin/internal/store"
)

func init() { gin.SetMode(gin.TestMode) }

func staticStub() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SPA"))
	})
}

// newTestServer builds a Server backed by a temp store seeded with one finished
// run (3 phases, metrics, logs).
func newTestServer(t *testing.T) (http.Handler, int64) {
	t.Helper()
	st, err := store.Open(filepath.Join(t.TempDir(), "web.db"))
	if err != nil {
		t.Fatalf("store.Open: %v", err)
	}
	t.Cleanup(func() { _ = st.Close() })
	logs, _ := persistlog.New(t.TempDir())

	job, _ := st.CreateJob("nightly", "batch", true)
	start := time.Now().UTC()
	run, _ := st.CreateRun(job.ID, start)
	pid, _ := st.AddPhase(run.ID, 0, "prepare", start)
	_ = st.FinishPhase(pid, store.StatusSucceeded, start.Add(time.Second))
	_ = st.AddMetric(run.ID, "tokens", 200, start)
	_ = st.FinishRun(run.ID, store.StatusSucceeded, start.Add(2*time.Second))
	_ = logs.Append(persistlog.Line{TS: start, RunID: run.ID, Phase: "prepare", Level: "info", Message: "hello"})

	h := New(Deps{
		Store:   st,
		Logs:    logs,
		Metrics: observability.New(),
		Config:  map[string]string{"port": "8080"},
	}).Routes(staticStub())
	return h, run.ID
}

func do(h http.Handler, target string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, target, nil))
	return rec
}

func TestHealth(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/health")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
}

func TestListRuns(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/api/runs?page=1&page_size=10")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var resp listRunsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Total != 1 || len(resp.Items) != 1 {
		t.Errorf("total=%d items=%d, want 1/1", resp.Total, len(resp.Items))
	}
}

func TestListRuns_StatusFilter(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/api/runs?status=failed")
	var resp listRunsResponse
	_ = json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp.Total != 0 {
		t.Errorf("failed total = %d, want 0", resp.Total)
	}
}

func TestGetRun_Detail(t *testing.T) {
	h, runID := newTestServer(t)
	rec := do(h, "/api/runs/"+itoa(runID))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var resp runDetailResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Run.ID != runID {
		t.Errorf("run id = %d, want %d", resp.Run.ID, runID)
	}
	if len(resp.Phases) != 1 {
		t.Errorf("phases = %d, want 1", len(resp.Phases))
	}
	if len(resp.Events) != 2 { // started + finished
		t.Errorf("events = %d, want 2", len(resp.Events))
	}
	if len(resp.Logs) != 1 {
		t.Errorf("logs = %d, want 1", len(resp.Logs))
	}
}

func TestGetRun_NotFound(t *testing.T) {
	h, _ := newTestServer(t)
	if rec := do(h, "/api/runs/9999"); rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", rec.Code)
	}
}

func TestGetRun_BadID(t *testing.T) {
	h, _ := newTestServer(t)
	if rec := do(h, "/api/runs/abc"); rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func TestMetricsAggregate(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/api/metrics/aggregate?bucket=1h")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var resp metricsAggregateResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Series) == 0 {
		t.Error("expected at least one metric series")
	}
}

func TestMetricsAggregate_BadBucket(t *testing.T) {
	h, _ := newTestServer(t)
	if rec := do(h, "/api/metrics/aggregate?bucket=nope"); rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func TestConfig(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/api/config")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
}

func TestPrometheusMetrics(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/metrics")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
}

func TestSPAFallback(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/some/spa/route")
	if rec.Code != http.StatusOK || rec.Body.String() != "SPA" {
		t.Errorf("fallback = %d %q", rec.Code, rec.Body.String())
	}
}

func itoa(n int64) string { return strconv.FormatInt(n, 10) }
