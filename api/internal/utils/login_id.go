package utils

import (
	"fmt"
	"strings"
	"time"
	"unicode"
)

// GenerateLoginID constructs a standard Dayflow Login ID:
// Format: [Company Code][Initials (2 letters: First of first name + First of last name)][Year of Joining][4-digit Serial]
// Example: Company "OE", "David Owens", Year 2025, Serial 1 => "OEDO20250001"
func GenerateLoginID(companyCode, firstName, lastName string, joiningDate time.Time, serialNumber int) string {
	cleanCompCode := cleanString(companyCode, 2, "DF")
	
	// First initial + Last initial
	fn := strings.TrimSpace(firstName)
	ln := strings.TrimSpace(lastName)

	var firstInitial byte = 'X'
	var lastInitial byte = 'X'

	if len(fn) > 0 {
		firstInitial = byte(unicode.ToUpper(rune(fn[0])))
	}
	if len(ln) > 0 {
		lastInitial = byte(unicode.ToUpper(rune(ln[0])))
	} else if len(fn) > 1 {
		lastInitial = byte(unicode.ToUpper(rune(fn[1])))
	}

	initials := fmt.Sprintf("%c%c", firstInitial, lastInitial)
	year := joiningDate.Year()
	if year <= 0 {
		year = time.Now().Year()
	}

	if serialNumber <= 0 {
		serialNumber = 1
	}

	return fmt.Sprintf("%s%s%04d%04d", strings.ToUpper(cleanCompCode), initials, year, serialNumber)
}

func cleanString(input string, defaultLen int, fallback string) string {
	var sb strings.Builder
	for _, r := range strings.TrimSpace(input) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			sb.WriteRune(unicode.ToUpper(r))
		}
	}
	res := sb.String()
	if len(res) == 0 {
		return fallback
	}
	return res
}
