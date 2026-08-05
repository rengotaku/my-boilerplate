package logscan_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"mycli/internal/logscan"
)

// L1 シグネチャ検出 — 前提: 「Error: 429 Too Many Requests」「rate limit exceeded」「capacity」を含むテキスト / 含まない正常テキスト。
// 手順: logscan.Detect。期待: 前者は検出 true、後者は false。
// 観点: リトライ分類の誤検知・見逃し
func TestL1_Detect(t *testing.T) {
	positiveCases := []string{
		"Error: 429 Too Many Requests",
		"rate limit exceeded for model gpt-4",
		"Selected model is at capacity",
		"Quota exceeded, please try again later",
		"resource_exhausted: quota limit hit",
		"overloaded: server busy",
	}

	negativeCases := []string{
		"Successfully processed 429 items",
		"Operation completed successfully",
		"Syntax error on line 10",
		"File not found: /path/to/file",
	}

	for _, text := range positiveCases {
		assert.True(t, logscan.Detect(text), "should detect rate limit signature in: %q", text)
	}

	for _, text := range negativeCases {
		assert.False(t, logscan.Detect(text), "should NOT detect rate limit signature in: %q", text)
	}
}

// L2 リセット時間パース — 前提: 「Resets in 2h 30m」相当の文字列。
// 手順: パース。期待: 対応する time.Duration が返る。パース不能なら ok=false。
// 観点: 待機時間の誤算出
func TestL2_ParseResetWait(t *testing.T) {
	t.Run("valid reset strings", func(t *testing.T) {
		d, ok := logscan.ParseResetWait("Resets in 2h 30m")
		assert.True(t, ok)
		assert.Equal(t, 2*time.Hour+30*time.Minute, d)

		d2, ok2 := logscan.ParseResetWait("Resets in 1h 15m 30s")
		assert.True(t, ok2)
		assert.Equal(t, 1*time.Hour+15*time.Minute+30*time.Second, d2)

		d3, ok3 := logscan.ParseResetWait("Quota reset in 45m")
		assert.True(t, ok3)
		assert.Equal(t, 45*time.Minute, d3)
	})

	t.Run("invalid reset strings", func(t *testing.T) {
		_, ok := logscan.ParseResetWait("No reset info here")
		assert.False(t, ok)

		_, ok2 := logscan.ParseResetWait("Resets in invalid format")
		assert.False(t, ok2)
	})
}

// Additional test: ParseResetWait handles multiline or trailing spaces
func TestParseResetWait_Multiline(t *testing.T) {
	text := "Some log before\nError: rate limited. Resets in 3h 10m 5s\nSome log after"
	d, ok := logscan.ParseResetWait(text)
	assert.True(t, ok)
	assert.Equal(t, 3*time.Hour+10*time.Minute+5*time.Second, d)
}
