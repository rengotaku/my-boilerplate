// Package web is the HTTP/API half of the single binary: a gin engine that
// serves the jobs/runs REST API, the Prometheus /metrics endpoint, and falls
// back to the embedded SPA for everything else.
//
// There is no live-tailing or SSE endpoint (Decision Log #6): run logs are
// returned in full inside the run-detail response.
package web

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"go-react-admin/internal/observability"
	"go-react-admin/internal/persistlog"
	"go-react-admin/internal/store"
)

// Deps are the runtime dependencies of the web server.
type Deps struct {
	Store   *store.Store
	Logs    *persistlog.Writer
	Metrics *observability.Metrics
	Config  any // returned verbatim by GET /api/config
}

// Server holds the handler dependencies.
type Server struct {
	deps Deps
}

// New constructs a web Server.
func New(d Deps) *Server { return &Server{deps: d} }

// Routes builds the gin engine. staticHandler serves the embedded SPA (prod) or
// 404s (dev) for any non-API route.
func (s *Server) Routes(staticHandler http.Handler) http.Handler {
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/health", s.health)
	if s.deps.Metrics != nil {
		r.GET("/metrics", gin.WrapH(s.deps.Metrics.Handler()))
	}

	api := r.Group("/api")
	{
		api.GET("/runs", s.listRuns)
		api.GET("/runs/:id", s.getRun)
		api.GET("/metrics/aggregate", s.metricsAggregate)
		api.GET("/config", s.getConfig)
	}

	r.NoRoute(gin.WrapH(staticHandler))
	return r
}

func (s *Server) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

type listRunsResponse struct {
	Items    []store.Run `json:"items"`
	Total    int         `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"pageSize"`
}

func (s *Server) listRuns(c *gin.Context) {
	page := atoiDefault(c.Query("page"), 1)
	pageSize := atoiDefault(c.Query("page_size"), 20)
	filter := store.RunFilter{
		Status: store.RunStatus(c.Query("status")),
		JobID:  int64(atoiDefault(c.Query("job_id"), 0)),
	}

	runs, total, err := s.deps.Store.ListRuns(filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if runs == nil {
		runs = []store.Run{}
	}
	c.JSON(http.StatusOK, listRunsResponse{Items: runs, Total: total, Page: page, PageSize: pageSize})
}

// event is a timeline entry derived from phase transitions.
type event struct {
	TS     time.Time       `json:"ts"`
	Type   string          `json:"type"`
	Phase  string          `json:"phase"`
	Status store.RunStatus `json:"status"`
}

type runDetailResponse struct {
	Phases []store.Phase     `json:"phases"`
	Events []event           `json:"events"`
	Logs   []persistlog.Line `json:"logs"`
	Run    store.Run         `json:"run"`
}

func (s *Server) getRun(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid run id"})
		return
	}

	run, err := s.deps.Store.GetRun(id)
	if err == store.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "run not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	phases, err := s.deps.Store.ListPhases(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logs := []persistlog.Line{}
	if s.deps.Logs != nil {
		logs, err = s.deps.Logs.Read(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, runDetailResponse{
		Run:    run,
		Phases: phases,
		Events: eventsFromPhases(phases),
		Logs:   logs,
	})
}

func eventsFromPhases(phases []store.Phase) []event {
	events := []event{}
	for _, p := range phases {
		events = append(events, event{TS: p.StartedAt, Type: "phase_started", Phase: p.Name, Status: store.StatusRunning})
		if p.FinishedAt != nil {
			events = append(events, event{TS: *p.FinishedAt, Type: "phase_finished", Phase: p.Name, Status: p.Status})
		}
	}
	return events
}

type metricsAggregateResponse struct {
	From   time.Time            `json:"from"`
	To     time.Time            `json:"to"`
	Bucket string               `json:"bucket"`
	Series []store.MetricSeries `json:"series"`
}

func (s *Server) metricsAggregate(c *gin.Context) {
	now := time.Now().UTC()
	to := parseTimeDefault(c.Query("to"), now)
	from := parseTimeDefault(c.Query("from"), now.Add(-24*time.Hour))
	bucketStr := c.DefaultQuery("bucket", "1h")
	bucket, err := time.ParseDuration(bucketStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid bucket duration"})
		return
	}

	series, err := s.deps.Store.AggregateMetrics(from, to, bucket)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if series == nil {
		series = []store.MetricSeries{}
	}
	c.JSON(http.StatusOK, metricsAggregateResponse{From: from, To: to, Bucket: bucketStr, Series: series})
}

func (s *Server) getConfig(c *gin.Context) {
	c.JSON(http.StatusOK, s.deps.Config)
}

func atoiDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func parseTimeDefault(s string, def time.Time) time.Time {
	if s == "" {
		return def
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return def
	}
	return t.UTC()
}
