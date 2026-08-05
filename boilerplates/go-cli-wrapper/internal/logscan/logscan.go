// Package logscan provides utilities to detect rate-limit signatures
// and parse reset wait times from output logs.
package logscan

import (
	"regexp"
	"strconv"
	"time"
)

// sigRe matches rate-limit / quota / capacity / 429 error signatures in text.
var sigRe = regexp.MustCompile(`(?i)(429\s+too\s+many|error.*429|429\s+error|overloaded|rate.?limit|resource_exhausted|quota|capacity)`)

// resetRe captures reset duration hints such as "Resets in 2h 30m" or "Quota reset in 45m".
var resetRe = regexp.MustCompile(`(?i)(?:resets?|quota reset)\s+(?:in\s+)?(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?`)

// Detect reports whether text contains a rate-limit or quota/capacity signature.
func Detect(text string) bool {
	return sigRe.MatchString(text)
}

// ParseResetWait parses quota reset wait duration from text.
// Returns the duration and true if found and non-zero, false otherwise.
func ParseResetWait(text string) (time.Duration, bool) {
	matches := resetRe.FindAllStringSubmatch(text, -1)
	if len(matches) == 0 {
		return 0, false
	}

	for i := len(matches) - 1; i >= 0; i-- {
		m := matches[i]
		h := parseNum(m[1])
		mins := parseNum(m[2])
		sec := parseNum(m[3])

		if h > 0 || mins > 0 || sec > 0 {
			d := time.Duration(h)*time.Hour + time.Duration(mins)*time.Minute + time.Duration(sec)*time.Second
			return d, true
		}
	}

	return 0, false
}

func parseNum(s string) int {
	if s == "" {
		return 0
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}
