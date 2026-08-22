package utils

import (
	"testing"
	"time"
)

func TestGenerateLoginID(t *testing.T) {
	joiningDate := time.Date(2025, time.January, 15, 0, 0, 0, 0, time.UTC)
	
	// Test case from spec: Company "OE", David Owens, Year 2025, Serial 1 -> OEDO20250001
	loginID := GenerateLoginID("OE", "David", "Owens", joiningDate, 1)
	expected := "OEDO20250001"
	if loginID != expected {
		t.Errorf("expected %s, got %s", expected, loginID)
	}

	// Serial 42
	loginID2 := GenerateLoginID("df", "Alice", "Smith", joiningDate, 42)
	expected2 := "DFAS20250042"
	if loginID2 != expected2 {
		t.Errorf("expected %s, got %s", expected2, loginID2)
	}

	// Single name fallback
	loginID3 := GenerateLoginID("ACME", "Cher", "", joiningDate, 5)
	expected3 := "ACMECH20250005"
	if loginID3 != expected3 {
		t.Errorf("expected %s, got %s", expected3, loginID3)
	}
}
