package repository

import (
	"context"
	"errors"
	"fmt"

	"dayflow/internal/database"
	"dayflow/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type TimeOffRepository struct {
	db *database.DB
}

func NewTimeOffRepository(db *database.DB) *TimeOffRepository {
	return &TimeOffRepository{db: db}
}

// Time Off Types
func (r *TimeOffRepository) GetTypesByCompany(ctx context.Context, companyID uuid.UUID) ([]domain.TimeOffType, error) {
	query := `
		SELECT id, company_id, name, is_paid, requires_attachment, created_at
		FROM time_off_types
		WHERE company_id = $1 OR company_id IS NULL
		ORDER BY is_paid DESC, name ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query time off types: %w", err)
	}
	defer rows.Close()

	var types []domain.TimeOffType
	for rows.Next() {
		var t domain.TimeOffType
		if err := rows.Scan(&t.ID, &t.CompanyID, &t.Name, &t.IsPaid, &t.RequiresAttachment, &t.CreatedAt); err == nil {
			types = append(types, t)
		}
	}
	return types, nil
}

func (r *TimeOffRepository) EnsureDefaultTypes(ctx context.Context, companyID uuid.UUID) error {
	defaults := []struct {
		Name               string
		IsPaid             bool
		RequiresAttachment bool
	}{
		{"Paid Time Off", true, false},
		{"Sick Leave", true, true},
		{"Unpaid Leave", false, false},
	}

	query := `
		INSERT INTO time_off_types (id, company_id, name, is_paid, requires_attachment, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (company_id, name) DO NOTHING
	`
	for _, d := range defaults {
		_, _ = r.db.Pool.Exec(ctx, query, uuid.New(), companyID, d.Name, d.IsPaid, d.RequiresAttachment)
	}
	return nil
}

// Allocations
func (r *TimeOffRepository) GetAllocationsByEmployee(ctx context.Context, employeeID uuid.UUID, year int) ([]domain.TimeOffAllocation, error) {
	query := `
		SELECT 
			a.id, a.employee_id, a.time_off_type_id, a.year, a.allocated_days, a.used_days, a.created_at, a.updated_at,
			t.name as time_off_type_name, t.is_paid
		FROM time_off_allocations a
		JOIN time_off_types t ON a.time_off_type_id = t.id
		WHERE a.employee_id = $1 AND a.year = $2
		ORDER BY t.name ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, employeeID, year)
	if err != nil {
		return nil, fmt.Errorf("failed to query leave allocations: %w", err)
	}
	defer rows.Close()

	var allocations []domain.TimeOffAllocation
	for rows.Next() {
		var a domain.TimeOffAllocation
		if err := rows.Scan(
			&a.ID, &a.EmployeeID, &a.TimeOffTypeID, &a.Year, &a.AllocatedDays, &a.UsedDays,
			&a.CreatedAt, &a.UpdatedAt, &a.TimeOffTypeName, &a.IsPaid,
		); err == nil {
			allocations = append(allocations, a)
		}
	}
	return allocations, nil
}

func (r *TimeOffRepository) UpsertAllocation(ctx context.Context, alloc *domain.TimeOffAllocation) error {
	if alloc.ID == uuid.Nil {
		alloc.ID = uuid.New()
	}
	query := `
		INSERT INTO time_off_allocations (
			id, employee_id, time_off_type_id, year, allocated_days, used_days, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, NOW(), NOW()
		)
		ON CONFLICT (employee_id, time_off_type_id, year) DO UPDATE
		SET allocated_days = EXCLUDED.allocated_days, updated_at = NOW()
		RETURNING created_at, updated_at
	`
	return r.db.Pool.QueryRow(ctx, query,
		alloc.ID, alloc.EmployeeID, alloc.TimeOffTypeID, alloc.Year, alloc.AllocatedDays, alloc.UsedDays,
	).Scan(&alloc.CreatedAt, &alloc.UpdatedAt)
}

// Leave Requests
func (r *TimeOffRepository) CreateRequest(ctx context.Context, req *domain.TimeOffRequest) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	query := `
		INSERT INTO time_off_requests (
			id, employee_id, time_off_type_id, start_date, end_date, days_requested,
			remarks, attachment_url, status, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4::date, $5::date, $6, $7, $8, 'pending', NOW(), NOW()
		)
		RETURNING created_at, updated_at
	`
	startStr := req.StartDate.Format("2006-01-02")
	endStr := req.EndDate.Format("2006-01-02")

	return r.db.Pool.QueryRow(ctx, query,
		req.ID, req.EmployeeID, req.TimeOffTypeID, startStr, endStr,
		req.DaysRequested, req.Remarks, req.AttachmentURL,
	).Scan(&req.CreatedAt, &req.UpdatedAt)
}

func (r *TimeOffRepository) GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.TimeOffRequest, error) {
	query := `
		SELECT 
			r.id, r.employee_id, r.time_off_type_id, r.start_date, r.end_date, r.days_requested,
			r.remarks, r.attachment_url, r.status, r.reviewed_by, r.reviewed_at, r.review_comments,
			r.created_at, r.updated_at,
			TRIM(CONCAT(e.first_name, ' ', e.last_name)) as employee_name,
			e.role::text as employee_role,
			e.profile_picture_url as employee_avatar,
			t.name as time_off_type_name,
			TRIM(CONCAT(rev.first_name, ' ', rev.last_name)) as reviewer_name
		FROM time_off_requests r
		JOIN employees e ON r.employee_id = e.id
		JOIN time_off_types t ON r.time_off_type_id = t.id
		LEFT JOIN employees rev ON r.reviewed_by = rev.id
		WHERE r.id = $1
	`
	var req domain.TimeOffRequest
	var revName *string
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&req.ID, &req.EmployeeID, &req.TimeOffTypeID, &req.StartDate, &req.EndDate, &req.DaysRequested,
		&req.Remarks, &req.AttachmentURL, &req.Status, &req.ReviewedBy, &req.ReviewedAt, &req.ReviewComments,
		&req.CreatedAt, &req.UpdatedAt,
		&req.EmployeeName, &req.EmployeeRole, &req.EmployeeAvatar,
		&req.TimeOffTypeName, &revName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get leave request by ID: %w", err)
	}
	if revName != nil && *revName != "" {
		req.ReviewerName = revName
	}
	return &req, nil
}

func (r *TimeOffRepository) ListRequests(ctx context.Context, companyID uuid.UUID, employeeID *uuid.UUID, status *string) ([]domain.TimeOffRequest, error) {
	query := `
		SELECT 
			r.id, r.employee_id, r.time_off_type_id, r.start_date, r.end_date, r.days_requested,
			r.remarks, r.attachment_url, r.status, r.reviewed_by, r.reviewed_at, r.review_comments,
			r.created_at, r.updated_at,
			TRIM(CONCAT(e.first_name, ' ', e.last_name)) as employee_name,
			e.role::text as employee_role,
			e.profile_picture_url as employee_avatar,
			t.name as time_off_type_name,
			TRIM(CONCAT(rev.first_name, ' ', rev.last_name)) as reviewer_name
		FROM time_off_requests r
		JOIN employees e ON r.employee_id = e.id
		JOIN time_off_types t ON r.time_off_type_id = t.id
		LEFT JOIN employees rev ON r.reviewed_by = rev.id
		WHERE e.company_id = $1
		  AND ($2::uuid IS NULL OR r.employee_id = $2::uuid)
		  AND ($3 = '' OR r.status::text = $3)
		ORDER BY r.created_at DESC
	`
	statusStr := ""
	if status != nil {
		statusStr = *status
	}

	rows, err := r.db.Pool.Query(ctx, query, companyID, employeeID, statusStr)
	if err != nil {
		return nil, fmt.Errorf("failed to query leave requests: %w", err)
	}
	defer rows.Close()

	var requests []domain.TimeOffRequest
	for rows.Next() {
		var req domain.TimeOffRequest
		var revName *string
		if err := rows.Scan(
			&req.ID, &req.EmployeeID, &req.TimeOffTypeID, &req.StartDate, &req.EndDate, &req.DaysRequested,
			&req.Remarks, &req.AttachmentURL, &req.Status, &req.ReviewedBy, &req.ReviewedAt, &req.ReviewComments,
			&req.CreatedAt, &req.UpdatedAt,
			&req.EmployeeName, &req.EmployeeRole, &req.EmployeeAvatar,
			&req.TimeOffTypeName, &revName,
		); err == nil {
			if revName != nil && *revName != "" {
				req.ReviewerName = revName
			}
			requests = append(requests, req)
		}
	}
	return requests, nil
}

// ReviewRequestAtomic approves or rejects a leave request inside a strict database transaction.
// When approved, it row-locks and decrements the allocation to ensure ACID guarantees.
func (r *TimeOffRepository) ReviewRequestAtomic(ctx context.Context, requestID, reviewerID uuid.UUID, newStatus domain.LeaveStatus, comments *string) (*domain.TimeOffRequest, error) {
	err := r.db.WithTransaction(ctx, func(tx pgx.Tx) error {
		// 1. Lock and select leave request
		reqQuery := `
			SELECT id, employee_id, time_off_type_id, start_date, end_date, days_requested, status
			FROM time_off_requests
			WHERE id = $1
			FOR UPDATE
		`
		var curReq domain.TimeOffRequest
		err := tx.QueryRow(ctx, reqQuery, requestID).Scan(
			&curReq.ID, &curReq.EmployeeID, &curReq.TimeOffTypeID, &curReq.StartDate, &curReq.EndDate,
			&curReq.DaysRequested, &curReq.Status,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return domain.ErrNotFound
			}
			return fmt.Errorf("failed to lock leave request: %w", err)
		}

		if curReq.Status != domain.LeavePending {
			return domain.ErrRequestAlreadyProcessed
		}

		// 2. If approving, increment used_days on allocation
		if newStatus == domain.LeaveApproved {
			year := curReq.StartDate.Year()
			allocQuery := `
				SELECT id, allocated_days, used_days
				FROM time_off_allocations
				WHERE employee_id = $1 AND time_off_type_id = $2 AND year = $3
				FOR UPDATE
			`
			var allocID uuid.UUID
			var allocatedDays, usedDays float64
			err := tx.QueryRow(ctx, allocQuery, curReq.EmployeeID, curReq.TimeOffTypeID, year).
				Scan(&allocID, &allocatedDays, &usedDays)

			if err == nil {
				// Update existing allocation
				newUsed := usedDays + curReq.DaysRequested
				updateAlloc := `
					UPDATE time_off_allocations
					SET used_days = $2, updated_at = NOW()
					WHERE id = $1
				`
				if _, err := tx.Exec(ctx, updateAlloc, allocID, newUsed); err != nil {
					return fmt.Errorf("failed to update leave allocation: %w", err)
				}
			} else if errors.Is(err, pgx.ErrNoRows) {
				// Create allocation if missing with used days
				createAlloc := `
					INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, year, allocated_days, used_days, created_at, updated_at)
					VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
				`
				if _, err := tx.Exec(ctx, createAlloc, uuid.New(), curReq.EmployeeID, curReq.TimeOffTypeID, year, 0, curReq.DaysRequested); err != nil {
					return fmt.Errorf("failed to create leave allocation: %w", err)
				}
			}
		}

		// 3. Update the request status
		updateReqQuery := `
			UPDATE time_off_requests
			SET status = $2, reviewed_by = $3, reviewed_at = NOW(), review_comments = $4, updated_at = NOW()
			WHERE id = $1
		`
		if _, err := tx.Exec(ctx, updateReqQuery, requestID, newStatus, reviewerID, comments); err != nil {
			return fmt.Errorf("failed to update request status: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return r.GetRequestByID(ctx, requestID)
}
