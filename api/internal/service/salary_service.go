package service

import (
	"context"
	"time"

	"dayflow/internal/domain"
	"dayflow/internal/repository"
	"dayflow/internal/utils"
	"github.com/google/uuid"
)

type SalaryService struct {
	salaryRepo *repository.SalaryRepository
	auditRepo  *repository.AuditRepository
}

func NewSalaryService(
	salaryRepo *repository.SalaryRepository,
	auditRepo *repository.AuditRepository,
) *SalaryService {
	return &SalaryService{
		salaryRepo: salaryRepo,
		auditRepo:  auditRepo,
	}
}

func (s *SalaryService) GetMySalary(ctx context.Context, employeeID uuid.UUID) (*domain.SalaryStructure, error) {
	return s.salaryRepo.GetCurrentByEmployeeID(ctx, employeeID)
}

func (s *SalaryService) GetEmployeeSalary(ctx context.Context, targetEmployeeID uuid.UUID) (*domain.SalaryStructure, error) {
	return s.salaryRepo.GetCurrentByEmployeeID(ctx, targetEmployeeID)
}

func (s *SalaryService) CalculatePreview(req *domain.SalaryPreviewRequest) (*domain.SalaryPreviewResponse, error) {
	return utils.CalculateSalaryBreakdown(req.WageAmount, req.Components)
}

func (s *SalaryService) UpsertSalaryStructure(
	ctx context.Context,
	actorID, targetEmployeeID uuid.UUID,
	req *domain.UpsertSalaryStructureRequest,
) (*domain.SalaryStructure, error) {
	// 1. Dynamically compute all component values and validate that earnings do not exceed wage
	preview, err := utils.CalculateSalaryBreakdown(req.WageAmount, req.Components)
	if err != nil {
		return nil, err
	}

	effectiveFrom := time.Now()
	if req.EffectiveFrom != nil {
		effectiveFrom = *req.EffectiveFrom
	}

	// 2. Persist structure and components atomically inside a database transaction
	structure, err := s.salaryRepo.UpsertStructure(
		ctx,
		targetEmployeeID,
		req.WageType,
		req.WageAmount,
		req.WorkingDaysPerWeek,
		req.WorkingHoursPerDay,
		effectiveFrom,
		preview.Components,
	)
	if err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &actorID, "salary.upsert_structure", "salary_structures", &structure.ID, map[string]interface{}{
		"target_employee_id": targetEmployeeID,
		"wage_amount":        req.WageAmount,
		"wage_type":          string(req.WageType),
	})

	return structure, nil
}
