// Package fakebin provides testing utilities to generate executable fake shell scripts
// in a temporary directory and optionally prepend them to PATH.
package fakebin

import (
	"os"
	"path/filepath"
	"testing"
)

// Create creates an executable shell script with the given name and content in a temp directory,
// returning the absolute path to the generated script binary.
func Create(t testing.TB, name, script string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, name)
	if err := os.WriteFile(path, []byte(script), 0o755); err != nil {
		t.Fatalf("fakebin: failed to write script at %s: %v", path, err)
	}
	return path
}

// CreateInPATH creates an executable shell script with the given name and content in a temp directory
// and prepends that directory to the process's PATH environment variable for the duration of the test.
func CreateInPATH(t testing.TB, name, script string) string {
	t.Helper()
	path := Create(t, name, script)
	dir := filepath.Dir(path)
	currentPATH := os.Getenv("PATH")
	newPATH := dir
	if currentPATH != "" {
		newPATH = dir + string(os.PathListSeparator) + currentPATH
	}
	t.Setenv("PATH", newPATH)
	return path
}
