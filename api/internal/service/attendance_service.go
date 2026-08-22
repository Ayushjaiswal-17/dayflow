package service

import (
	"context"
	"time"

	"dayflow/internal/domain"
	"dayflow/internal/repository"
	"github.com/google/uuid"
)

type AttendanceService struct {
	attendanceRepo *repository.AttendanceRepository
	auditRepo      *repository.AuditRepository
}

func NewAttendanceService(
	attendanceRepo *repository.AttendanceRepository,
	auditRepo *repository.AuditRepository,
) *AttendanceService {
	return &AttendanceService{
		attendanceRepo: attendanceRepo,
		auditRepo:      auditRepo,
	}
}

func (s *AttendanceService) CheckIn(ctx context.Context, employeeID uuid.UUID, customDate *time.Time) (*domain.AttendanceRecord, error) {
	now := time.Now()
	workDate := now
	if customDate != nil {
		workDate = *customDate
	}

	rec, err := s.attendanceRepo.CheckIn(ctx, employeeID, workDate, now)
	if err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &employeeID, "attendance.check_in", "attendance_records", &rec.ID, map[string]interface{}{
		"work_date": workDate.Format("2006-01-02"),
		"check_in":  now.Format(time.RFC3339),
	})

	return rec, nil
}

func (s *AttendanceService) CheckOut(ctx context.Context, employeeID uuid.UUID, customDate *time.Time) (*domain.AttendanceRecord, error) {
	now := time.Now()
	workDate := now
	if customDate != nil {
		workDate = *customDate
	}

	rec, err := s.attendanceRepo.CheckOut(ctx, employeeID, workDate, now)
	if err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &employeeID, "attendance.check_out", "attendance_records", &rec.ID, map[string]interface{}{
		"work_date":   workDate.Format("2006-01-02"),
		"check_out":   now.Format(time.RFC3339),
		"work_hours":  rec.WorkHours,
		"extra_hours": rec.ExtraHours,
	})

	return rec, nil
}

func (s *AttendanceService) GetMyAttendance(ctx context.Context, employeeID uuid.UUID, startDate, endDate *time.Time) ([]domain.AttendanceRecord, error) {
	return s.attendanceRepo.ListByEmployee(ctx, employeeID, startDate, endDate)
}

func (s *AttendanceService) ListAll(ctx context.Context, companyID uuid.UUID, filter domain.AttendanceFilter) ([]domain.AttendanceRecord, error) {
	return s.attendanceRepo.ListAll(ctx, companyID, filter)
}

func (s *AttendanceService) GetSummary(ctx context.Context, employeeID uuid.UUID, startDate, endDate *time.Time) (*domain.AttendanceSummaryResponse, error) {
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, -1)

	if startDate != nil {
		start = *startDate
	}
	if endDate != nil {
		end = *endDate
	}

	return s.attendanceRepo.GetSummary(ctx, employeeID, start, end)
}
