// Package greet provides greeting functionality.
package greet

import "fmt"

// Hello returns a greeting message for the given name.
func Hello(name string) string {
	return fmt.Sprintf("Hello, %s!", name)
}

// Goodbye returns a farewell message for the given name.
func Goodbye(name string) string {
	return fmt.Sprintf("Goodbye, %s!", name)
}
