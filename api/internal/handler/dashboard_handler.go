package handler

import (
	"net/http"

	"dayflow/internal/middleware"
	"dayflow/internal/service"
	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardService *service.DashboardService
}

func NewDashboardHandler(dashboardService *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	companyID, ok := middleware.GetAuthCompanyID(c)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	stats, err := h.dashboardService.GetStats(c.Request.Context(), companyID)
	if err != nil {
		HandleDomainError(c, err)
		return
	}

	RespondSuccess(c, stats)
}
