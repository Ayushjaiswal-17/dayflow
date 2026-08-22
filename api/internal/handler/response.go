package handler

import (
	"errors"
	"net/http"

	"dayflow/internal/domain"
	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func RespondSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	})
}

func RespondCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
	})
}

func RespondMessage(c *gin.Context, message string) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: message,
	})
}

func RespondError(c *gin.Context, statusCode int, err string, message string) {
	c.JSON(statusCode, APIResponse{
		Success: false,
		Error:   err,
		Message: message,
	})
}

func HandleDomainError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	switch {
	case errors.Is(err, domain.ErrNotFound):
		RespondError(c, http.StatusNotFound, "not_found", err.Error())
	case errors.Is(err, domain.ErrUnauthorized), errors.Is(err, domain.ErrInvalidCredentials):
		RespondError(c, http.StatusUnauthorized, "unauthorized", err.Error())
	case errors.Is(err, domain.ErrForbidden):
		RespondError(c, http.StatusForbidden, "forbidden", err.Error())
	case errors.Is(err, domain.ErrEmailExists), errors.Is(err, domain.ErrCompanyExists):
		RespondError(c, http.StatusConflict, "conflict", err.Error())
	case errors.Is(err, domain.ErrAlreadyCheckedIn), errors.Is(err, domain.ErrNotCheckedIn),
		errors.Is(err, domain.ErrAlreadyCheckedOut), errors.Is(err, domain.ErrRequestAlreadyProcessed),
		errors.Is(err, domain.ErrInvalidDateRange), errors.Is(err, domain.ErrSalaryComponentExceeded):
		RespondError(c, http.StatusBadRequest, "bad_request", err.Error())
	default:
		RespondError(c, http.StatusInternalServerError, "internal_error", err.Error())
	}
}
