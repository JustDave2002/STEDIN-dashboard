package adder

import "testing"

func TestAdd(t *testing.T) {
	sum := Add(2, 3)
	expected := 5
	if sum != expected {
		t.Errorf("Add(2, 3) = %d; want %d", sum, expected)
	}
}

func TestAddNegative(t *testing.T) {
	sum := Add(-1, -1)
	expected := -2
	if sum != expected {
		t.Errorf("Add(-1, -1) = %d; want %d", sum, expected)
	}
}
