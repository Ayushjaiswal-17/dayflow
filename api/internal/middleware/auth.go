package middleware

import (
	"net/http"
	"strings"

	"dayflow/internal/domain"
	"dayflow/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	CtxEmployeeID = "employee_id"
	CtxCompanyID  = "company_id"
	CtxRole       = "role"
	CtxLoginID    = "login_id"
	CtxEmail      = "email"
	CtxMustReset  = "must_reset_password"
)

// AuthMiddleware validates JWT Bearer tokens and sets context claims
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "missing authorization header",
				"message": "Authorization header with Bearer token is required",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid authorization header format",
				"message": "Bearer <token> format required",
			})
			return
		}

		claims, err := utils.ValidateJWT(jwtSecret, parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid or expired token",
				"message": err.Error(),
			})
			return
		}

		// Inject into Gin context
		c.Set(CtxEmployeeID, claims.EmployeeID)
		c.Set(CtxCompanyID, claims.CompanyID)
		c.Set(CtxRole, claims.Role)
		c.Set(CtxLoginID, claims.LoginID)
		c.Set(CtxEmail, claims.Email)
		c.Set(CtxMustReset, claims.MustResetPassword)

		c.Next()
	}
}

// Helpers for extracting claims from context in handlers
func GetAuthEmployeeID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get(CtxEmployeeID)
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

func GetAuthCompanyID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get(CtxCompanyID)
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

func GetAuthRole(c *gin.Context) (domain.UserRole, bool) {
	val, exists := c.Get(CtxRole)
	if !exists {
		return "", false
	}
	role, ok := val.(domain.UserRole)
	return role, ok
}
