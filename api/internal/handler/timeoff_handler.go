package handler

import (
	"net/http"
	"strconv"
	"time"

	"dayflow/internal/domain"
	"dayflow/internal/middleware"
	"dayflow/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type TimeOffHandler struct {
	timeOffService *service.TimeOffService
}

func NewTimeOffHandler(timeOffService *service.TimeOffService) *TimeOffHandler {
	return &TimeOffHandler{timeOffService: timeOffService}
}

func (h *TimeOffHandler) GetTypes(c *gin.Context) {
	companyID, ok := middleware.GetAuthCompanyID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	types, err := h.timeOffService.GetTypes(c.Request.Context(), companyID)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, types)
}

func (h *TimeOffHandler) GetAllocations(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	// If employee_id query param is given and requester is Admin/HR, allow checking other's allocations
	if empIDStr := c.Query("employee_id"); empIDStr != "" {
		role, _ := middleware.GetAuthRole(c)
		if role == domain.RoleAdmin || role == domain.RoleHROfficer {
			if id, err := uuid.Parse(empIDStr); err == nil {
				employeeID = id
			}
		}
	}

	year := time.Now().Year()
	if yStr := c.Query("year"); yStr != "" {
		if y, err := strconv.Atoi(yStr); err == nil && y > 0 {
			year = y
		}
	}

	allocations, err := h.timeOffService.GetAllocations(c.Request.Context(), employeeID, year)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, allocations)
}

func (h *TimeOffHandler) CreateRequest(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	var req domain.CreateLeaveRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	created, err := h.timeOffService.ApplyForLeave(c.Request.Context(), employeeID, &req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondCreated(c, created)
}

func (h *TimeOffHandler) ListRequests(c *gin.Context) {
	companyID, ok := middleware.GetAuthCompanyID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	role, _ := middleware.GetAuthRole(c)
	var employeeIDFilter *uuid.UUID

	if role == domain.RoleEmployee {
		// Employees can only view their own requests
		empID, _ := middleware.GetAuthEmployeeID(c)
		employeeIDFilter = &empID
	} else {
		// Admin/HR can view all or filter by specific employee
		if empIDStr := c.Query("employee_id"); empIDStr != "" {
			if id, err := uuid.Parse(empIDStr); err == nil {
				employeeIDFilter = &id
			}
		}
	}

	var statusFilter *string
	if st := c.Query("status"); st != "" {
		statusFilter = &st
	}

	requests, err := h.timeOffService.ListRequests(c.Request.Context(), companyID, employeeIDFilter, statusFilter)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, requests)
}

func (h *TimeOffHandler) ReviewRequest(c *gin.Context) {
	reviewerID, _ := middleware.GetAuthEmployeeID(c)
	requestID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid leave request ID format")
		return
	}

	var req domain.ReviewLeaveRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	reviewed, err := h.timeOffService.ReviewRequest(c.Request.Context(), reviewerID, requestID, &req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, reviewed)
}

func (h *TimeOffHandler) UpsertAllocation(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)

	var req domain.UpsertAllocationDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	if err := h.timeOffService.UpsertAllocation(c.Request.Context(), actorID, &req); err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondMessage(c, "Leave allocation updated successfully")
}
