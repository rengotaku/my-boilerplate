package worker

import (
	"context"
	"testing"
	"time"
)

func TestDaemon_Run_StopsOnContextCancel(t *testing.T) {
	d := New(10 * time.Millisecond)
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan error, 1)
	go func() { done <- d.Run(ctx) }()

	// Let it tick at least once, then cancel.
	time.Sleep(25 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err != nil {
			t.Errorf("Run() = %v, want nil", err)
		}
	case <-time.After(time.Second):
		t.Fatal("Run() did not return after context cancel")
	}
}
