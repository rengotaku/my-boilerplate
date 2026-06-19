// Package schedule wraps cron parsing so the worker (scheduling) and the web
// layer (validation) share one spec dialect.
//
// The parser accepts standard 5-field cron ("0 2 * * *"), an optional leading
// seconds field ("*/10 * * * * *"), and descriptors ("@every 20s", "@hourly").
package schedule

import (
	"fmt"
	"time"

	"github.com/robfig/cron/v3"
)

var parser = cron.NewParser(
	cron.SecondOptional | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor,
)

// Schedule computes the next activation after a given time.
type Schedule = cron.Schedule

// Parse compiles a cron spec.
func Parse(spec string) (Schedule, error) {
	s, err := parser.Parse(spec)
	if err != nil {
		return nil, fmt.Errorf("invalid schedule %q: %w", spec, err)
	}
	return s, nil
}

// Valid reports whether spec is a parseable schedule.
func Valid(spec string) error {
	_, err := Parse(spec)
	return err
}

// Next returns the next activation strictly after `after`, or the zero time if
// the spec is invalid.
func Next(spec string, after time.Time) time.Time {
	s, err := Parse(spec)
	if err != nil {
		return time.Time{}
	}
	return s.Next(after)
}
