// Package observability exposes Prometheus metrics for the worker and web
// server on a dedicated registry, served at /metrics.
package observability

import (
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics holds the Prometheus collectors and the registry they belong to.
type Metrics struct {
	registry    *prometheus.Registry
	RunsTotal   *prometheus.CounterVec
	RunDuration prometheus.Histogram
}

// New builds a Metrics with a private registry (Go runtime + process collectors
// included) and registers the domain collectors.
func New() *Metrics {
	reg := prometheus.NewRegistry()
	reg.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	m := &Metrics{
		registry: reg,
		RunsTotal: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "admin_runs_total",
			Help: "Total number of runs the worker has produced, by terminal status.",
		}, []string{"status"}),
		RunDuration: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "admin_run_duration_seconds",
			Help:    "Duration of completed runs in seconds.",
			Buckets: prometheus.DefBuckets,
		}),
	}
	reg.MustRegister(m.RunsTotal, m.RunDuration)
	return m
}

// ObserveRun records a completed run's terminal status and duration.
func (m *Metrics) ObserveRun(status string, dur time.Duration) {
	m.RunsTotal.WithLabelValues(status).Inc()
	m.RunDuration.Observe(dur.Seconds())
}

// Handler returns the Prometheus exposition HTTP handler.
func (m *Metrics) Handler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{})
}
