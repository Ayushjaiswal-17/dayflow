package utils

import (
	"testing"
)

func TestPasswordHashing(t *testing.T) {
	password := "SecretPass123!"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if !CheckPasswordHash(password, hash) {
		t.Errorf("expected password match, got mismatch")
	}

	if CheckPasswordHash("WrongPass456!", hash) {
		t.Errorf("expected password mismatch for incorrect password, got match")
	}
}

func TestGenerateRandomPassword(t *testing.T) {
	pass := GenerateRandomPassword()
	if len(pass) < 8 {
		t.Errorf("expected random password length >= 8, got %d", len(pass))
	}
}
