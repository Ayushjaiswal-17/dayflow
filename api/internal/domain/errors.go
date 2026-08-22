package domain

import "errors"

var (
	ErrNotFound            = errors.New("record not found")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrForbidden           = errors.New("forbidden: insufficient permissions")
	ErrInvalidCredentials  = errors.New("invalid email/login ID or password")
	ErrEmailExists         = errors.New("email is already registered")
	ErrCompanyExists       = errors.New("company code or name is already registered")
	ErrInvalidInput        = errors.New("invalid request input")
	ErrMustResetPassword   = errors.New("password reset is required before continuing")
	ErrAlreadyCheckedIn    = errors.New("employee is already checked in for today")
	ErrNotCheckedIn        = errors.New("no active check-in found for today")
	ErrAlreadyCheckedOut   = errors.New("employee is already checked out for today")
	ErrInsufficientLeave   = errors.New("insufficient leave balance available")
	ErrRequestAlreadyProcessed = errors.New("leave request has already been reviewed")
	ErrInvalidDateRange    = errors.New("end date must be greater than or equal to start date")
	ErrSalaryComponentExceeded = errors.New("total calculated salary earnings exceed wage amount")
)
