package utils

import (
	"errors"
	"fmt"
	"time"

	"dayflow/internal/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTClaims struct {
	EmployeeID        uuid.UUID       `json:"employee_id"`
	CompanyID         uuid.UUID       `json:"company_id"`
	Role              domain.UserRole `json:"role"`
	LoginID           string          `json:"login_id"`
	Email             string          `json:"email"`
	MustResetPassword bool            `json:"must_reset_password"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a signed JWT token with employee claims
func GenerateJWT(secret string, expiryHours int, emp *domain.Employee) (string, error) {
	if expiryHours <= 0 {
		expiryHours = 72
	}

	claims := JWTClaims{
		EmployeeID:        emp.ID,
		CompanyID:         emp.CompanyID,
		Role:              emp.Role,
		LoginID:           emp.LoginID,
		Email:             emp.Email,
		MustResetPassword: emp.MustResetPassword,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "dayflow-hrms",
			Subject:   emp.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return signedToken, nil
}

// ValidateJWT verifies and extracts claims from a JWT string
func ValidateJWT(secret, tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
