package handler

import (
	"net/http"

	"dayflow/internal/domain"
	"dayflow/internal/middleware"
	"dayflow/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SalaryHandler struct {
	salaryService *service.SalaryService
}

func NewSalaryHandler(salaryService *service.SalaryService) *SalaryHandler {
	return &SalaryHandler{salaryService: salaryService}
}

func (h *SalaryHandler) GetMySalary(c *gin.Context) {
	employeeID, ok := middleware.GetAuthEmployeeID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	structure, err := h.salaryService.GetMySalary(c.Request.Context(), employeeID)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, structure)
}

func (h *SalaryHandler) GetEmployeeSalary(c *gin.Context) {
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	structure, err := h.salaryService.GetEmployeeSalary(c.Request.Context(), targetID)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, structure)
}

func (h *SalaryHandler) CalculatePreview(c *gin.Context) {
	var req domain.SalaryPreviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	preview, err := h.salaryService.CalculatePreview(&req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, preview)
}

func (h *SalaryHandler) UpsertSalaryStructure(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	var req domain.UpsertSalaryStructureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	structure, err := h.salaryService.UpsertSalaryStructure(c.Request.Context(), actorID, targetID, &req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, structure)
}
