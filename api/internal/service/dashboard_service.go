package service

import (
	"context"
	"time"

	"dayflow/internal/domain"
	"dayflow/internal/repository"
	"github.com/google/uuid"
)

type DashboardService struct {
	employeeRepo   *repository.EmployeeRepository
	attendanceRepo *repository.AttendanceRepository
	timeOffRepo    *repository.TimeOffRepository
	auditRepo      *repository.AuditRepository
}

func NewDashboardService(
	employeeRepo *repository.EmployeeRepository,
	attendanceRepo *repository.AttendanceRepository,
	timeOffRepo *repository.TimeOffRepository,
	auditRepo *repository.AuditRepository,
) *DashboardService {
	return &DashboardService{
		employeeRepo:   employeeRepo,
		attendanceRepo: attendanceRepo,
		timeOffRepo:    timeOffRepo,
		auditRepo:      auditRepo,
	}
}

func (s *DashboardService) GetStats(ctx context.Context, companyID uuid.UUID) (*domain.DashboardStatsResponse, error) {
	// Total employees
	employees, err := s.employeeRepo.List(ctx, companyID, "", "")
	if err != nil {
		return nil, err
	}
	totalEmployees := len(employees)

	// Today's attendance
	today := time.Now()
	todayAttendance, _ := s.attendanceRepo.ListAll(ctx, companyID, domain.AttendanceFilter{
		StartDate: &today,
		EndDate:   &today,
	})

	presentToday := 0
	onLeaveToday := 0
	for _, a := range todayAttendance {
		if a.Status == domain.AttPresent || a.Status == domain.AttHalfDay {
			presentToday++
		} else if a.Status == domain.AttLeave {
			onLeaveToday++
		}
	}

	// Pending leave requests
	pendingStr := string(domain.LeavePending)
	pendingRequests, _ := s.timeOffRepo.ListRequests(ctx, companyID, nil, &pendingStr)
	pendingCount := len(pendingRequests)

	// Recent audits
	auditLogs, _ := s.auditRepo.GetRecent(ctx, 10)
	var recentActivities []map[string]interface{}
	for _, l := range auditLogs {
		recentActivities = append(recentActivities, map[string]interface{}{
			"id":        l.ID,
			"action":    l.Action,
			"entity":    l.EntityTable,
			"timestamp": l.CreatedAt,
		})
	}

	return &domain.DashboardStatsResponse{
		TotalEmployees:    totalEmployees,
		PresentTodayCount: presentToday,
		OnLeaveTodayCount: onLeaveToday,
		PendingLeaveCount: pendingCount,
		RecentActivities:  recentActivities,
	}, nil
}
