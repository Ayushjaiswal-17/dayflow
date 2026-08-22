package domain

import (
	"time"

	"github.com/google/uuid"
)

// Enums
type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleHROfficer UserRole = "hr_officer"
	RoleEmployee  UserRole = "employee"
)

type EmploymentStatus string

const (
	StatusActive     EmploymentStatus = "active"
	StatusInactive   EmploymentStatus = "inactive"
	StatusOnLeave    EmploymentStatus = "on_leave"
	StatusTerminated EmploymentStatus = "terminated"
)

type WageType string

const (
	WageMonthly WageType = "monthly"
	WageYearly  WageType = "yearly"
)

type ComponentKind string

const (
	KindEarning   ComponentKind = "earning"
	KindDeduction ComponentKind = "deduction"
)

type CalculationType string

const (
	CalcFixed      CalculationType = "fixed"
	CalcPercentage CalculationType = "percentage"
)

type AttendanceStatus string

const (
	AttPresent AttendanceStatus = "present"
	AttAbsent  AttendanceStatus = "absent"
	AttHalfDay AttendanceStatus = "half_day"
	AttLeave   AttendanceStatus = "leave"
	AttWeekend AttendanceStatus = "weekend"
	AttHoliday AttendanceStatus = "holiday"
)

type LeaveStatus string

const (
	LeavePending   LeaveStatus = "pending"
	LeaveApproved  LeaveStatus = "approved"
	LeaveRejected  LeaveStatus = "rejected"
	LeaveCancelled LeaveStatus = "cancelled"
)

// Models

type Company struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	LogoURL   *string   `json:"logo_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Employee struct {
	ID                 uuid.UUID        `json:"id"`
	CompanyID          uuid.UUID        `json:"company_id"`
	ManagerID          *uuid.UUID       `json:"manager_id,omitempty"`
	LoginID            string           `json:"login_id"`
	Email              string           `json:"email"`
	PasswordHash       *string          `json:"-"`
	MustResetPassword  bool             `json:"must_reset_password"`
	FirstName          string           `json:"first_name"`
	LastName           string           `json:"last_name"`
	Phone              *string          `json:"phone,omitempty"`
	ProfilePictureURL  *string          `json:"profile_picture_url,omitempty"`
	Role               UserRole         `json:"role"`
	Department         *string          `json:"department,omitempty"`
	Designation        *string          `json:"designation,omitempty"`
	EmploymentStatus   EmploymentStatus `json:"employment_status"`
	DateOfBirth        *time.Time       `json:"date_of_birth,omitempty"`
	DateOfJoining      time.Time        `json:"date_of_joining"`
	Address            *string          `json:"address,omitempty"`
	About              *string          `json:"about,omitempty"`
	WhatILoveAboutJob  *string          `json:"what_i_love_about_job,omitempty"`
	InterestsHobbies   *string          `json:"interests_hobbies,omitempty"`
	CreatedAt          time.Time        `json:"created_at"`
	UpdatedAt          time.Time        `json:"updated_at"`

	// Associations populated when querying rich profiles
	ManagerName    *string                 `json:"manager_name,omitempty"`
	CompanyName    *string                 `json:"company_name,omitempty"`
	CompanyCode    *string                 `json:"company_code,omitempty"`
	Skills         []EmployeeSkill         `json:"skills,omitempty"`
	Certifications []EmployeeCertification `json:"certifications,omitempty"`
	Documents      []EmployeeDocument      `json:"documents,omitempty"`
}

type EmployeeSkill struct {
	ID         uuid.UUID `json:"id"`
	EmployeeID uuid.UUID `json:"employee_id"`
	Skill      string    `json:"skill"`
	CreatedAt  time.Time `json:"created_at"`
}

type EmployeeCertification struct {
	ID         uuid.UUID  `json:"id"`
	EmployeeID uuid.UUID  `json:"employee_id"`
	Title      string     `json:"title"`
	IssuedBy   *string    `json:"issued_by,omitempty"`
	IssueDate  *time.Time `json:"issue_date,omitempty"`
	FileURL    *string    `json:"file_url,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type EmployeeDocument struct {
	ID         uuid.UUID `json:"id"`
	EmployeeID uuid.UUID `json:"employee_id"`
	DocType    string    `json:"doc_type"`
	FileURL    string    `json:"file_url"`
	UploadedAt time.Time `json:"uploaded_at"`
}

type SalaryStructure struct {
	ID                 uuid.UUID         `json:"id"`
	EmployeeID         uuid.UUID         `json:"employee_id"`
	WageType           WageType          `json:"wage_type"`
	WageAmount         float64           `json:"wage_amount"`
	WorkingDaysPerWeek int               `json:"working_days_per_week"`
	WorkingHoursPerDay float64           `json:"working_hours_per_day"`
	EffectiveFrom      time.Time         `json:"effective_from"`
	IsCurrent          bool              `json:"is_current"`
	CreatedAt          time.Time         `json:"created_at"`
	UpdatedAt          time.Time         `json:"updated_at"`
	Components         []SalaryComponent `json:"components,omitempty"`
}

type SalaryComponent struct {
	ID                uuid.UUID       `json:"id"`
	SalaryStructureID uuid.UUID       `json:"salary_structure_id"`
	Kind              ComponentKind   `json:"kind"`
	Name              string          `json:"name"`
	CalculationType   CalculationType `json:"calculation_type"`
	Value             float64         `json:"value"`
	ComputedAmount    float64         `json:"computed_amount"`
	DisplayOrder      int             `json:"display_order"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

type AttendanceRecord struct {
	ID         uuid.UUID        `json:"id"`
	EmployeeID uuid.UUID        `json:"employee_id"`
	WorkDate   time.Time        `json:"work_date"`
	CheckIn    *time.Time       `json:"check_in,omitempty"`
	CheckOut   *time.Time       `json:"check_out,omitempty"`
	WorkHours  *float64         `json:"work_hours,omitempty"`
	ExtraHours float64          `json:"extra_hours"`
	Status     AttendanceStatus `json:"status"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`

	// Extra fields for rich employee joins
	EmployeeName  *string `json:"employee_name,omitempty"`
	EmployeeRole  *string `json:"employee_role,omitempty"`
	EmployeeAvatar *string `json:"employee_avatar,omitempty"`
	Department    *string `json:"department,omitempty"`
}

type TimeOffType struct {
	ID                 uuid.UUID  `json:"id"`
	CompanyID          *uuid.UUID `json:"company_id,omitempty"`
	Name               string     `json:"name"`
	IsPaid             bool       `json:"is_paid"`
	RequiresAttachment bool       `json:"requires_attachment"`
	CreatedAt          time.Time  `json:"created_at"`
}

type TimeOffAllocation struct {
	ID             uuid.UUID `json:"id"`
	EmployeeID     uuid.UUID `json:"employee_id"`
	TimeOffTypeID  uuid.UUID `json:"time_off_type_id"`
	Year           int       `json:"year"`
	AllocatedDays  float64   `json:"allocated_days"`
	UsedDays       float64   `json:"used_days"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Extra fields
	TimeOffTypeName *string `json:"time_off_type_name,omitempty"`
	IsPaid          *bool   `json:"is_paid,omitempty"`
}

type TimeOffRequest struct {
	ID             uuid.UUID   `json:"id"`
	EmployeeID     uuid.UUID   `json:"employee_id"`
	TimeOffTypeID  uuid.UUID   `json:"time_off_type_id"`
	StartDate      time.Time   `json:"start_date"`
	EndDate        time.Time   `json:"end_date"`
	DaysRequested  float64     `json:"days_requested"`
	Remarks        *string     `json:"remarks,omitempty"`
	AttachmentURL  *string     `json:"attachment_url,omitempty"`
	Status         LeaveStatus `json:"status"`
	ReviewedBy     *uuid.UUID  `json:"reviewed_by,omitempty"`
	ReviewedAt     *time.Time  `json:"reviewed_at,omitempty"`
	ReviewComments *string     `json:"review_comments,omitempty"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`

	// Joins
	EmployeeName    *string `json:"employee_name,omitempty"`
	EmployeeRole    *string `json:"employee_role,omitempty"`
	EmployeeAvatar  *string `json:"employee_avatar,omitempty"`
	TimeOffTypeName *string `json:"time_off_type_name,omitempty"`
	ReviewerName    *string `json:"reviewer_name,omitempty"`
}

type AuditLog struct {
	ID          uuid.UUID  `json:"id"`
	ActorID     *uuid.UUID `json:"actor_id,omitempty"`
	Action      string     `json:"action"`
	EntityTable string     `json:"entity_table"`
	EntityID    *uuid.UUID `json:"entity_id,omitempty"`
	Metadata    any        `json:"metadata,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}
