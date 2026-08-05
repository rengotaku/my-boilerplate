package fallback_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"mycli/internal/execx"
	"mycli/internal/fallback"
	"mycli/testutil/fakebin"
)

// F1 fallback 成功 — 前提: 候補 A=rate-limit 出力で失敗する fake、候補 B=成功する fake。
// 手順: fallback 実行。期待: B の結果が返り、使用候補が B と報告される。試行は A→B の 2 回。
// 観点: フォールバック連鎖の動作
func TestF1_FallbackSuccess(t *testing.T) {
	scriptA := `#!/bin/sh
echo "Error: 429 Too Many Requests" >&2
exit 1
`
	scriptB := `#!/bin/sh
echo "Success from model B"
exit 0
`
	binA := fakebin.Create(t, "fakeA", scriptA)
	binB := fakebin.Create(t, "fakeB", scriptB)

	candidates := []string{binA, binB}
	ctx := context.Background()

	res, err := fallback.Execute(ctx, candidates, func(cCtx context.Context, cand string) (execx.Result, error) {
		return execx.Run(cCtx, &execx.Options{Command: cand, Timeout: 5 * time.Second})
	})

	require.NoError(t, err)
	assert.Equal(t, binB, res.SuccessfulCandidate)
	assert.Contains(t, res.FinalResult.Stdout, "Success from model B")
	assert.Len(t, res.Attempts, 2)
	assert.Equal(t, binA, res.Attempts[0].Candidate)
	assert.True(t, res.Attempts[0].Retryable)
	assert.Equal(t, binB, res.Attempts[1].Candidate)
}

// F2 permanent は即断 — 前提: A が rate-limit ではない一般エラーで失敗。
// 手順: 同上。期待: B は試行されず A のエラーが返る。
// 観点: 無関係エラーでの候補浪費防止
func TestF2_PermanentErrorInstantStop(t *testing.T) {
	scriptA := `#!/bin/sh
echo "Fatal: Invalid syntax or missing file" >&2
exit 2
`
	scriptB := `#!/bin/sh
echo "Should not run"
exit 0
`
	binA := fakebin.Create(t, "fakeA_perm", scriptA)
	binB := fakebin.Create(t, "fakeB_perm", scriptB)

	candidates := []string{binA, binB}
	ctx := context.Background()

	res, err := fallback.Execute(ctx, candidates, func(cCtx context.Context, cand string) (execx.Result, error) {
		return execx.Run(cCtx, &execx.Options{Command: cand, Timeout: 5 * time.Second})
	})

	require.Error(t, err)
	assert.Len(t, res.Attempts, 1, "Candidate B should not be attempted")
	assert.Equal(t, binA, res.Attempts[0].Candidate)
	assert.False(t, res.Attempts[0].Retryable)
}

// F3 全滅 — 前提: A も B も rate-limit で失敗。
// 手順: 同上。期待: 全候補失敗を示すエラー（試行履歴を含む）。
// 観点: 全滅時の診断可能性
func TestF3_AllCandidatesFailed(t *testing.T) {
	scriptA := `#!/bin/sh
echo "Error: 429 Too Many Requests" >&2
exit 1
`
	scriptB := `#!/bin/sh
echo "Error: Selected model is at capacity" >&2
exit 1
`
	binA := fakebin.Create(t, "fakeA_fail", scriptA)
	binB := fakebin.Create(t, "fakeB_fail", scriptB)

	candidates := []string{binA, binB}
	ctx := context.Background()

	res, err := fallback.Execute(ctx, candidates, func(cCtx context.Context, cand string) (execx.Result, error) {
		return execx.Run(cCtx, &execx.Options{Command: cand, Timeout: 5 * time.Second})
	})

	require.Error(t, err)
	assert.True(t, errors.Is(err, fallback.ErrAllCandidatesFailed) || assert.Contains(t, err.Error(), "all candidates failed"))
	assert.Len(t, res.Attempts, 2)
	assert.True(t, res.Attempts[0].Retryable)
	assert.True(t, res.Attempts[1].Retryable)
}

// Additional test (builds on F3): when every candidate fails retryably,
// FinalResult must still carry the last attempt's output so callers (e.g.
// wrap's stderr forwarding) can surface diagnostics for the all-failed case,
// which is exactly when they matter most.
func TestExecute_AllCandidatesFailed_FinalResultHoldsLastAttempt(t *testing.T) {
	scriptA := `#!/bin/sh
echo "Error: 429 Too Many Requests" >&2
exit 1
`
	scriptB := `#!/bin/sh
echo "Error: Selected model is at capacity" >&2
exit 1
`
	binA := fakebin.Create(t, "fakeA_fail_final", scriptA)
	binB := fakebin.Create(t, "fakeB_fail_final", scriptB)

	candidates := []string{binA, binB}
	ctx := context.Background()

	res, err := fallback.Execute(ctx, candidates, func(cCtx context.Context, cand string) (execx.Result, error) {
		return execx.Run(cCtx, &execx.Options{Command: cand, Timeout: 5 * time.Second})
	})

	require.Error(t, err)
	require.Len(t, res.Attempts, 2)
	assert.Equal(t, res.Attempts[len(res.Attempts)-1].Result, res.FinalResult)
	assert.Contains(t, res.FinalResult.Stderr, "Selected model is at capacity")
}

// Additional test: Empty candidates error
func TestExecute_EmptyCandidates(t *testing.T) {
	_, err := fallback.Execute(context.Background(), nil, func(ctx context.Context, cand string) (execx.Result, error) {
		return execx.Result{}, nil
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no candidates provided")
}

// Additional test: Timeout is treated as retryable failure
func TestExecute_TimeoutIsRetryable(t *testing.T) {
	scriptA := `#!/bin/sh
sleep 10
`
	scriptB := `#!/bin/sh
echo "Success from B"
exit 0
`
	binA := fakebin.Create(t, "slowA", scriptA)
	binB := fakebin.Create(t, "fastB", scriptB)

	candidates := []string{binA, binB}
	res, err := fallback.Execute(context.Background(), candidates, func(cCtx context.Context, cand string) (execx.Result, error) {
		return execx.Run(cCtx, &execx.Options{Command: cand, Timeout: 200 * time.Millisecond})
	})

	require.NoError(t, err)
	assert.Equal(t, binB, res.SuccessfulCandidate)
	assert.Len(t, res.Attempts, 2)
	assert.True(t, res.Attempts[0].Retryable)
}
