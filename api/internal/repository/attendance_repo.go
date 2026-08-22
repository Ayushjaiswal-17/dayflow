package repository

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"dayflow/internal/database"
	"dayflow/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type AttendanceRepository struct {
	db *database.DB
}

func NewAttendanceRepository(db *database.DB) *AttendanceRepository {
	return &AttendanceRepository{db: db}
}

// CheckIn records an employee's check-in for a given work date
func (r *AttendanceRepository) CheckIn(ctx context.Context, employeeID uuid.UUID, workDate time.Time, checkInTime time.Time) (*domain.AttendanceRecord, error) {
	recordID := uuid.New()
	dateOnly := workDate.Format("2006-01-02")

	query := `
		INSERT INTO attendance_records (
			id, employee_id, work_date, check_in, status, created_at, updated_at
		) VALUES (
			$1, $2, $3::date, $4, 'present', NOW(), NOW()
		)
		ON CONFLICT (employee_id, work_date) DO UPDATE
		SET 
			check_in = COALESCE(attendance_records.check_in, EXCLUDED.check_in),
			status = 'present',
			updated_at = NOW()
		RETURNING id, employee_id, work_date, check_in, check_out, work_hours, extra_hours, status, created_at, updated_at
	`

	var rec domain.AttendanceRecord
	err := r.db.Pool.QueryRow(ctx, query, recordID, employeeID, dateOnly, checkInTime).Scan(
		&rec.ID, &rec.EmployeeID, &rec.WorkDate, &rec.CheckIn, &rec.CheckOut,
		&rec.WorkHours, &rec.ExtraHours, &rec.Status, &rec.CreatedAt, &rec.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to check in: %w", err)
	}
	return &rec, nil
}

// CheckOut records an employee's check-out and calculates total hours
func (r *AttendanceRepository) CheckOut(ctx context.Context, employeeID uuid.UUID, workDate time.Time, checkOutTime time.Time) (*domain.AttendanceRecord, error) {
	dateOnly := workDate.Format("2006-01-02")

	// First fetch current record to verify check-in exists
	existing, err := r.GetByDate(ctx, employeeID, workDate)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrNotCheckedIn
		}
		return nil, err
	}

	if existing.CheckIn == nil {
		return nil, domain.ErrNotCheckedIn
	}

	// Compute work hours and extra hours (standard workday = 8.0 hours)
	duration := checkOutTime.Sub(*existing.CheckIn)
	hoursWorked := math.Round((duration.Hours())*100) / 100
	if hoursWorked < 0 {
		hoursWorked = 0
	}

	extraHours := 0.0
	if hoursWorked > 8.0 {
		extraHours = math.Round((hoursWorked-8.0)*100) / 100
	}

	status := domain.AttPresent
	if hoursWorked < 4.0 {
		status = domain.AttHalfDay
	}

	query := `
		UPDATE attendance_records
		SET check_out = $3, work_hours = $4, extra_hours = $5, status = $6, updated_at = NOW()
		WHERE employee_id = $1 AND work_date = $2::date
		RETURNING id, employee_id, work_date, check_in, check_out, work_hours, extra_hours, status, created_at, updated_at
	`

	var rec domain.AttendanceRecord
	err = r.db.Pool.QueryRow(ctx, query, employeeID, dateOnly, checkOutTime, hoursWorked, extraHours, status).Scan(
		&rec.ID, &rec.EmployeeID, &rec.WorkDate, &rec.CheckIn, &rec.CheckOut,
		&rec.WorkHours, &rec.ExtraHours, &rec.Status, &rec.CreatedAt, &rec.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to check out: %w", err)
	}
	return &rec, nil
}

func (r *AttendanceRepository) GetByDate(ctx context.Context, employeeID uuid.UUID, workDate time.Time) (*domain.AttendanceRecord, error) {
	dateOnly := workDate.Format("2006-01-02")
	query := `
		SELECT id, employee_id, work_date, check_in, check_out, work_hours, extra_hours, status, created_at, updated_at
		FROM attendance_records
		WHERE employee_id = $1 AND work_date = $2::date
	`
	var rec domain.AttendanceRecord
	err := r.db.Pool.QueryRow(ctx, query, employeeID, dateOnly).Scan(
		&rec.ID, &rec.EmployeeID, &rec.WorkDate, &rec.CheckIn, &rec.CheckOut,
		&rec.WorkHours, &rec.ExtraHours, &rec.Status, &rec.CreatedAt, &rec.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get attendance by date: %w", err)
	}
	return &rec, nil
}

func (r *AttendanceRepository) ListByEmployee(ctx context.Context, employeeID uuid.UUID, startDate, endDate *time.Time) ([]domain.AttendanceRecord, error) {
	query := `
		SELECT id, employee_id, work_date, check_in, check_out, work_hours, extra_hours, status, created_at, updated_at
		FROM attendance_records
		WHERE employee_id = $1
		  AND ($2::date IS NULL OR work_date >= $2::date)
		  AND ($3::date IS NULL OR work_date <= $3::date)
		ORDER BY work_date DESC
	`
	var start, end *string
	if startDate != nil {
		s := startDate.Format("2006-01-02")
		start = &s
	}
	if endDate != nil {
		e := endDate.Format("2006-01-02")
		end = &e
	}

	rows, err := r.db.Pool.Query(ctx, query, employeeID, start, end)
	if err != nil {
		return nil, fmt.Errorf("failed to query employee attendance: %w", err)
	}
	defer rows.Close()

	var records []domain.AttendanceRecord
	for rows.Next() {
		var rec domain.AttendanceRecord
		if err := rows.Scan(
			&rec.ID, &rec.EmployeeID, &rec.WorkDate, &rec.CheckIn, &rec.CheckOut,
			&rec.WorkHours, &rec.ExtraHours, &rec.Status, &rec.CreatedAt, &rec.UpdatedAt,
		); err == nil {
			records = append(records, rec)
		}
	}
	return records, nil
}

func (r *AttendanceRepository) ListAll(ctx context.Context, companyID uuid.UUID, filter domain.AttendanceFilter) ([]domain.AttendanceRecord, error) {
	query := `
		SELECT 
			a.id, a.employee_id, a.work_date, a.check_in, a.check_out, a.work_hours, a.extra_hours,
			a.status, a.created_at, a.updated_at,
			TRIM(CONCAT(e.first_name, ' ', e.last_name)) as employee_name,
			e.role::text as employee_role,
			e.profile_picture_url as employee_avatar,
			e.department
		FROM attendance_records a
		JOIN employees e ON a.employee_id = e.id
		WHERE e.company_id = $1
		  AND ($2::uuid IS NULL OR a.employee_id = $2::uuid)
		  AND ($3::date IS NULL OR a.work_date >= $3::date)
		  AND ($4::date IS NULL OR a.work_date <= $4::date)
		  AND ($5 = '' OR a.status::text = $5)
		ORDER BY a.work_date DESC, a.created_at DESC
	`
	var start, end *string
	if filter.StartDate != nil {
		s := filter.StartDate.Format("2006-01-02")
		start = &s
	}
	if filter.EndDate != nil {
		e := filter.EndDate.Format("2006-01-02")
		end = &e
	}
	statusStr := ""
	if filter.Status != nil {
		statusStr = *filter.Status
	}

	rows, err := r.db.Pool.Query(ctx, query, companyID, filter.EmployeeID, start, end, statusStr)
	if err != nil {
		return nil, fmt.Errorf("failed to query all attendance: %w", err)
	}
	defer rows.Close()

	var records []domain.AttendanceRecord
	for rows.Next() {
		var rec domain.AttendanceRecord
		if err := rows.Scan(
			&rec.ID, &rec.EmployeeID, &rec.WorkDate, &rec.CheckIn, &rec.CheckOut, &rec.WorkHours, &rec.ExtraHours,
			&rec.Status, &rec.CreatedAt, &rec.UpdatedAt,
			&rec.EmployeeName, &rec.EmployeeRole, &rec.EmployeeAvatar, &rec.Department,
		); err == nil {
			records = append(records, rec)
		}
	}
	return records, nil
}

func (r *AttendanceRepository) GetSummary(ctx context.Context, employeeID uuid.UUID, startDate, endDate time.Time) (*domain.AttendanceSummaryResponse, error) {
	startStr := startDate.Format("2006-01-02")
	endStr := endDate.Format("2006-01-02")

	query := `
		SELECT 
			COUNT(*) FILTER (WHERE status = 'present') as present_count,
			COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
			COUNT(*) FILTER (WHERE status = 'half_day') as half_day_count,
			COUNT(*) FILTER (WHERE status = 'leave') as leave_count,
			COUNT(*) as total_days,
			COALESCE(SUM(work_hours), 0) as total_work_hours,
			COALESCE(SUM(extra_hours), 0) as total_extra_hours
		FROM attendance_records
		WHERE employee_id = $1
		  AND work_date >= $2::date
		  AND work_date <= $3::date
	`
	var summary domain.AttendanceSummaryResponse
	err := r.db.Pool.QueryRow(ctx, query, employeeID, startStr, endStr).Scan(
		&summary.DaysPresent,
		&summary.DaysAbsent,
		&summary.DaysHalfDay,
		&summary.DaysLeave,
		&summary.TotalWorkingDays,
		&summary.TotalHoursWorked,
		&summary.TotalExtraHours,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get attendance summary: %w", err)
	}
	return &summary, nil
}
