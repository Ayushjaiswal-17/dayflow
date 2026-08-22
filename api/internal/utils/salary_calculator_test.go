package utils

import (
	"testing"

	"dayflow/internal/domain"
)

func TestCalculateSalaryBreakdown(t *testing.T) {
	// Test case from spec: wage = 50000, Basic = 60% of wage -> 30000, HRA = 50% of Basic -> 15000
	wage := 50000.0
	components := []domain.SalaryComponentInput{
		{Kind: domain.KindEarning, Name: "Basic Salary", CalculationType: domain.CalcPercentage, Value: 60.0, DisplayOrder: 1},
		{Kind: domain.KindEarning, Name: "House Rent Allowance (HRA)", CalculationType: domain.CalcPercentage, Value: 50.0, DisplayOrder: 2},
		{Kind: domain.KindDeduction, Name: "Provident Fund", CalculationType: domain.CalcPercentage, Value: 12.0, DisplayOrder: 3},
		{Kind: domain.KindDeduction, Name: "Professional Tax", CalculationType: domain.CalcFixed, Value: 200.0, DisplayOrder: 4},
	}

	res, err := CalculateSalaryBreakdown(wage, components)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Basic should be 30000
	var basicAmt, hraAmt, pfAmt, ptAmt float64
	for _, c := range res.Components {
		if c.Name == "Basic Salary" {
			basicAmt = c.ComputedAmount
		} else if c.Name == "House Rent Allowance (HRA)" {
			hraAmt = c.ComputedAmount
		} else if c.Name == "Provident Fund" {
			pfAmt = c.ComputedAmount
		} else if c.Name == "Professional Tax" {
			ptAmt = c.ComputedAmount
		}
	}

	if basicAmt != 30000.0 {
		t.Errorf("expected Basic Salary 30000, got %.2f", basicAmt)
	}
	if hraAmt != 15000.0 {
		t.Errorf("expected HRA 15000, got %.2f", hraAmt)
	}
	if pfAmt != 3600.0 { // 12% of 30000 Basic
		t.Errorf("expected PF 3600, got %.2f", pfAmt)
	}
	if ptAmt != 200.0 {
		t.Errorf("expected PT 200, got %.2f", ptAmt)
	}

	expectedEarnings := 45000.0 // 30000 + 15000
	expectedDeductions := 3800.0 // 3600 + 200
	expectedNet := 41200.0

	if res.TotalEarnings != expectedEarnings {
		t.Errorf("expected TotalEarnings %.2f, got %.2f", expectedEarnings, res.TotalEarnings)
	}
	if res.TotalDeductions != expectedDeductions {
		t.Errorf("expected TotalDeductions %.2f, got %.2f", expectedDeductions, res.TotalDeductions)
	}
	if res.NetSalary != expectedNet {
		t.Errorf("expected NetSalary %.2f, got %.2f", expectedNet, res.NetSalary)
	}
}

func TestCalculateSalaryBreakdown_ExceedWage(t *testing.T) {
	wage := 50000.0
	components := []domain.SalaryComponentInput{
		{Kind: domain.KindEarning, Name: "Basic Salary", CalculationType: domain.CalcPercentage, Value: 80.0, DisplayOrder: 1},
		{Kind: domain.KindEarning, Name: "Special Allowance", CalculationType: domain.CalcPercentage, Value: 50.0, DisplayOrder: 2}, // 80% + 50% = 130%
	}

	_, err := CalculateSalaryBreakdown(wage, components)
	if err == nil {
		t.Fatalf("expected error for exceeding wage amount, got nil")
	}
}
