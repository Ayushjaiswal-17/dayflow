package handler

import (
	"net/http"

	"dayflow/internal/domain"
	"dayflow/internal/middleware"
	"dayflow/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EmployeeHandler struct {
	employeeService *service.EmployeeService
}

func NewEmployeeHandler(employeeService *service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{employeeService: employeeService}
}

func (h *EmployeeHandler) List(c *gin.Context) {
	companyID, ok := middleware.GetAuthCompanyID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	dept := c.Query("department")
	status := c.Query("status")

	employees, err := h.employeeService.ListEmployees(c.Request.Context(), companyID, dept, status)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, employees)
}

func (h *EmployeeHandler) Create(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	companyID, ok := middleware.GetAuthCompanyID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	var req domain.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	res, err := h.employeeService.CreateEmployee(c.Request.Context(), actorID, companyID, &req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondCreated(c, res)
}

func (h *EmployeeHandler) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	targetID, err := uuid.Parse(idParam)
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	emp, err := h.employeeService.GetEmployeeByID(c.Request.Context(), targetID)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, emp)
}

func (h *EmployeeHandler) Update(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	actorRole, _ := middleware.GetAuthRole(c)

	idParam := c.Param("id")
	targetID, err := uuid.Parse(idParam)
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	var req domain.UpdateEmployeeProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	emp, err := h.employeeService.UpdateProfile(c.Request.Context(), actorID, targetID, actorRole, &req)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, emp)
}

func (h *EmployeeHandler) AddSkill(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	var req domain.AddSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	skill, err := h.employeeService.AddSkill(c.Request.Context(), actorID, targetID, req.Skill)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondCreated(c, skill)
}

func (h *EmployeeHandler) DeleteSkill(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	skillID, err := uuid.Parse(c.Param("skillId"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid skill ID format")
		return
	}

	if err := h.employeeService.DeleteSkill(c.Request.Context(), actorID, targetID, skillID); err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondMessage(c, "Skill deleted successfully")
}

func (h *EmployeeHandler) AddCertification(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	var req domain.AddCertificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	if err := h.employeeService.AddCertification(c.Request.Context(), actorID, targetID, &req); err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondMessage(c, "Certification added successfully")
}

func (h *EmployeeHandler) DeleteCertification(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	certID, err := uuid.Parse(c.Param("certId"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid certification ID format")
		return
	}

	if err := h.employeeService.DeleteCertification(c.Request.Context(), actorID, targetID, certID); err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondMessage(c, "Certification deleted successfully")
}

func (h *EmployeeHandler) AddDocument(c *gin.Context) {
	actorID, _ := middleware.GetAuthEmployeeID(c)
	targetID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID format")
		return
	}

	var req domain.AddDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	if err := h.employeeService.AddDocument(c.Request.Context(), actorID, targetID, &req); err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondMessage(c, "Document uploaded successfully")
}
