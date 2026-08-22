package middleware

import (
	"net/http"

	"dayflow/internal/domain"
	"github.com/gin-gonic/gin"
)

// RequireRoles restricts route access to specified UserRoles
func RequireRoles(allowedRoles ...domain.UserRole) gin.HandlerFunc {
	allowedMap := make(map[domain.UserRole]bool, len(allowedRoles))
	for _, r := range allowedRoles {
		allowedMap[r] = true
	}

	return func(c *gin.Context) {
		role, exists := GetAuthRole(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "Authentication required",
			})
			return
		}

		if !allowedMap[role] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":   "forbidden",
				"message": "You do not have permission to perform this action",
			})
			return
		}

		c.Next()
	}
}

// RequireAdminOrHR is a convenience helper allowing Admin and HR Officer roles
func RequireAdminOrHR() gin.HandlerFunc {
	return RequireRoles(domain.RoleAdmin, domain.RoleHROfficer)
}

// RequireAdmin is a convenience helper allowing Admin role only
func RequireAdmin() gin.HandlerFunc {
	return RequireRoles(domain.RoleAdmin)
}
