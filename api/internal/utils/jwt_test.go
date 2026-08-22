package utils

import (
	"testing"
	"time"

	"dayflow/internal/domain"
	"github.com/google/uuid"
)

func TestJWTGenerationAndValidation(t *testing.T) {
	secret := "test-secret-dayflow-12345"
	empID := uuid.New()
	compID := uuid.New()

	emp := &domain.Employee{
		ID:                empID,
		CompanyID:         compID,
		Role:              domain.RoleAdmin,
		LoginID:           "DFJD20250001",
		Email:             "john.doe@example.com",
		MustResetPassword: false,
		DateOfJoining:     time.Now(),
	}

	token, err := GenerateJWT(secret, 24, emp)
	if err != nil {
		t.Fatalf("failed to generate JWT: %v", err)
	}

	claims, err := ValidateJWT(secret, token)
	if err != nil {
		t.Fatalf("failed to validate valid JWT: %v", err)
	}

	if claims.EmployeeID != empID {
		t.Errorf("expected employee ID %v, got %v", empID, claims.EmployeeID)
	}
	if claims.Role != domain.RoleAdmin {
		t.Errorf("expected role admin, got %v", claims.Role)
	}
	if claims.LoginID != "DFJD20250001" {
		t.Errorf("expected login_id DFJD20250001, got %v", claims.LoginID)
	}

	// Test invalid secret
	_, err = ValidateJWT("wrong-secret-key", token)
	if err == nil {
		t.Errorf("expected error when validating with wrong secret, got nil")
	}
}
