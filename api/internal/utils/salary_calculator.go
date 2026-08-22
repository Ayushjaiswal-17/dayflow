package utils

import (
	"fmt"
	"math"
	"strings"

	"dayflow/internal/domain"
)

// CalculateSalaryBreakdown computes each component's actual amount based on wage amount and rules:
// - Fixed components take their value directly.
// - Percentage components:
//   - "basic" or "basic salary" evaluates against the base wage amount (e.g. 60% of 50000 = 30000).
//   - other percentage earnings/deductions (like HRA, PF) evaluate against Basic Salary (if Basic exists), otherwise against Wage.
// - Validates that total earnings do not exceed the defined base wage.
func CalculateSalaryBreakdown(wageAmount float64, components []domain.SalaryComponentInput) (*domain.SalaryPreviewResponse, error) {
	if wageAmount <= 0 {
		return nil, fmt.Errorf("wage amount must be positive")
	}

	computed := make([]domain.ComputedSalaryComponent, len(components))
	var basicAmount float64 = 0

	// Step 1: First pass to identify Basic Salary (if present)
	for i, c := range components {
		nameLower := strings.ToLower(strings.TrimSpace(c.Name))
		if strings.Contains(nameLower, "basic") {
			var amt float64
			if c.CalculationType == domain.CalcPercentage {
				amt = (c.Value / 100.0) * wageAmount
			} else {
				amt = c.Value
			}
			basicAmount = round2(amt)
			computed[i] = domain.ComputedSalaryComponent{
				Kind:            c.Kind,
				Name:            c.Name,
				CalculationType: c.CalculationType,
				Value:           c.Value,
				ComputedAmount:  basicAmount,
				DisplayOrder:    c.DisplayOrder,
			}
			break
		}
	}

	// Step 2: Compute all remaining components
	var totalEarnings float64 = 0
	var totalDeductions float64 = 0

	for i, c := range components {
		nameLower := strings.ToLower(strings.TrimSpace(c.Name))
		if strings.Contains(nameLower, "basic") {
			// Already computed in Step 1
			if c.Kind == domain.KindEarning {
				totalEarnings += computed[i].ComputedAmount
			} else {
				totalDeductions += computed[i].ComputedAmount
			}
			continue
		}

		var amount float64
		if c.CalculationType == domain.CalcFixed {
			amount = round2(c.Value)
		} else { // Percentage
			// If basic amount is available and component name isn't explicitly based on total wage,
			// common HR calculations (HRA, PF) are % of Basic. If basicAmount == 0, fallback to wageAmount.
			base := basicAmount
			if base <= 0 || strings.Contains(nameLower, "bonus") || strings.Contains(nameLower, "wage") {
				base = wageAmount
			}
			amount = round2((c.Value / 100.0) * base)
		}

		computed[i] = domain.ComputedSalaryComponent{
			Kind:            c.Kind,
			Name:            c.Name,
			CalculationType: c.CalculationType,
			Value:           c.Value,
			ComputedAmount:  amount,
			DisplayOrder:    c.DisplayOrder,
		}

		if c.Kind == domain.KindEarning {
			totalEarnings += amount
		} else {
			totalDeductions += amount
		}
	}

	totalEarnings = round2(totalEarnings)
	totalDeductions = round2(totalDeductions)
	netSalary := round2(totalEarnings - totalDeductions)

	// Validate earnings vs base wage
	if totalEarnings > wageAmount+0.01 { // Account for small floating point rounding
		return nil, fmt.Errorf("%w: total earnings (%.2f) exceed wage amount (%.2f)", domain.ErrSalaryComponentExceeded, totalEarnings, wageAmount)
	}

	return &domain.SalaryPreviewResponse{
		WageAmount:      wageAmount,
		TotalEarnings:   totalEarnings,
		TotalDeductions: totalDeductions,
		NetSalary:       netSalary,
		Components:      computed,
	}, nil
}

func round2(val float64) float64 {
	return math.Round(val*100) / 100
}
