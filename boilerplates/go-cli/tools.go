//go:build tools

// Package tools pins test-only dependencies so go mod tidy does not remove them.
// This file is excluded from normal builds by the "tools" build tag.
package tools

import (
	_ "github.com/stretchr/testify/assert"
	_ "github.com/stretchr/testify/require"
)
