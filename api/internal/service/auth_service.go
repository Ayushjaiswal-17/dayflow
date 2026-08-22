package service

import (
	"context"
	"errors"
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

type AuthService struct {
	cfg          *config.Config
	db           *database.DB
	companyRepo  *repository.CompanyRepository
	employeeRepo *repository.EmployeeRepository
	timeOffRepo  *repository.TimeOffRepository
	auditRepo    *repository.AuditRepository
}

func NewAuthService(
	cfg *config.Config,
	db *database.DB,
	companyRepo *repository.CompanyRepository,
	employeeRepo *repository.EmployeeRepository,
	timeOffRepo *repository.TimeOffRepository,
	auditRepo *repository.AuditRepository,
) *AuthService {
	return &AuthService{
		cfg:          cfg,
		db:           db,
		companyRepo:  companyRepo,
		employeeRepo: employeeRepo,
		timeOffRepo:  timeOffRepo,
		auditRepo:    auditRepo,
	}
}

func (s *AuthService) SignUpCompany(ctx context.Context, req *domain.SignUpCompanyRequest) (*domain.AuthResponse, error) {
	// Check if company code already exists
	if _, err := s.companyRepo.GetByCode(ctx, req.CompanyCode); err == nil {
		return nil, domain.ErrCompanyExists
	}

	// Check if admin email already exists
	if _, err := s.employeeRepo.GetByEmailOrLoginID(ctx, req.Email); err == nil {
		return nil, domain.ErrEmailExists
	}

	// Hash password
	hashedPw, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	var company domain.Company
	var admin domain.Employee

	// Execute inside database transaction for ACID guarantee
	err = s.db.WithTransaction(ctx, func(tx pgx.Tx) error {
		// 1. Create company
		company = domain.Company{
			ID:      uuid.New(),
			Name:    strings.TrimSpace(req.CompanyName),
			Code:    strings.ToUpper(strings.TrimSpace(req.CompanyCode)),
			LogoURL: req.LogoURL,
		}
		if err := s.companyRepo.Create(ctx, tx, &company); err != nil {
			return err
		}

		// 2. Generate Login ID for the first Admin
		loginID := utils.GenerateLoginID(company.Code, req.FirstName, req.LastName, time.Now(), 1)

		// 3. Create Admin Employee
		admin = domain.Employee{
			ID:                uuid.New(),
			CompanyID:         company.ID,
			LoginID:           loginID,
			Email:             strings.TrimSpace(req.Email),
			PasswordHash:      &hashedPw,
			MustResetPassword: false,
			FirstName:         strings.TrimSpace(req.FirstName),
			LastName:          strings.TrimSpace(req.LastName),
			Phone:             req.Phone,
			Role:              domain.RoleAdmin,
			EmploymentStatus:  domain.StatusActive,
			DateOfJoining:     time.Now(),
		}
		if err := s.employeeRepo.Create(ctx, tx, &admin); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Ensure default time off types exist
	_ = s.timeOffRepo.EnsureDefaultTypes(ctx, company.ID)

	// Generate JWT
	token, err := utils.GenerateJWT(s.cfg.JWTSecret, s.cfg.JWTExpiryHours, &admin)
	if err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &admin.ID, "company.signup", "companies", &company.ID, map[string]string{
		"company_name": company.Name,
		"admin_email":  admin.Email,
	})

	return &domain.AuthResponse{
		Token:             token,
		MustResetPassword: admin.MustResetPassword,
		Employee:          &admin,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req *domain.LoginRequest) (*domain.AuthResponse, error) {
	emp, err := s.employeeRepo.GetByEmailOrLoginID(ctx, req.Identifier)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrInvalidCredentials
		}
		return nil, err
	}

	if emp.PasswordHash == nil || !utils.CheckPasswordHash(req.Password, *emp.PasswordHash) {
		return nil, domain.ErrInvalidCredentials
	}

	token, err := utils.GenerateJWT(s.cfg.JWTSecret, s.cfg.JWTExpiryHours, emp)
	if err != nil {
		return nil, err
	}

	_ = s.auditRepo.Log(ctx, &emp.ID, "auth.login", "employees", &emp.ID, map[string]string{
		"login_id": emp.LoginID,
	})

	return &domain.AuthResponse{
		Token:             token,
		MustResetPassword: emp.MustResetPassword,
		Employee:          emp,
	}, nil
}

func (s *AuthService) ChangePassword(ctx context.Context, employeeID uuid.UUID, req *domain.ChangePasswordRequest) error {
	emp, err := s.employeeRepo.GetByID(ctx, employeeID)
	if err != nil {
		return err
	}

	if emp.PasswordHash == nil || !utils.CheckPasswordHash(req.CurrentPassword, *emp.PasswordHash) {
		return domain.ErrInvalidCredentials
	}

	newHash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	if err := s.employeeRepo.UpdatePassword(ctx, employeeID, newHash, false); err != nil {
		return err
	}

	_ = s.auditRepo.Log(ctx, &employeeID, "auth.change_password", "employees", &employeeID, nil)
	return nil
}

func (s *AuthService) GetMe(ctx context.Context, employeeID uuid.UUID) (*domain.Employee, error) {
	return s.employeeRepo.GetByID(ctx, employeeID)
}
