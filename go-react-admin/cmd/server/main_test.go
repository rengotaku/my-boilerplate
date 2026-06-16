package main

import (
	"bytes"
	"context"
	"strings"
	"testing"
)

func TestRun_Version(t *testing.T) {
	version = "1.2.3"
	var out bytes.Buffer
	if err := run(context.Background(), []string{"--version"}, &out); err != nil {
		t.Fatalf("run(--version) error = %v", err)
	}
	if strings.TrimSpace(out.String()) != "1.2.3" {
		t.Errorf("output = %q, want 1.2.3", out.String())
	}
}

func TestRun_Config(t *testing.T) {
	t.Setenv("PORT", "7777")
	var out bytes.Buffer
	if err := run(context.Background(), []string{"--config"}, &out); err != nil {
		t.Fatalf("run(--config) error = %v", err)
	}
	if !strings.Contains(out.String(), `"port": "7777"`) {
		t.Errorf("config output = %q, want to contain port 7777", out.String())
	}
}

func TestRun_BadFlag(t *testing.T) {
	var out bytes.Buffer
	if err := run(context.Background(), []string{"--nope"}, &out); err == nil {
		t.Error("run(--nope) error = nil, want parse error")
	}
}
