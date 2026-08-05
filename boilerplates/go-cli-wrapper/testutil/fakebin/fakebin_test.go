package fakebin

import (
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreate(t *testing.T) {
	script := "#!/bin/sh\necho 'hello fake'\n"
	binPath := Create(t, "myfake", script)

	assert.True(t, filepath.IsAbs(binPath))
	assert.Equal(t, "myfake", filepath.Base(binPath))

	cmd := exec.Command(binPath)
	out, err := cmd.Output()
	require.NoError(t, err)
	assert.Equal(t, "hello fake", strings.TrimSpace(string(out)))
}

func TestCreateInPATH(t *testing.T) {
	script := "#!/bin/sh\necho 'hello from path'\n"
	binName := "custom-fake-tool"
	binPath := CreateInPATH(t, binName, script)

	foundPath, err := exec.LookPath(binName)
	require.NoError(t, err)
	assert.Equal(t, binPath, foundPath)

	cmd := exec.Command(binName)
	out, err := cmd.Output()
	require.NoError(t, err)
	assert.Equal(t, "hello from path", strings.TrimSpace(string(out)))
}
