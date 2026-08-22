package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"dayflow/internal/database"
	"dayflow/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type SalaryRepository struct {
	db *database.DB
}

func NewSalaryRepository(db *database.DB) *SalaryRepository {
	return &SalaryRepository{db: db}
}

// GetCurrentByEmployeeID retrieves the active salary structure and all its components
func (r *SalaryRepository) GetCurrentByEmployeeID(ctx context.Context, employeeID uuid.UUID) (*domain.SalaryStructure, error) {
	query := `
		SELECT id, employee_id, wage_type, wage_amount, working_days_per_week, working_hours_per_day,
		       effective_from, is_current, created_at, updated_at
		FROM salary_structures
		WHERE employee_id = $1 AND is_current = true
		LIMIT 1
	`
	var s domain.SalaryStructure
	err := r.db.Pool.QueryRow(ctx, query, employeeID).Scan(
		&s.ID, &s.EmployeeID, &s.WageType, &s.WageAmount, &s.WorkingDaysPerWeek,
		&s.WorkingHoursPerDay, &s.EffectiveFrom, &s.IsCurrent, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("failed to get current salary structure: %w", err)
	}

	components, err := r.GetComponentsByStructureID(ctx, s.ID)
	if err != nil {
		return nil, err
	}
	s.Components = components
	return &s, nil
}

func (r *SalaryRepository) GetComponentsByStructureID(ctx context.Context, structureID uuid.UUID) ([]domain.SalaryComponent, error) {
	query := `
		SELECT id, salary_structure_id, kind, name, calculation_type, value, computed_amount, display_order, created_at, updated_at
		FROM salary_components
		WHERE salary_structure_id = $1
		ORDER BY display_order ASC, created_at ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, structureID)
	if err != nil {
		return nil, fmt.Errorf("failed to query salary components: %w", err)
	}
	defer rows.Close()

	var components []domain.SalaryComponent
	for rows.Next() {
		var c domain.SalaryComponent
		if err := rows.Scan(
			&c.ID, &c.SalaryStructureID, &c.Kind, &c.Name, &c.CalculationType,
			&c.Value, &c.ComputedAmount, &c.DisplayOrder, &c.CreatedAt, &c.UpdatedAt,
		); err == nil {
			components = append(components, c)
		}
	}
	return components, nil
}

// UpsertStructure atomically deactivates older current structures and creates a new version with components
func (r *SalaryRepository) UpsertStructure(
	ctx context.Context,
	employeeID uuid.UUID,
	wageType domain.WageType,
	wageAmount float64,
	daysPerWeek int,
	hoursPerDay float64,
	effectiveFrom time.Time,
	components []domain.ComputedSalaryComponent,
) (*domain.SalaryStructure, error) {
	var createdStructure domain.SalaryStructure

	err := r.db.WithTransaction(ctx, func(tx pgx.Tx) error {
		// 1. Deactivate old current structures
		deactivateQuery := `
			UPDATE salary_structures
			SET is_current = false, updated_at = NOW()
			WHERE employee_id = $1 AND is_current = true
		`
		if _, err := tx.Exec(ctx, deactivateQuery, employeeID); err != nil {
			return fmt.Errorf("failed to deactivate previous salary structure: %w", err)
		}

		// 2. Insert new structure
		newID := uuid.New()
		insertStructQuery := `
			INSERT INTO salary_structures (
				id, employee_id, wage_type, wage_amount, working_days_per_week,
				working_hours_per_day, effective_from, is_current, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
			)
			RETURNING id, employee_id, wage_type, wage_amount, working_days_per_week, working_hours_per_day, effective_from, is_current, created_at, updated_at
		`
		err := tx.QueryRow(ctx, insertStructQuery,
			newID, employeeID, wageType, wageAmount, daysPerWeek, hoursPerDay, effectiveFrom,
		).Scan(
			&createdStructure.ID, &createdStructure.EmployeeID, &createdStructure.WageType,
			&createdStructure.WageAmount, &createdStructure.WorkingDaysPerWeek,
			&createdStructure.WorkingHoursPerDay, &createdStructure.EffectiveFrom,
			&createdStructure.IsCurrent, &createdStructure.CreatedAt, &createdStructure.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert new salary structure: %w", err)
		}

		// 3. Insert components
		insertCompQuery := `
			INSERT INTO salary_components (
				id, salary_structure_id, kind, name, calculation_type, value, computed_amount, display_order, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
			)
		`
		var savedComponents []domain.SalaryComponent
		for _, c := range components {
			compID := uuid.New()
			_, err := tx.Exec(ctx, insertCompQuery,
				compID, createdStructure.ID, c.Kind, c.Name, c.CalculationType, c.Value, c.ComputedAmount, c.DisplayOrder,
			)
			if err != nil {
				return fmt.Errorf("failed to insert salary component %s: %w", c.Name, err)
			}
			savedComponents = append(savedComponents, domain.SalaryComponent{
				ID:                compID,
				SalaryStructureID: createdStructure.ID,
				Kind:              c.Kind,
				Name:              c.Name,
				CalculationType:   c.CalculationType,
				Value:             c.Value,
				ComputedAmount:    c.ComputedAmount,
				DisplayOrder:      c.DisplayOrder,
			})
		}
		createdStructure.Components = savedComponents
		return nil
	})

	if err != nil {
		return nil, err
	}
	return &createdStructure, nil
}
