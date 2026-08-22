package domain

import (
	"time"

	"github.com/google/uuid"
)

// Auth DTOs
type SignUpCompanyRequest struct {
	CompanyName string  `json:"company_name" binding:"required"`
	CompanyCode string  `json:"company_code" binding:"required"`
	LogoURL     *string `json:"logo_url"`
	FirstName   string  `json:"first_name" binding:"required"`
	LastName    string  `json:"last_name" binding:"required"`
	Email       string  `json:"email" binding:"required,email"`
	Phone       *string `json:"phone"`
	Password    string  `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"` // Email or Login ID
	Password   string `json:"password" binding:"required"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

type AuthResponse struct {
	Token             string    `json:"token"`
	MustResetPassword bool      `json:"must_reset_password"`
	Employee          *Employee `json:"employee"`
}

// Employee DTOs
type CreateEmployeeRequest struct {
	FirstName         string     `json:"first_name" binding:"required"`
	LastName          string     `json:"last_name" binding:"required"`
	Email             string     `json:"email" binding:"required,email"`
	Phone             *string    `json:"phone"`
	Role              UserRole   `json:"role" binding:"required"`
	Department        *string    `json:"department"`
	Designation       *string    `json:"designation"`
	ManagerID         *uuid.UUID `json:"manager_id"`
	DateOfBirth       *time.Time `json:"date_of_birth"`
	DateOfJoining     *time.Time `json:"date_of_joining"`
	Address           *string    `json:"address"`
	About             *string    `json:"about"`
	WhatILoveAboutJob *string    `json:"what_i_love_about_job"`
	InterestsHobbies  *string    `json:"interests_hobbies"`
	MonthlyWage       *float64   `json:"monthly_wage"` // Optional initial salary setup
}

type CreateEmployeeResponse struct {
	Employee      *Employee `json:"employee"`
	GeneratedPass string    `json:"generated_password"`
	LoginID       string    `json:"login_id"`
}

type UpdateEmployeeProfileRequest struct {
	// Fields employees can update on self, or admin can update
	FirstName         *string           `json:"first_name"`
	LastName          *string           `json:"last_name"`
	Phone             *string           `json:"phone"`
	ProfilePictureURL *string           `json:"profile_picture_url"`
	Address           *string           `json:"address"`
	About             *string           `json:"about"`
	WhatILoveAboutJob *string           `json:"what_i_love_about_job"`
	InterestsHobbies  *string           `json:"interests_hobbies"`
	DateOfBirth       *time.Time        `json:"date_of_birth"`
	
	// Admin-only fields
	Department        *string           `json:"department"`
	Designation       *string           `json:"designation"`
	Role              *UserRole         `json:"role"`
	EmploymentStatus  *EmploymentStatus `json:"employment_status"`
	ManagerID         *uuid.UUID        `json:"manager_id"`
	DateOfJoining     *time.Time        `json:"date_of_joining"`
}

type AddSkillRequest struct {
	Skill string `json:"skill" binding:"required"`
}

type AddCertificationRequest struct {
	Title     string     `json:"title" binding:"required"`
	IssuedBy  *string    `json:"issued_by"`
	IssueDate *time.Time `json:"issue_date"`
	FileURL   *string    `json:"file_url"`
}

type AddDocumentRequest struct {
	DocType string `json:"doc_type" binding:"required"`
	FileURL string `json:"file_url" binding:"required"`
}

// Attendance DTOs
type CheckInRequest struct {
	WorkDate *time.Time `json:"work_date"` // Defaults to today if omitted
}

type CheckOutRequest struct {
	WorkDate *time.Time `json:"work_date"` // Defaults to today if omitted
}

type AttendanceFilter struct {
	EmployeeID *uuid.UUID `form:"employee_id"`
	StartDate  *time.Time `form:"start_date" time_format:"2006-01-02"`
	EndDate    *time.Time `form:"end_date" time_format:"2006-01-02"`
	Status     *string    `form:"status"`
}

type AttendanceSummaryResponse struct {
	DaysPresent       int     `json:"days_present"`
	DaysAbsent        int     `json:"days_absent"`
	DaysHalfDay       int     `json:"days_half_day"`
	DaysLeave         int     `json:"days_leave"`
	TotalWorkingDays  int     `json:"total_working_days"`
	TotalHoursWorked  float64 `json:"total_hours_worked"`
	TotalExtraHours   float64 `json:"total_extra_hours"`
}

// Time Off DTOs
type CreateLeaveRequestDTO struct {
	TimeOffTypeID uuid.UUID `json:"time_off_type_id" binding:"required"`
	StartDate     string    `json:"start_date" binding:"required"` // Format: YYYY-MM-DD
	EndDate       string    `json:"end_date" binding:"required"`   // Format: YYYY-MM-DD
	DaysRequested float64   `json:"days_requested" binding:"required,gt=0"`
	Remarks       *string   `json:"remarks"`
	AttachmentURL *string   `json:"attachment_url"`
}

type ReviewLeaveRequestDTO struct {
	Status   LeaveStatus `json:"status" binding:"required"` // approved or rejected
	Comments *string     `json:"comments"`
}

type UpsertAllocationDTO struct {
	EmployeeID    uuid.UUID `json:"employee_id" binding:"required"`
	TimeOffTypeID uuid.UUID `json:"time_off_type_id" binding:"required"`
	Year          int       `json:"year" binding:"required"`
	AllocatedDays float64   `json:"allocated_days" binding:"required,gte=0"`
}

// Salary DTOs
type SalaryComponentInput struct {
	Kind            ComponentKind   `json:"kind" binding:"required"`
	Name            string          `json:"name" binding:"required"`
	CalculationType CalculationType `json:"calculation_type" binding:"required"`
	Value           float64         `json:"value" binding:"gte=0"`
	DisplayOrder    int             `json:"display_order"`
}

type UpsertSalaryStructureRequest struct {
	WageType           WageType               `json:"wage_type" binding:"required"`
	WageAmount         float64                `json:"wage_amount" binding:"required,gt=0"`
	WorkingDaysPerWeek int                    `json:"working_days_per_week" binding:"required,min=1,max=7"`
	WorkingHoursPerDay float64                `json:"working_hours_per_day" binding:"required,min=1,max=24"`
	EffectiveFrom      *time.Time             `json:"effective_from"`
	Components         []SalaryComponentInput `json:"components"`
}

type SalaryPreviewRequest struct {
	WageAmount float64                `json:"wage_amount" binding:"required,gt=0"`
	Components []SalaryComponentInput `json:"components"`
}

type ComputedSalaryComponent struct {
	Kind            ComponentKind   `json:"kind"`
	Name            string          `json:"name"`
	CalculationType CalculationType `json:"calculation_type"`
	Value           float64         `json:"value"`
	ComputedAmount  float64         `json:"computed_amount"`
	DisplayOrder    int             `json:"display_order"`
}

type SalaryPreviewResponse struct {
	WageAmount      float64                   `json:"wage_amount"`
	TotalEarnings   float64                   `json:"total_earnings"`
	TotalDeductions float64                   `json:"total_deductions"`
	NetSalary       float64                   `json:"net_salary"`
	Components      []ComputedSalaryComponent `json:"components"`
}

// Dashboard DTOs
type DashboardStatsResponse struct {
	TotalEmployees    int                      `json:"total_employees"`
	PresentTodayCount int                      `json:"present_today_count"`
	OnLeaveTodayCount int                      `json:"on_leave_today_count"`
	PendingLeaveCount int                      `json:"pending_leave_count"`
	RecentActivities  []map[string]interface{} `json:"recent_activities"`
}
