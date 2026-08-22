package handler

import (
	"net/http"
	"time"

	"dayflow/internal/domain"
	"dayflow/internal/middleware"
	"dayflow/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AttendanceHandler struct {
	attendanceService *service.AttendanceService
}

func NewAttendanceHandler(attendanceService *service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{attendanceService: attendanceService}
}

func (h *AttendanceHandler) CheckIn(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	var req domain.CheckInRequest
	_ = c.ShouldBindJSON(&req)

	rec, err := h.attendanceService.CheckIn(c.Request.Context(), employeeID, req.WorkDate)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, rec)
}

func (h *AttendanceHandler) CheckOut(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	var req domain.CheckOutRequest
	_ = c.ShouldBindJSON(&req)

	rec, err := h.attendanceService.CheckOut(c.Request.Context(), employeeID, req.WorkDate)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, rec)
}

func (h *AttendanceHandler) GetMyAttendance(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	var startDate, endDate *time.Time
	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = &t
		}
	}
	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = &t
		}
	}

	records, err := h.attendanceService.GetMyAttendance(c.Request.Context(), employeeID, startDate, endDate)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, records)
}

func (h *AttendanceHandler) ListAll(c *gin.Context) {
	companyID, ok := middleware.GetAuthCompanyID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	var filter domain.AttendanceFilter
	if empIDStr := c.Query("employee_id"); empIDStr != "" {
		if id, err := uuid.Parse(empIDStr); err == nil {
			filter.EmployeeID = &id
		}
	}
	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			filter.StartDate = &t
		}
	}
	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			filter.EndDate = &t
		}
	}
	if st := c.Query("status"); st != "" {
		filter.Status = &st
	}

	records, err := h.attendanceService.ListAll(c.Request.Context(), companyID, filter)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, records)
}

func (h *AttendanceHandler) GetSummary(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	// If employee_id query param is given and requester is Admin/HR, allow checking other's summary
	if empIDStr := c.Query("employee_id"); empIDStr != "" {
		role, _ := middleware.GetAuthRole(c)
		if role == domain.RoleAdmin || role == domain.RoleHROfficer {
			if id, err := uuid.Parse(empIDStr); err == nil {
				employeeID = id
			}
		}
	}

	var startDate, endDate *time.Time
	if s := c.Query("start_date"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			startDate = &t
		}
	}
	if e := c.Query("end_date"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			endDate = &t
		}
	}

	summary, err := h.attendanceService.GetSummary(c.Request.Context(), employeeID, startDate, endDate)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, summary)
}
