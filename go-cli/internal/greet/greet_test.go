package greet

import "testing"

func TestHello(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "greet World",
			input:    "World",
			expected: "Hello, World!",
		},
		{
			name:     "greet Alice",
			input:    "Alice",
			expected: "Hello, Alice!",
		},
		{
			name:     "greet empty string",
			input:    "",
			expected: "Hello, !",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Hello(tt.input)
			if result != tt.expected {
				t.Errorf("Hello(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestGoodbye(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "farewell World",
			input:    "World",
			expected: "Goodbye, World!",
		},
		{
			name:     "farewell Bob",
			input:    "Bob",
			expected: "Goodbye, Bob!",
		},
		{
			name:     "farewell empty string",
			input:    "",
			expected: "Goodbye, !",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Goodbye(tt.input)
			if result != tt.expected {
				t.Errorf("Goodbye(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
