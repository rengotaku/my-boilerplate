// Package execx provides utility functions for executing external commands
// with context timeout, process group cleanup, and stdout/stderr capture.
package execx

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"time"
)

// ErrTimeout indicates that the command execution timed out.
var ErrTimeout = errors.New("command timed out")

// Options specifies execution parameters for a command.
type Options struct {
	Command string
	Args    []string
	Dir     string
	Env     []string
	Timeout time.Duration
}

// Result holds the execution outcome.
type Result struct {
	Stdout   string
	Stderr   string
	ExitCode int
	TimedOut bool
}

// Run executes a command with context timeout, process group termination, and separate stdout/stderr capture.
func Run(ctx context.Context, opts Options) (Result, error) {
	if ctx == nil {
		ctx = context.Background()
	}

	var cancel context.CancelFunc = func() {}
	if opts.Timeout > 0 {
		ctx, cancel = context.WithTimeout(ctx, opts.Timeout)
	}
	defer cancel()

	cmd := exec.CommandContext(ctx, opts.Command, opts.Args...)
	if opts.Dir != "" {
		cmd.Dir = opts.Dir
	}
	if len(opts.Env) > 0 {
		cmd.Env = opts.Env
	}

	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf

	// Ensure process group isolation so children/grandchildren are cleaned up on cancellation
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		return killGroup(cmd.Process)
	}
	cmd.WaitDelay = 2 * time.Second

	err := cmd.Run()

	res := Result{
		Stdout: stdoutBuf.String(),
		Stderr: stderrBuf.String(),
	}

	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		res.TimedOut = true
		res.ExitCode = -1
		return res, fmt.Errorf("%w: %v", ErrTimeout, ctx.Err())
	}

	if err == nil {
		res.ExitCode = 0
		return res, nil
	}

	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		res.ExitCode = exitErr.ExitCode()
		return res, fmt.Errorf("command failed with exit code %d: %w", res.ExitCode, err)
	}

	return res, err
}

// killGroup sends SIGKILL to the process group (Setpgid gave child its own group).
func killGroup(p *os.Process) error {
	if p == nil {
		return os.ErrProcessDone
	}
	if err := syscall.Kill(-p.Pid, syscall.SIGKILL); err != nil && !errors.Is(err, syscall.ESRCH) {
		return err
	}
	return nil
}
