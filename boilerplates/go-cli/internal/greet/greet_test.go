package greet_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"mycli/internal/greet"
)

func TestHello(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "greet World", input: "World", expected: "Hello, World!"},
		{name: "greet Alice", input: "Alice", expected: "Hello, Alice!"},
		{name: "greet empty string", input: "", expected: "Hello, !"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, greet.Hello(tt.input))
		})
	}
}

func TestGoodbye(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "farewell World", input: "World", expected: "Goodbye, World!"},
		{name: "farewell Bob", input: "Bob", expected: "Goodbye, Bob!"},
		{name: "farewell empty string", input: "", expected: "Goodbye, !"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, greet.Goodbye(tt.input))
		})
	}
}
