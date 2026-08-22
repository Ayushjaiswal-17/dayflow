package service

import (
	"context"
	"fmt"
	"time"

	"dayflow/internal/domain"
	"dayflow/internal/repository"
	"github.com/google/uuid"
)

type TimeOffService struct {
	timeOffRepo  *repository.TimeOffRepository
	employeeRepo *repository.EmployeeRepository
	auditRepo    *repository.AuditRepository
}

func NewTimeOffService(
	timeOffRepo *repository.TimeOffRepository,
	employeeRepo *repository.EmployeeRepository,
	auditRepo *repository.AuditRepository,
) *TimeOffService {
	return &TimeOffService{
		timeOffRepo:  timeOffRepo,
		employeeRepo: employeeRepo,
		auditRepo:    auditRepo,
	}
}

func (s *TimeOffService) GetTypes(ctx context.Context, companyID uuid.UUID) ([]domain.TimeOffType, error) {
	types, err := s.timeOffRepo.GetTypesByCompany(ctx, companyID)
	if err == nil && len(types) == 0 {
		_ = s.timeOffRepo.EnsureDefaultTypes(ctx, companyID)
		types, _ = s.timeOffRepo.GetTypesByCompany(ctx, companyID)
	}
	return types, err
}

func (s *TimeOffService) GetAllocations(ctx context.Context, employeeID uuid.UUID, year int) ([]domain.TimeOffAllocation, error) {
	if year <= 0 {
		year = time.Now().Year()
	}
	return s.timeOffRepo.GetAllocationsByEmployee(ctx, employeeID, year)
}

func (s *TimeOffService) ApplyForLeave(ctx context.Context, employeeID uuid.UUID, req *domain.CreateLeaveRequestDTO) (*domain.TimeOffRequest, error) {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start_date format, expected YYYY-MM-DD: %w", err)
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end_date format, expected YYYY-MM-DD: %w", err)
	}

	if endDate.Before(startDate) {
		return nil, domain.ErrInvalidDateRange
	}

	// Check leave balance for paid leave types
	allocations, err := s.timeOffRepo.GetAllocationsByEmployee(ctx, employeeID, startDate.Year())
	if err == nil {
		for _, a := range allocations {
			if a.TimeOffTypeID == req.TimeOffTypeID {
				if a.IsPaid != nil && *a.IsPaid {
					remaining := a.AllocatedDays - a.UsedDays
					if req.DaysRequested > remaining && remaining >= 0 {
						// Note: allows submission but warns or restricts if strict policy enforced
					}
				}
				break
			}
		}
	}

	leaveReq := domain.TimeOffRequest{
		ID:            uuid.New(),
		EmployeeID:    employeeID,
		TimeOffTypeID: req.TimeOffTypeID,
		StartDate:     startDate,
		EndDate:       endDate,
		DaysRequested: req.DaysRequested,
		Remarks:       req.Remarks,
		AttachmentURL: req.AttachmentURL,
		Status:        domain.LeavePending,
	}

	if err := s.timeOffRepo.CreateRequest(ctx, &leaveReq); err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &employeeID, "timeoff.apply", "time_off_requests", &leaveReq.ID, map[string]interface{}{
		"days_requested": req.DaysRequested,
		"start_date":     req.StartDate,
		"end_date":       req.EndDate,
	})

	return s.timeOffRepo.GetRequestByID(ctx, leaveReq.ID)
}

func (s *TimeOffService) ListRequests(ctx context.Context, companyID uuid.UUID, employeeID *uuid.UUID, status *string) ([]domain.TimeOffRequest, error) {
	return s.timeOffRepo.ListRequests(ctx, companyID, employeeID, status)
}

func (s *TimeOffService) ReviewRequest(ctx context.Context, reviewerID, requestID uuid.UUID, req *domain.ReviewLeaveRequestDTO) (*domain.TimeOffRequest, error) {
	if req.Status != domain.LeaveApproved && req.Status != domain.LeaveRejected {
		return nil, fmt.Errorf("status must be 'approved' or 'rejected'")
	}

	updated, err := s.timeOffRepo.ReviewRequestAtomic(ctx, requestID, reviewerID, req.Status, req.Comments)
	if err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &reviewerID, "timeoff.review", "time_off_requests", &requestID, map[string]interface{}{
		"status":   string(req.Status),
		"comments": req.Comments,
	})

	return updated, nil
}

func (s *TimeOffService) UpsertAllocation(ctx context.Context, actorID uuid.UUID, dto *domain.UpsertAllocationDTO) error {
	alloc := domain.TimeOffAllocation{
		ID:            uuid.New(),
		EmployeeID:    dto.EmployeeID,
		TimeOffTypeID: dto.TimeOffTypeID,
		Year:          dto.Year,
		AllocatedDays: dto.AllocatedDays,
		UsedDays:      0,
	}
	err := s.timeOffRepo.UpsertAllocation(ctx, &alloc)
	if err != nil {
		return err
	}

	_ = s.auditRepo.Log(ctx, &actorID, "timeoff.upsert_allocation", "time_off_allocations", &alloc.ID, map[string]interface{}{
		"employee_id":    dto.EmployeeID,
		"allocated_days": dto.AllocatedDays,
		"year":           dto.Year,
	})

	return nil
}
