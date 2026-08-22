package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"dayflow/internal/database"
	"dayflow/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type EmployeeRepository struct {
	db *database.DB
}

func NewEmployeeRepository(db *database.DB) *EmployeeRepository {
	return &EmployeeRepository{db: db}
}

func (r *EmployeeRepository) Create(ctx context.Context, tx database.DBTX, emp *domain.Employee) error {
	if tx == nil {
		tx = r.db.Pool
	}

	query := `
		INSERT INTO employees (
			id, company_id, manager_id, login_id, email, password_hash,
			must_reset_password, first_name, last_name, phone, profile_picture_url,
			role, department, designation, employment_status, date_of_birth,
			date_of_joining, address, about, what_i_love_about_job, interests_hobbies,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11,
			$12, $13, $14, $15, $16,
			$17, $18, $19, $20, $21,
			NOW(), NOW()
		)
		RETURNING created_at, updated_at
	`
	if emp.ID == uuid.Nil {
		emp.ID = uuid.New()
	}

	err := tx.QueryRow(ctx, query,
		emp.ID, emp.CompanyID, emp.ManagerID, emp.LoginID, emp.Email, emp.PasswordHash,
		emp.MustResetPassword, emp.FirstName, emp.LastName, emp.Phone, emp.ProfilePictureURL,
		emp.Role, emp.Department, emp.Designation, emp.EmploymentStatus, emp.DateOfBirth,
		emp.DateOfJoining, emp.Address, emp.About, emp.WhatILoveAboutJob, emp.InterestsHobbies,
	).Scan(&emp.CreatedAt, &emp.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create employee: %w", err)
	}
	return nil
}

func (r *EmployeeRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Employee, error) {
	query := `
		SELECT 
			e.id, e.company_id, e.manager_id, e.login_id, e.email, e.password_hash,
			e.must_reset_password, e.first_name, e.last_name, e.phone, e.profile_picture_url,
			e.role, e.department, e.designation, e.employment_status, e.date_of_birth,
			e.date_of_joining, e.address, e.about, e.what_i_love_about_job, e.interests_hobbies,
			e.created_at, e.updated_at,
			c.name as company_name, c.code as company_code,
			TRIM(CONCAT(m.first_name, ' ', m.last_name)) as manager_name
		FROM employees e
		LEFT JOIN companies c ON e.company_id = c.id
		LEFT JOIN employees m ON e.manager_id = m.id
		WHERE e.id = $1
	`
	var emp domain.Employee
	var mgrName *string
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&emp.ID, &emp.CompanyID, &emp.ManagerID, &emp.LoginID, &emp.Email, &emp.PasswordHash,
		&emp.MustResetPassword, &emp.FirstName, &emp.LastName, &emp.Phone, &emp.ProfilePictureURL,
		&emp.Role, &emp.Department, &emp.Designation, &emp.EmploymentStatus, &emp.DateOfBirth,
		&emp.DateOfJoining, &emp.Address, &emp.About, &emp.WhatILoveAboutJob, &emp.InterestsHobbies,
		&emp.CreatedAt, &emp.UpdatedAt,
		&emp.CompanyName, &emp.CompanyCode, &mgrName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get employee by ID: %w", err)
	}
	if mgrName != nil && *mgrName != "" {
		emp.ManagerName = mgrName
	}

	// Fetch skills, certifications, documents
	emp.Skills, _ = r.GetSkills(ctx, emp.ID)
	emp.Certifications, _ = r.GetCertifications(ctx, emp.ID)
	emp.Documents, _ = r.GetDocuments(ctx, emp.ID)

	return &emp, nil
}

func (r *EmployeeRepository) GetByEmailOrLoginID(ctx context.Context, identifier string) (*domain.Employee, error) {
	query := `
		SELECT 
			e.id, e.company_id, e.manager_id, e.login_id, e.email, e.password_hash,
			e.must_reset_password, e.first_name, e.last_name, e.phone, e.profile_picture_url,
			e.role, e.department, e.designation, e.employment_status, e.date_of_birth,
			e.date_of_joining, e.address, e.about, e.what_i_love_about_job, e.interests_hobbies,
			e.created_at, e.updated_at,
			c.name as company_name, c.code as company_code
		FROM employees e
		LEFT JOIN companies c ON e.company_id = c.id
		WHERE LOWER(e.email) = LOWER($1) OR UPPER(e.login_id) = UPPER($1)
	`
	var emp domain.Employee
	err := r.db.Pool.QueryRow(ctx, query, strings.TrimSpace(identifier)).Scan(
		&emp.ID, &emp.CompanyID, &emp.ManagerID, &emp.LoginID, &emp.Email, &emp.PasswordHash,
		&emp.MustResetPassword, &emp.FirstName, &emp.LastName, &emp.Phone, &emp.ProfilePictureURL,
		&emp.Role, &emp.Department, &emp.Designation, &emp.EmploymentStatus, &emp.DateOfBirth,
		&emp.DateOfJoining, &emp.Address, &emp.About, &emp.WhatILoveAboutJob, &emp.InterestsHobbies,
		&emp.CreatedAt, &emp.UpdatedAt,
		&emp.CompanyName, &emp.CompanyCode,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get employee by identifier: %w", err)
	}
	return &emp, nil
}

func (r *EmployeeRepository) List(ctx context.Context, companyID uuid.UUID, department, status string) ([]domain.Employee, error) {
	query := `
		SELECT 
			e.id, e.company_id, e.manager_id, e.login_id, e.email,
			e.must_reset_password, e.first_name, e.last_name, e.phone, e.profile_picture_url,
			e.role, e.department, e.designation, e.employment_status, e.date_of_birth,
			e.date_of_joining, e.address, e.about, e.what_i_love_about_job, e.interests_hobbies,
			e.created_at, e.updated_at,
			TRIM(CONCAT(m.first_name, ' ', m.last_name)) as manager_name
		FROM employees e
		LEFT JOIN employees m ON e.manager_id = m.id
		WHERE e.company_id = $1
		  AND ($2 = '' OR LOWER(e.department) = LOWER($2))
		  AND ($3 = '' OR e.employment_status::text = $3)
		ORDER BY e.created_at ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, companyID, department, status)
	if err != nil {
		return nil, fmt.Errorf("failed to query employees: %w", err)
	}
	defer rows.Close()

	var employees []domain.Employee
	for rows.Next() {
		var emp domain.Employee
		var mgrName *string
		if err := rows.Scan(
			&emp.ID, &emp.CompanyID, &emp.ManagerID, &emp.LoginID, &emp.Email,
			&emp.MustResetPassword, &emp.FirstName, &emp.LastName, &emp.Phone, &emp.ProfilePictureURL,
			&emp.Role, &emp.Department, &emp.Designation, &emp.EmploymentStatus, &emp.DateOfBirth,
			&emp.DateOfJoining, &emp.Address, &emp.About, &emp.WhatILoveAboutJob, &emp.InterestsHobbies,
			&emp.CreatedAt, &emp.UpdatedAt, &mgrName,
		); err != nil {
			return nil, fmt.Errorf("failed to scan employee row: %w", err)
		}
		if mgrName != nil && *mgrName != "" {
			emp.ManagerName = mgrName
		}
		employees = append(employees, emp)
	}
	return employees, nil
}

func (r *EmployeeRepository) UpdateProfile(ctx context.Context, id uuid.UUID, req *domain.UpdateEmployeeProfileRequest) (*domain.Employee, error) {
	// Dynamically build update query for non-nil fields
	query := `
		UPDATE employees SET
			first_name = COALESCE($2, first_name),
			last_name = COALESCE($3, last_name),
			phone = COALESCE($4, phone),
			profile_picture_url = COALESCE($5, profile_picture_url),
			address = COALESCE($6, address),
			about = COALESCE($7, about),
			what_i_love_about_job = COALESCE($8, what_i_love_about_job),
			interests_hobbies = COALESCE($9, interests_hobbies),
			date_of_birth = COALESCE($10, date_of_birth),
			department = COALESCE($11, department),
			designation = COALESCE($12, designation),
			role = COALESCE($13, role),
			employment_status = COALESCE($14, employment_status),
			manager_id = COALESCE($15, manager_id),
			date_of_joining = COALESCE($16, date_of_joining),
			updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query,
		id,
		req.FirstName, req.LastName, req.Phone, req.ProfilePictureURL,
		req.Address, req.About, req.WhatILoveAboutJob, req.InterestsHobbies, req.DateOfBirth,
		req.Department, req.Designation, req.Role, req.EmploymentStatus, req.ManagerID, req.DateOfJoining,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update employee profile: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *EmployeeRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string, mustReset bool) error {
	query := `
		UPDATE employees
		SET password_hash = $2, must_reset_password = $3, updated_at = NOW()
		WHERE id = $1
	`
	tag, err := r.db.Pool.Exec(ctx, query, id, passwordHash, mustReset)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// GetNextSerialForYear computes the next sequential hire number for a company in a given year
func (r *EmployeeRepository) GetNextSerialForYear(ctx context.Context, tx database.DBTX, companyID uuid.UUID, year int) (int, error) {
	if tx == nil {
		tx = r.db.Pool
	}

	// Extract the last 4 characters of login_id where year matches
	query := `
		SELECT login_id
		FROM employees
		WHERE company_id = $1 AND EXTRACT(YEAR FROM date_of_joining) = $2
		FOR UPDATE
	`
	rows, err := tx.Query(ctx, query, companyID, year)
	if err != nil {
		// If FOR UPDATE fails outside a transaction, fallback to normal SELECT
		queryFallback := `
			SELECT login_id
			FROM employees
			WHERE company_id = $1 AND EXTRACT(YEAR FROM date_of_joining) = $2
		`
		rows, err = tx.Query(ctx, queryFallback, companyID, year)
		if err != nil {
			return 1, nil
		}
	}
	defer rows.Close()

	maxSerial := 0
	for rows.Next() {
		var loginID string
		if err := rows.Scan(&loginID); err == nil {
			if len(loginID) >= 4 {
				serialPart := loginID[len(loginID)-4:]
				if serial, err := strconv.Atoi(serialPart); err == nil && serial > maxSerial {
					maxSerial = serial
				}
			}
		}
	}
	return maxSerial + 1, nil
}

// Skills CRUD
func (r *EmployeeRepository) AddSkill(ctx context.Context, employeeID uuid.UUID, skill string) (*domain.EmployeeSkill, error) {
	s := domain.EmployeeSkill{
		ID:         uuid.New(),
		EmployeeID: employeeID,
		Skill:      skill,
	}
	query := `
		INSERT INTO employee_skills (id, employee_id, skill, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING created_at
	`
	err := r.db.Pool.QueryRow(ctx, query, s.ID, s.EmployeeID, s.Skill).Scan(&s.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to add skill: %w", err)
	}
	return &s, nil
}

func (r *EmployeeRepository) DeleteSkill(ctx context.Context, employeeID, skillID uuid.UUID) error {
	query := `DELETE FROM employee_skills WHERE id = $1 AND employee_id = $2`
	_, err := r.db.Pool.Exec(ctx, query, skillID, employeeID)
	return err
}

func (r *EmployeeRepository) GetSkills(ctx context.Context, employeeID uuid.UUID) ([]domain.EmployeeSkill, error) {
	query := `SELECT id, employee_id, skill, created_at FROM employee_skills WHERE employee_id = $1 ORDER BY created_at ASC`
	rows, err := r.db.Pool.Query(ctx, query, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []domain.EmployeeSkill
	for rows.Next() {
		var s domain.EmployeeSkill
		if err := rows.Scan(&s.ID, &s.EmployeeID, &s.Skill, &s.CreatedAt); err == nil {
			skills = append(skills, s)
		}
	}
	return skills, nil
}

// Certifications CRUD
func (r *EmployeeRepository) AddCertification(ctx context.Context, cert *domain.EmployeeCertification) error {
	if cert.ID == uuid.Nil {
		cert.ID = uuid.New()
	}
	query := `
		INSERT INTO employee_certifications (id, employee_id, title, issued_by, issue_date, file_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING created_at
	`
	return r.db.Pool.QueryRow(ctx, query, cert.ID, cert.EmployeeID, cert.Title, cert.IssuedBy, cert.IssueDate, cert.FileURL).
		Scan(&cert.CreatedAt)
}

func (r *EmployeeRepository) DeleteCertification(ctx context.Context, employeeID, certID uuid.UUID) error {
	query := `DELETE FROM employee_certifications WHERE id = $1 AND employee_id = $2`
	_, err := r.db.Pool.Exec(ctx, query, certID, employeeID)
	return err
}

func (r *EmployeeRepository) GetCertifications(ctx context.Context, employeeID uuid.UUID) ([]domain.EmployeeCertification, error) {
	query := `SELECT id, employee_id, title, issued_by, issue_date, file_url, created_at FROM employee_certifications WHERE employee_id = $1 ORDER BY created_at ASC`
	rows, err := r.db.Pool.Query(ctx, query, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var certs []domain.EmployeeCertification
	for rows.Next() {
		var c domain.EmployeeCertification
		if err := rows.Scan(&c.ID, &c.EmployeeID, &c.Title, &c.IssuedBy, &c.IssueDate, &c.FileURL, &c.CreatedAt); err == nil {
			certs = append(certs, c)
		}
	}
	return certs, nil
}

// Documents CRUD
func (r *EmployeeRepository) AddDocument(ctx context.Context, doc *domain.EmployeeDocument) error {
	if doc.ID == uuid.Nil {
		doc.ID = uuid.New()
	}
	query := `
		INSERT INTO employee_documents (id, employee_id, doc_type, file_url, uploaded_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING uploaded_at
	`
	return r.db.Pool.QueryRow(ctx, query, doc.ID, doc.EmployeeID, doc.DocType, doc.FileURL).
		Scan(&doc.UploadedAt)
}

func (r *EmployeeRepository) GetDocuments(ctx context.Context, employeeID uuid.UUID) ([]domain.EmployeeDocument, error) {
	query := `SELECT id, employee_id, doc_type, file_url, uploaded_at FROM employee_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC`
	rows, err := r.db.Pool.Query(ctx, query, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []domain.EmployeeDocument
	for rows.Next() {
		var d domain.EmployeeDocument
		if err := rows.Scan(&d.ID, &d.EmployeeID, &d.DocType, &d.FileURL, &d.UploadedAt); err == nil {
			docs = append(docs, d)
		}
	}
	return docs, nil
}
