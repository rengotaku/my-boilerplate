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
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"go-react-admin/internal/config"
	"go-react-admin/internal/observability"
	"go-react-admin/internal/persistlog"
	"go-react-admin/internal/schedule"
	"go-react-admin/internal/store"
)

// Deps are the runtime dependencies of the web server.
type Deps struct {
	Store          *store.Store
	Logs           *persistlog.Writer
	Metrics        *observability.Metrics
	RequestRestart func()
	Config         config.Config
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
		api.GET("/jobs", s.listJobs)
		api.POST("/jobs", s.createJob)
		api.GET("/jobs/:id", s.getJob)
		api.PUT("/jobs/:id", s.updateJob)
		api.DELETE("/jobs/:id", s.deleteJob)
		api.GET("/runs", s.listRuns)
		api.GET("/runs/:id", s.getRun)
		api.GET("/metrics/aggregate", s.metricsAggregate)
		api.GET("/config", s.getConfig)
		api.PUT("/config", s.updateConfig)
		api.POST("/restart", s.restart)
	}

	r.NoRoute(gin.WrapH(staticHandler))
	return r
}

func (s *Server) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// jobView augments a stored job with scheduling/run info for the Jobs screen.
type jobView struct {
	LastRunAt *time.Time `json:"lastRunAt"`
	NextRunAt *time.Time `json:"nextRunAt"`
	store.Job
	RunCount int `json:"runCount"`
}

func (s *Server) toJobView(job store.Job) (jobView, error) {
	last, err := s.deps.Store.LastRunStart(job.ID)
	if err != nil {
		return jobView{}, err
	}
	count, err := s.deps.Store.CountRunsByJob(job.ID)
	if err != nil {
		return jobView{}, err
	}
	view := jobView{Job: job, LastRunAt: last, RunCount: count}
	if sched, perr := schedule.Parse(job.Schedule); perr == nil {
		base := job.CreatedAt
		if last != nil {
			base = *last
		}
		next := sched.Next(base)
		view.NextRunAt = &next
	}
	return view, nil
}

func (s *Server) listJobs(c *gin.Context) {
	jobs, err := s.deps.Store.ListJobs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	views := make([]jobView, 0, len(jobs))
	for _, job := range jobs {
		v, err := s.toJobView(job)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		views = append(views, v)
	}
	c.JSON(http.StatusOK, gin.H{"items": views})
}

type jobRequest struct {
	Enabled  *bool  `json:"enabled"`
	Name     string `json:"name"`
	Kind     string `json:"kind"`
	Schedule string `json:"schedule"`
}

// validate trims input and checks the required fields and the cron spec.
func (req *jobRequest) validate() (enabled bool, err string) {
	req.Name = strings.TrimSpace(req.Name)
	req.Kind = strings.TrimSpace(req.Kind)
	req.Schedule = strings.TrimSpace(req.Schedule)
	if req.Name == "" {
		return false, "name is required"
	}
	if req.Kind == "" {
		req.Kind = "task"
	}
	if verr := schedule.Valid(req.Schedule); verr != nil {
		return false, verr.Error()
	}
	en := true
	if req.Enabled != nil {
		en = *req.Enabled
	}
	return en, ""
}

func (s *Server) createJob(c *gin.Context) {
	var req jobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	enabled, verr := req.validate()
	if verr != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": verr})
		return
	}
	job, err := s.deps.Store.CreateJob(req.Name, req.Kind, req.Schedule, enabled)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	view, err := s.toJobView(job)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, view)
}

func (s *Server) getJob(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	job, err := s.deps.Store.GetJob(id)
	if err == store.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	view, err := s.toJobView(job)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, view)
}

func (s *Server) updateJob(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var req jobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	enabled, verr := req.validate()
	if verr != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": verr})
		return
	}
	job, err := s.deps.Store.UpdateJob(id, req.Name, req.Kind, req.Schedule, enabled)
	if err == store.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	view, err := s.toJobView(job)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, view)
}

func (s *Server) deleteJob(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	err := s.deps.Store.DeleteJob(id)
	if err == store.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// parseID extracts the :id path param, writing a 400 and returning false on
// malformed input.
func parseID(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return 0, false
	}
	return id, true
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

// configItem is one setting shown on the Config screen, tagged with its source
// so the UI can render env values read-only and toml values as editable.
type configItem struct {
	Key      string `json:"key"`
	Label    string `json:"label"`
	Value    string `json:"value"`
	Source   string `json:"source"`   // "env" | "toml"
	Editable bool   `json:"editable"` // env: false, toml: true
}

type configResponse struct {
	ConfigPath string       `json:"configPath"`
	Items      []configItem `json:"items"`
}

func (s *Server) getConfig(c *gin.Context) {
	cfg := s.deps.Config
	c.JSON(http.StatusOK, configResponse{
		ConfigPath: cfg.ConfigFile,
		Items: []configItem{
			{Key: "port", Label: "Port", Value: cfg.Port, Source: "env", Editable: false},
			{Key: "database_dsn", Label: "Database DSN", Value: cfg.DatabaseDSN, Source: "env", Editable: false},
			{Key: "log_dir", Label: "Log directory", Value: cfg.LogDir, Source: "env", Editable: false},
			{Key: "worker_interval", Label: "Worker interval", Value: cfg.WorkerInterval.String(), Source: "toml", Editable: true},
			{Key: "shutdown_timeout", Label: "Shutdown timeout", Value: cfg.ShutdownTimeout.String(), Source: "toml", Editable: true},
			{Key: "time_zone", Label: "Time zone", Value: cfg.TimeZone, Source: "toml", Editable: true},
		},
	})
}

type updateConfigRequest struct {
	WorkerInterval  string `json:"worker_interval"`
	ShutdownTimeout string `json:"shutdown_timeout"`
	TimeZone        string `json:"time_zone"`
}

// updateConfig persists the editable (toml) settings. Env settings are not
// accepted here. Changes take effect on the next restart (POST /api/restart),
// not immediately — the response says so via "restartRequired".
func (s *Server) updateConfig(c *gin.Context) {
	var req updateConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Start from the current file so a partial update keeps the other value.
	current, err := config.ReadFile(s.deps.Config.ConfigFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if req.WorkerInterval != "" {
		current.WorkerInterval = req.WorkerInterval
	}
	if req.ShutdownTimeout != "" {
		current.ShutdownTimeout = req.ShutdownTimeout
	}
	if req.TimeZone != "" {
		current.TimeZone = req.TimeZone
	}

	if err := config.WriteFile(s.deps.Config.ConfigFile, current); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"workerInterval":  current.WorkerInterval,
		"shutdownTimeout": current.ShutdownTimeout,
		"timeZone":        current.TimeZone,
		"restartRequired": true,
	})
}

// restart triggers a graceful restart so saved toml values are reloaded.
func (s *Server) restart(c *gin.Context) {
	if s.deps.RequestRestart == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "restart not supported"})
		return
	}
	s.deps.RequestRestart()
	c.JSON(http.StatusAccepted, gin.H{"status": "restarting"})
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
