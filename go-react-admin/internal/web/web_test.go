package web

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"go-react-admin/internal/config"
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

	job, _ := st.CreateJob("nightly", "batch", "@every 1m", true)
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
		Config: config.Config{
			Port: "8084", DatabaseDSN: "admin.db", LogDir: "data/logs",
			ConfigFile:     filepath.Join(t.TempDir(), "config.toml"),
			WorkerInterval: 15 * time.Second, ShutdownTimeout: 10 * time.Second,
		},
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

func TestConfig_TagsEnvAndTomlSources(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/api/config")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var resp configResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	byKey := map[string]configItem{}
	for _, it := range resp.Items {
		byKey[it.Key] = it
	}
	if byKey["port"].Source != "env" || byKey["port"].Editable {
		t.Errorf("port should be env/non-editable: %+v", byKey["port"])
	}
	if byKey["worker_interval"].Source != "toml" || !byKey["worker_interval"].Editable {
		t.Errorf("worker_interval should be toml/editable: %+v", byKey["worker_interval"])
	}
	if byKey["worker_interval"].Value != "15s" {
		t.Errorf("worker_interval value = %q, want 15s", byKey["worker_interval"].Value)
	}
}

// newConfigServer builds a server whose config file lives in a temp dir, and
// returns the handler, the config path, and a pointer that records whether a
// restart was requested.
func newConfigServer(t *testing.T) (http.Handler, string, *bool) {
	t.Helper()
	st, _ := store.Open(filepath.Join(t.TempDir(), "c.db"))
	t.Cleanup(func() { _ = st.Close() })
	logs, _ := persistlog.New(t.TempDir())
	cfgPath := filepath.Join(t.TempDir(), "config.toml")

	restarted := false
	h := New(Deps{
		Store: st, Logs: logs, Metrics: observability.New(),
		Config: config.Config{
			Port: "8084", ConfigFile: cfgPath,
			WorkerInterval: 15 * time.Second, ShutdownTimeout: 10 * time.Second,
		},
		RequestRestart: func() { restarted = true },
	}).Routes(staticStub())
	return h, cfgPath, &restarted
}

func putJSON(h http.Handler, target, body string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, target, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	h.ServeHTTP(rec, req)
	return rec
}

func TestUpdateConfig_WritesTomlFile(t *testing.T) {
	h, cfgPath, _ := newConfigServer(t)
	rec := putJSON(h, "/api/config", `{"worker_interval":"20s","shutdown_timeout":"25s"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body=%s", rec.Code, rec.Body.String())
	}
	fc, err := config.ReadFile(cfgPath)
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	if fc.WorkerInterval != "20s" || fc.ShutdownTimeout != "25s" {
		t.Errorf("toml not persisted: %+v", fc)
	}
}

func TestUpdateConfig_RejectsInvalidDuration(t *testing.T) {
	h, _, _ := newConfigServer(t)
	rec := putJSON(h, "/api/config", `{"worker_interval":"banana"}`)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func TestRestart_InvokesRequestRestart(t *testing.T) {
	h, _, restarted := newConfigServer(t)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/restart", nil))
	if rec.Code != http.StatusAccepted {
		t.Fatalf("status = %d, want 202", rec.Code)
	}
	if !*restarted {
		t.Error("RequestRestart was not invoked")
	}
}

func TestRestart_UnsupportedWhenNil(t *testing.T) {
	h, _ := newTestServer(t) // newTestServer leaves RequestRestart nil
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/restart", nil))
	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want 503", rec.Code)
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

func reqJSON(h http.Handler, method, target, body string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, target, nil)
	} else {
		r = httptest.NewRequest(method, target, strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
	}
	h.ServeHTTP(rec, r)
	return rec
}

func TestListJobs(t *testing.T) {
	h, _ := newTestServer(t)
	rec := do(h, "/api/jobs")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var resp struct {
		Items []struct {
			Name     string `json:"name"`
			Schedule string `json:"schedule"`
			RunCount int    `json:"runCount"`
		} `json:"items"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Items) == 0 {
		t.Fatal("expected at least one job")
	}
}

func TestCreateJob_ValidatesCron(t *testing.T) {
	h, _ := newTestServer(t)

	// invalid cron rejected
	if rec := reqJSON(h, http.MethodPost, "/api/jobs", `{"name":"x","schedule":"nope"}`); rec.Code != http.StatusBadRequest {
		t.Errorf("invalid cron status = %d, want 400", rec.Code)
	}
	// missing name rejected
	if rec := reqJSON(h, http.MethodPost, "/api/jobs", `{"schedule":"@every 1m"}`); rec.Code != http.StatusBadRequest {
		t.Errorf("missing name status = %d, want 400", rec.Code)
	}
	// valid create
	rec := reqJSON(h, http.MethodPost, "/api/jobs", `{"name":"new","kind":"task","schedule":"@every 30s","enabled":true}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, body=%s", rec.Code, rec.Body.String())
	}
}

func TestJobLifecycle_UpdateAndDelete(t *testing.T) {
	h, _ := newTestServer(t)
	rec := reqJSON(h, http.MethodPost, "/api/jobs", `{"name":"lc","schedule":"@every 1m"}`)
	var created struct {
		ID int64 `json:"id"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &created)
	if created.ID == 0 {
		t.Fatal("no id returned")
	}

	// get
	if rec := do(h, "/api/jobs/"+itoa(created.ID)); rec.Code != http.StatusOK {
		t.Fatalf("get status = %d", rec.Code)
	}
	// update
	if rec := reqJSON(h, http.MethodPut, "/api/jobs/"+itoa(created.ID), `{"name":"lc2","schedule":"@hourly","enabled":false}`); rec.Code != http.StatusOK {
		t.Fatalf("update status = %d, body=%s", rec.Code, rec.Body.String())
	}
	// delete
	if rec := reqJSON(h, http.MethodDelete, "/api/jobs/"+itoa(created.ID), ""); rec.Code != http.StatusNoContent {
		t.Fatalf("delete status = %d", rec.Code)
	}
	// now gone
	if rec := do(h, "/api/jobs/"+itoa(created.ID)); rec.Code != http.StatusNotFound {
		t.Errorf("get after delete = %d, want 404", rec.Code)
	}
}

func TestJob_NotFoundAndBadID(t *testing.T) {
	h, _ := newTestServer(t)
	if rec := do(h, "/api/jobs/9999"); rec.Code != http.StatusNotFound {
		t.Errorf("missing get = %d, want 404", rec.Code)
	}
	if rec := do(h, "/api/jobs/abc"); rec.Code != http.StatusBadRequest {
		t.Errorf("bad id = %d, want 400", rec.Code)
	}
	if rec := reqJSON(h, http.MethodPut, "/api/jobs/9999", `{"name":"x","schedule":"@every 1m"}`); rec.Code != http.StatusNotFound {
		t.Errorf("update missing = %d, want 404", rec.Code)
	}
	if rec := reqJSON(h, http.MethodDelete, "/api/jobs/9999", ""); rec.Code != http.StatusNotFound {
		t.Errorf("delete missing = %d, want 404", rec.Code)
	}
}

func TestCreateJob_DefaultsKindAndComputesNextRun(t *testing.T) {
	h, _ := newTestServer(t)
	rec := reqJSON(h, http.MethodPost, "/api/jobs", `{"name":"nokind","schedule":"@every 30s"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, body=%s", rec.Code, rec.Body.String())
	}
	var view struct {
		NextRunAt *string `json:"nextRunAt"`
		Kind      string  `json:"kind"`
		RunCount  int     `json:"runCount"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &view); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if view.Kind != "task" {
		t.Errorf("kind = %q, want defaulted 'task'", view.Kind)
	}
	if view.NextRunAt == nil {
		t.Error("nextRunAt should be computed from the schedule")
	}
	if view.RunCount != 0 {
		t.Errorf("runCount = %d, want 0 for a new job", view.RunCount)
	}
}

func TestCreateJob_BadBody(t *testing.T) {
	h, _ := newTestServer(t)
	if rec := reqJSON(h, http.MethodPost, "/api/jobs", `{not json`); rec.Code != http.StatusBadRequest {
		t.Errorf("bad body status = %d, want 400", rec.Code)
	}
}

func TestQueryParamFallbacks(t *testing.T) {
	h, _ := newTestServer(t)

	// non-numeric page/page_size fall back to defaults (atoiDefault error branch)
	if rec := do(h, "/api/runs?page=abc&page_size=xyz"); rec.Code != http.StatusOK {
		t.Errorf("bad paging status = %d, want 200 (fallback)", rec.Code)
	}

	// explicit valid from/to (parseTimeDefault success branch)
	if rec := do(h, "/api/metrics/aggregate?from=2026-06-16T00:00:00Z&to=2026-06-16T12:00:00Z&bucket=1h"); rec.Code != http.StatusOK {
		t.Errorf("explicit range status = %d, want 200", rec.Code)
	}
	// garbage from/to fall back to defaults (parseTimeDefault error branch)
	if rec := do(h, "/api/metrics/aggregate?from=nope&to=nope"); rec.Code != http.StatusOK {
		t.Errorf("garbage range status = %d, want 200 (fallback)", rec.Code)
	}
}
