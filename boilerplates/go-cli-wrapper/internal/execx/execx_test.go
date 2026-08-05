package execx_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"mycli/internal/execx"
	"mycli/testutil/fakebin"
)

// E1 timeout kill — 前提: fakebin で sleep する fake コマンド、timeout 200ms。
// 手順: execx.Run。期待: deadline 超過で 1 秒以内に返り、timeout を示すエラー種別が判別できる。
// 観点: ハングした外部 CLI の無限待ち防止
func TestE1_TimeoutKill(t *testing.T) {
	script := `#!/bin/sh
sleep 10
`
	binPath := fakebin.Create(t, "slowbin", script)

	start := time.Now()
	ctx := context.Background()
	opts := execx.Options{
		Command: binPath,
		Timeout: 200 * time.Millisecond,
	}

	res, err := execx.Run(ctx, &opts)
	elapsed := time.Since(start)

	assert.Less(t, elapsed, 1*time.Second, "should finish within 1 second")
	require.Error(t, err)
	assert.True(t, errors.Is(err, execx.ErrTimeout) || res.TimedOut, "should indicate timeout error type")
}

// E2 正常実行 — 前提: stdout/stderr に別内容を出す fake。
// 手順: Run。期待: exit 0、stdout/stderr が分離して取得できる。
// 観点: 出力チャネルの混線検知
func TestE2_NormalExecution(t *testing.T) {
	script := `#!/bin/sh
echo "out content"
echo "err content" >&2
exit 0
`
	binPath := fakebin.Create(t, "separatebin", script)

	ctx := context.Background()
	opts := execx.Options{
		Command: binPath,
		Timeout: 5 * time.Second,
	}

	res, err := execx.Run(ctx, &opts)
	require.NoError(t, err)
	assert.Equal(t, 0, res.ExitCode)
	assert.Contains(t, res.Stdout, "out content")
	assert.Contains(t, res.Stderr, "err content")
	assert.NotContains(t, res.Stdout, "err content")
	assert.NotContains(t, res.Stderr, "out content")
}

// E3 非ゼロ exit — 前提: exit 3 する fake。
// 手順: Run。期待: exit code 3 が取得でき、エラー扱いになる。
// 観点: exit code の透過性
func TestE3_NonZeroExit(t *testing.T) {
	script := `#!/bin/sh
echo "error occurred" >&2
exit 3
`
	binPath := fakebin.Create(t, "exit3bin", script)

	ctx := context.Background()
	opts := execx.Options{
		Command: binPath,
		Timeout: 5 * time.Second,
	}

	res, err := execx.Run(ctx, &opts)
	require.Error(t, err)
	assert.Equal(t, 3, res.ExitCode)
}

// Additional test: Parent context cancellation triggers kill
func TestRun_ParentContextCancel(t *testing.T) {
	script := `#!/bin/sh
sleep 10
`
	binPath := fakebin.Create(t, "slowbin2", script)

	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		time.Sleep(100 * time.Millisecond)
		cancel()
	}()

	opts := execx.Options{
		Command: binPath,
	}

	start := time.Now()
	_, err := execx.Run(ctx, &opts)
	elapsed := time.Since(start)

	assert.Less(t, elapsed, 1*time.Second)
	require.Error(t, err)
}

// Additional test: Directory and Environment Variables passing
func TestRun_DirAndEnv(t *testing.T) {
	script := `#!/bin/sh
echo "PWD=$(pwd)"
echo "MYVAR=$MYVAR"
`
	binPath := fakebin.Create(t, "envbin", script)
	tmpDir := t.TempDir()

	opts := execx.Options{
		Command: binPath,
		Dir:     tmpDir,
		Env:     []string{"MYVAR=custom_val"},
		Timeout: 5 * time.Second,
	}

	res, err := execx.Run(context.Background(), &opts)
	require.NoError(t, err)
	assert.Contains(t, res.Stdout, "PWD="+tmpDir)
	assert.Contains(t, res.Stdout, "MYVAR=custom_val")
}

// Additional test: a launch failure (command not found) is not a *exec.ExitError,
// so it must not be reported as ExitCode 0 (which would look like success).
func TestRun_CommandNotFound_ExitCodeIsNegativeOne(t *testing.T) {
	opts := execx.Options{
		Command: "mycli-execx-definitely-does-not-exist",
		Timeout: 5 * time.Second,
	}

	res, err := execx.Run(context.Background(), &opts)

	require.Error(t, err)
	assert.Equal(t, -1, res.ExitCode)
}
