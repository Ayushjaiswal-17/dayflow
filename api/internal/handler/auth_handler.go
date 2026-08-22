package handler

import (
	"net/http"

	"dayflow/internal/domain"
	"dayflow/internal/middleware"
	"dayflow/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) SignUpCompany(c *gin.Context) {
	var req domain.SignUpCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	res, err := h.authService.SignUpCompany(c.Request.Context(), &req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondCreated(c, res)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	res, err := h.authService.Login(c.Request.Context(), &req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, res)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	var req domain.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	if err := h.authService.ChangePassword(c.Request.Context(), employeeID, &req); err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondMessage(c, "Password changed successfully")
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	emp, err := h.authService.GetMe(c.Request.Context(), employeeID)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, emp)
}
