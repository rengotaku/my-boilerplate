// Package fallback provides mechanism to try multiple candidate configurations
// or models sequentially, advancing to the next candidate only on retryable errors.
package fallback

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"mycli/internal/execx"
	"mycli/internal/logscan"
)

// AttemptResult holds the outcome of running a single candidate attempt.
type AttemptResult struct {
	Candidate string
	Result    execx.Result
	Error     error
	Retryable bool
}

// Result holds the overall outcome of the fallback execution chain.
type Result struct {
	SuccessfulCandidate string
	FinalResult         execx.Result
	Attempts            []AttemptResult
}

// ErrAllCandidatesFailed is returned when all candidate attempts have failed.
var ErrAllCandidatesFailed = errors.New("all candidates failed")

// RunnerFunc defines the signature for running a candidate.
type RunnerFunc func(ctx context.Context, candidate string) (execx.Result, error)

// Execute runs the candidate list in order. If an attempt fails with a retryable
// error (rate-limit signature detected or timeout), it proceeds to the next candidate.
// If an attempt fails with a non-retryable (permanent) error, execution halts immediately.
func Execute(ctx context.Context, candidates []string, run RunnerFunc) (Result, error) {
	var res Result
	if len(candidates) == 0 {
		return res, fmt.Errorf("no candidates provided")
	}

	for _, cand := range candidates {
		execRes, err := run(ctx, cand)

		retryable := false
		if err != nil {
			combined := execRes.Stdout + "\n" + execRes.Stderr + "\n" + err.Error()
			if execRes.TimedOut || logscan.Detect(combined) {
				retryable = true
			}
		}

		attempt := AttemptResult{
			Candidate: cand,
			Result:    execRes,
			Error:     err,
			Retryable: retryable,
		}
		res.Attempts = append(res.Attempts, attempt)

		if err == nil {
			res.SuccessfulCandidate = cand
			res.FinalResult = execRes
			return res, nil
		}

		if !retryable {
			res.FinalResult = execRes
			return res, err
		}
	}

	var errMsgs []string
	for _, a := range res.Attempts {
		errMsgs = append(errMsgs, fmt.Sprintf("%s: %v", a.Candidate, a.Error))
	}
	return res, fmt.Errorf("%w: %s", ErrAllCandidatesFailed, strings.Join(errMsgs, "; "))
}
