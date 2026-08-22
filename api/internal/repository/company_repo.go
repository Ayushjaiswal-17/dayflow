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

type CompanyRepository struct {
	db *database.DB
}

func NewCompanyRepository(db *database.DB) *CompanyRepository {
	return &CompanyRepository{db: db}
}

func (r *CompanyRepository) Create(ctx context.Context, tx database.DBTX, company *domain.Company) error {
	if tx == nil {
		tx = r.db.Pool
	}

	query := `
		INSERT INTO companies (id, name, code, logo_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING created_at, updated_at
	`
	if company.ID == uuid.Nil {
		company.ID = uuid.New()
	}

	err := tx.QueryRow(ctx, query, company.ID, company.Name, company.Code, company.LogoURL).
		Scan(&company.CreatedAt, &company.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create company: %w", err)
	}
	return nil
}

func (r *CompanyRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Company, error) {
	query := `
		SELECT id, name, code, logo_url, created_at, updated_at
		FROM companies
		WHERE id = $1
	`
	var c domain.Company
	err := r.db.Pool.QueryRow(ctx, query, id).
		Scan(&c.ID, &c.Name, &c.Code, &c.LogoURL, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get company by ID: %w", err)
	}
	return &c, nil
}

func (r *CompanyRepository) GetByCode(ctx context.Context, code string) (*domain.Company, error) {
	query := `
		SELECT id, name, code, logo_url, created_at, updated_at
		FROM companies
		WHERE code = $1
	`
	var c domain.Company
	err := r.db.Pool.QueryRow(ctx, query, code).
		Scan(&c.ID, &c.Name, &c.Code, &c.LogoURL, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get company by code: %w", err)
	}
	return &c, nil
}
