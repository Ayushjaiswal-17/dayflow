package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"dayflow/internal/config"
	"dayflow/internal/database"
	"dayflow/internal/domain"
	"dayflow/internal/repository"
	"dayflow/internal/utils"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type EmployeeService struct {
	cfg          *config.Config
	db           *database.DB
	employeeRepo *repository.EmployeeRepository
	companyRepo  *repository.CompanyRepository
	salaryRepo   *repository.SalaryRepository
	timeOffRepo  *repository.TimeOffRepository
	auditRepo    *repository.AuditRepository
}

func NewEmployeeService(
	cfg *config.Config,
	db *database.DB,
	employeeRepo *repository.EmployeeRepository,
	companyRepo *repository.CompanyRepository,
	salaryRepo *repository.SalaryRepository,
	timeOffRepo *repository.TimeOffRepository,
	auditRepo *repository.AuditRepository,
) *EmployeeService {
	return &EmployeeService{
		cfg:          cfg,
		db:           db,
		employeeRepo: employeeRepo,
		companyRepo:  companyRepo,
		salaryRepo:   salaryRepo,
		timeOffRepo:  timeOffRepo,
		auditRepo:    auditRepo,
	}
}

func (s *EmployeeService) CreateEmployee(ctx context.Context, actorID, companyID uuid.UUID, req *domain.CreateEmployeeRequest) (*domain.CreateEmployeeResponse, error) {
	// Check if email already exists
	if _, err := s.employeeRepo.GetByEmailOrLoginID(ctx, req.Email); err == nil {
		return nil, domain.ErrEmailExists
	}

	company, err := s.companyRepo.GetByID(ctx, companyID)
	if err != nil {
		return nil, err
	}

	joiningDate := time.Now()
	if req.DateOfJoining != nil {
		joiningDate = *req.DateOfJoining
	}

	// Generate temporary password
	rawPassword := utils.GenerateRandomPassword()
	hashedPw, err := utils.HashPassword(rawPassword)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	var newEmp domain.Employee
	var loginID string

	// Perform atomic creation
	err = s.db.WithTransaction(ctx, func(tx pgx.Tx) error {
		// Calculate sequential serial for joining year
		serial, err := s.employeeRepo.GetNextSerialForYear(ctx, tx, companyID, joiningDate.Year())
		if err != nil {
			return err
		}

		loginID = utils.GenerateLoginID(company.Code, req.FirstName, req.LastName, joiningDate, serial)

		newEmp = domain.Employee{
			ID:                uuid.New(),
			CompanyID:         companyID,
			ManagerID:         req.ManagerID,
			LoginID:           loginID,
			Email:             strings.TrimSpace(req.Email),
			PasswordHash:      &hashedPw,
			MustResetPassword: true,
			FirstName:         strings.TrimSpace(req.FirstName),
			LastName:          strings.TrimSpace(req.LastName),
			Phone:             req.Phone,
			Role:              req.Role,
			Department:        req.Department,
			Designation:       req.Designation,
			EmploymentStatus:  domain.StatusActive,
			DateOfBirth:       req.DateOfBirth,
			DateOfJoining:     joiningDate,
			Address:           req.Address,
			About:             req.About,
			WhatILoveAboutJob: req.WhatILoveAboutJob,
			InterestsHobbies:  req.InterestsHobbies,
		}

		if err := s.employeeRepo.Create(ctx, tx, &newEmp); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Seed default leave allocations for the current year (e.g. 24 PTO, 7 Sick Leave)
	types, err := s.timeOffRepo.GetTypesByCompany(ctx, companyID)
	if err == nil {
		currentYear := joiningDate.Year()
		for _, t := range types {
			allocDays := 0.0
			nameLower := strings.ToLower(t.Name)
			if strings.Contains(nameLower, "paid") {
				allocDays = 24.0
			} else if strings.Contains(nameLower, "sick") {
				allocDays = 7.0
			}
			_ = s.timeOffRepo.UpsertAllocation(ctx, &domain.TimeOffAllocation{
				ID:            uuid.New(),
				EmployeeID:    newEmp.ID,
				TimeOffTypeID: t.ID,
				Year:          currentYear,
				AllocatedDays: allocDays,
				UsedDays:      0,
			})
		}
	}

	// If monthly wage is provided, initialize salary structure with standard components
	if req.MonthlyWage != nil && *req.MonthlyWage > 0 {
		wage := *req.MonthlyWage
		components := []domain.SalaryComponentInput{
			{Kind: domain.KindEarning, Name: "Basic Salary", CalculationType: domain.CalcPercentage, Value: 50.0, DisplayOrder: 1},
			{Kind: domain.KindEarning, Name: "House Rent Allowance (HRA)", CalculationType: domain.CalcPercentage, Value: 50.0, DisplayOrder: 2},
			{Kind: domain.KindEarning, Name: "Standard Allowance", CalculationType: domain.CalcPercentage, Value: 20.0, DisplayOrder: 3},
			{Kind: domain.KindDeduction, Name: "Provident Fund (PF)", CalculationType: domain.CalcPercentage, Value: 12.0, DisplayOrder: 4},
			{Kind: domain.KindDeduction, Name: "Professional Tax", CalculationType: domain.CalcFixed, Value: 200.0, DisplayOrder: 5},
		}
		preview, err := utils.CalculateSalaryBreakdown(wage, components)
		if err == nil {
			_, _ = s.salaryRepo.UpsertStructure(
				ctx,
				newEmp.ID,
				domain.WageMonthly,
				wage,
				5,
				8.0,
				joiningDate,
				preview.Components,
			)
		}
	}

	_ = s.auditRepo.Log(ctx, &actorID, "employee.create", "employees", &newEmp.ID, map[string]string{
		"login_id": loginID,
		"email":    newEmp.Email,
		"role":     string(newEmp.Role),
	})

	return &domain.CreateEmployeeResponse{
		Employee:      &newEmp,
		GeneratedPass: rawPassword,
		LoginID:       loginID,
	}, nil
}

func (s *EmployeeService) GetEmployeeByID(ctx context.Context, id uuid.UUID) (*domain.Employee, error) {
	return s.employeeRepo.GetByID(ctx, id)
}

func (s *EmployeeService) ListEmployees(ctx context.Context, companyID uuid.UUID, department, status string) ([]domain.Employee, error) {
	return s.employeeRepo.List(ctx, companyID, department, status)
}

func (s *EmployeeService) UpdateProfile(ctx context.Context, actorID, targetID uuid.UUID, actorRole domain.UserRole, req *domain.UpdateEmployeeProfileRequest) (*domain.Employee, error) {
	// If actor is normal employee, restrict them to their own profile and limit editable fields
	if actorRole == domain.RoleEmployee {
		if actorID != targetID {
			return nil, domain.ErrForbidden
		}
		// Clear administrative fields to prevent self-elevation
		req.Role = nil
		req.Department = nil
		req.Designation = nil
		req.EmploymentStatus = nil
		req.ManagerID = nil
		req.DateOfJoining = nil
	}

	updated, err := s.employeeRepo.UpdateProfile(ctx, targetID, req)
	if err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &actorID, "employee.update_profile", "employees", &targetID, nil)
	return updated, nil
}

func (s *EmployeeService) AddSkill(ctx context.Context, actorID, targetID uuid.UUID, skill string) (*domain.EmployeeSkill, error) {
	return s.employeeRepo.AddSkill(ctx, targetID, skill)
}

func (s *EmployeeService) DeleteSkill(ctx context.Context, actorID, targetID, skillID uuid.UUID) error {
	return s.employeeRepo.DeleteSkill(ctx, targetID, skillID)
}

func (s *EmployeeService) AddCertification(ctx context.Context, actorID, targetID uuid.UUID, req *domain.AddCertificationRequest) error {
	cert := domain.EmployeeCertification{
		ID:         uuid.New(),
		EmployeeID: targetID,
		Title:      req.Title,
		IssuedBy:   req.IssuedBy,
		IssueDate:  req.IssueDate,
		FileURL:    req.FileURL,
	}
	return s.employeeRepo.AddCertification(ctx, &cert)
}

func (s *EmployeeService) DeleteCertification(ctx context.Context, actorID, targetID, certID uuid.UUID) error {
	return s.employeeRepo.DeleteCertification(ctx, targetID, certID)
}

func (s *EmployeeService) AddDocument(ctx context.Context, actorID, targetID uuid.UUID, req *domain.AddDocumentRequest) error {
	doc := domain.EmployeeDocument{
		ID:         uuid.New(),
		EmployeeID: targetID,
		DocType:    req.DocType,
		FileURL:    req.FileURL,
	}
	return s.employeeRepo.AddDocument(ctx, &doc)
}
