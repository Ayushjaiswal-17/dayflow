# 🏢 Dayflow HRMS — Backend API

An enterprise-grade, high-performance Human Resource Management System (HRMS) backend built with **Go**, **Gin Web Framework**, and **Supabase PostgreSQL** (`pgxpool`), enforcing strict **ACID transaction guarantees**, **Role-Based Access Control (RBAC)**, and **optimized business algorithms**.

---

## 📑 Table of Contents
1. [Tech Stack & Architecture](#-tech-stack--architecture)
2. [Workflow & Business Rules](#-workflow--business-rules)
3. [Environment Configuration](#-environment-configuration)
4. [Getting Started](#-getting-started)
5. [API Routes & Examples](#-api-routes--examples)
   - [0. Health & Ping](#0-health--ping)
   - [1. Authentication & Onboarding](#1-authentication--onboarding)
   - [2. Dashboard & Stats](#2-dashboard--stats)
   - [3. Employee Management](#3-employee-management)
   - [4. Attendance Management](#4-attendance-management)
   - [5. Leave & Time-Off Management](#5-leave--time-off-management)
   - [6. Dynamic Salary & Payroll](#6-dynamic-salary--payroll)
6. [ACID Guarantees & Concurrency](#-acid-guarantees--concurrency)
7. [Running Tests](#-running-tests)
8. [Postman Collection](#-postman-collection)

---

## 🛠 Tech Stack & Architecture

- **Language:** Go 1.22+
- **HTTP Framework:** [Gin Web Framework](https://github.com/gin-gonic/gin)
- **Database:** Supabase PostgreSQL with [pgxpool](https://github.com/jackc/pgx)
- **Authentication:** Custom Signed JWT (`golang-jwt/jwt/v5`) & `bcrypt` password hashing
- **Design Pattern:** Clean Architecture (Repository $\rightarrow$ Service $\rightarrow$ Handler $\rightarrow$ Middleware)

```
api/
├── cmd/
├── internal/
│   ├── config/          # Environment & Application Config
│   ├── database/        # pgxpool PostgreSQL Connection & ACID Tx helper
│   ├── domain/          # Models, DTOs, Enums & Custom Errors
│   ├── handler/         # Gin REST Controllers & JSON Envelopes
│   ├── middleware/      # JWT Auth, RBAC, CORS, Logger, Recovery
│   ├── repository/      # Parameterized PostgreSQL Data Access Layer
│   ├── routes/          # API Route Wiring & Grouping
│   ├── service/         # Domain Business Logic
│   └── utils/           # Login ID Generator, Salary Calculator, JWT, Bcrypt
├── postman/             # Postman Collection & Environment files
├── .env.example
├── .gitignore
├── go.mod
├── go.sum
└── main.go              # Application Entry Point & Graceful Shutdown
```

---

## 🔄 Workflow & Business Rules

1. **Company Onboarding:**
   - Admin registers company and initial admin account via `POST /api/v1/auth/signup-company`.
   - The first administrator is automatically issued a generated Login ID (`[CompanyCode][Initials][Year]0001`) and JWT token.
2. **Employee Lifecycle:**
   - Employees cannot self-register; accounts are provisioned by Admin/HR officers.
   - Upon creation, the Go backend automatically computes a unique sequential **Login ID** (`[CompanyCode][Initials][Year][Serial]`) and a cryptographically random initial password.
   - `must_reset_password: true` enforces a password change upon first login via `POST /api/v1/auth/change-password`.
3. **Attendance Tracking:**
   - Employees self-service clock in and clock out for today.
   - Clocking out automatically computes `work_hours` and `extra_hours` (over 8.0 hours).
4. **Leave Management & Allocations:**
   - Each employee has allocated leave balances per year (e.g. 24 PTO, 7 Sick Leave).
   - Leave approval executes in a single database transaction with row-level locks (`SELECT ... FOR UPDATE`), atomically updating the request status and decrementing available leave balances.
5. **Salary Engine:**
   - Dynamic calculation of fixed and percentage-based components (e.g. Basic = 60% of wage, HRA = 50% of Basic, PF = 12% of Basic).
   - Component values automatically recalculate on base wage adjustments.

---

## ⚙ Environment Configuration

Create a `.env` file inside the `api/` directory (see `.env.example`):

```env
PORT=8080
ENV=development

# Supabase Connection Pooler (IPv4 Compatible)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require

# JWT Configuration
JWT_SECRET=super-secret-dayflow-jwt-token-key-change-in-production-2026
JWT_EXPIRY_HOURS=72

# Default Settings
DEFAULT_COMPANY_CODE=DF
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
go mod tidy
```

### 2. Run the Server
```bash
go run .
```
The server will start on `http://localhost:8080`.

---

## 📡 API Routes & Examples

### 0. Health & Ping

#### `GET /health`
- **Access:** Public
- **Response `200 OK`:**
```json
{
  "app": "dayflow-backend",
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 1. Authentication & Onboarding

#### `POST /api/v1/auth/signup-company`
- **Access:** Public
- **Request Body:**
```json
{
  "company_name": "Odoo Enterprises",
  "company_code": "OE",
  "logo_url": "https://example.com/logo.png",
  "first_name": "David",
  "last_name": "Owens",
  "email": "david.owens@odoo-demo.com",
  "phone": "+1 555-0100",
  "password": "AdminSecret123!"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "must_reset_password": false,
    "employee": {
      "id": "7f8b9a10-2c3d-4e5f-a6b7-c8d9e0f1a2b3",
      "company_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "login_id": "OEDO20250001",
      "email": "david.owens@odoo-demo.com",
      "first_name": "David",
      "last_name": "Owens",
      "role": "admin",
      "employment_status": "active"
    }
  }
}
```

#### `POST /api/v1/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "identifier": "OEDO20250001",
  "password": "AdminSecret123!"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "must_reset_password": false,
    "employee": {
      "id": "7f8b9a10-2c3d-4e5f-a6b7-c8d9e0f1a2b3",
      "login_id": "OEDO20250001",
      "email": "david.owens@odoo-demo.com",
      "role": "admin"
    }
  }
}
```

#### `GET /api/v1/auth/me`
- **Access:** Authenticated (Bearer Token)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "7f8b9a10-2c3d-4e5f-a6b7-c8d9e0f1a2b3",
    "login_id": "OEDO20250001",
    "email": "david.owens@odoo-demo.com",
    "first_name": "David",
    "last_name": "Owens",
    "role": "admin",
    "company_name": "Odoo Enterprises",
    "company_code": "OE"
  }
}
```

---

### 2. Dashboard & Stats

#### `GET /api/v1/dashboard/stats`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "total_employees": 12,
    "present_today_count": 9,
    "on_leave_today_count": 2,
    "pending_leave_count": 3,
    "recent_activities": [
      {
        "id": "ac-1",
        "action": "attendance.check_in",
        "entity": "attendance_records",
        "timestamp": "2025-08-22T09:00:00Z"
      }
    ]
  }
}
```

---

### 3. Employee Management

#### `GET /api/v1/employees`
- **Access:** Admin / HR Officer
- **Query Params:** `?department=Engineering&status=active`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
      "login_id": "OESJ20250002",
      "first_name": "Sarah",
      "last_name": "Jenkins",
      "email": "sarah.jenkins@odoo-demo.com",
      "role": "employee",
      "department": "Engineering",
      "designation": "Senior Engineer",
      "employment_status": "active"
    }
  ]
}
```

#### `POST /api/v1/employees`
- **Access:** Admin / HR Officer
- **Request Body:**
```json
{
  "first_name": "Sarah",
  "last_name": "Jenkins",
  "email": "sarah.jenkins@odoo-demo.com",
  "phone": "+1 555-0144",
  "role": "employee",
  "department": "Engineering",
  "designation": "Senior Engineer",
  "monthly_wage": 65000
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "login_id": "OESJ20250002",
    "generated_password": "k9#XmP2!qR",
    "employee": {
      "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
      "login_id": "OESJ20250002",
      "first_name": "Sarah",
      "last_name": "Jenkins",
      "role": "employee",
      "must_reset_password": true
    }
  }
}
```

#### `GET /api/v1/employees/:id`
- **Access:** Authenticated
- **Response `200 OK`:** Returns full employee profile including skills, certifications, documents, and manager hierarchy.

---

### 4. Attendance Management

#### `POST /api/v1/attendance/check-in`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "rec-1234",
    "work_date": "2025-08-22T00:00:00Z",
    "check_in": "2025-08-22T09:02:15Z",
    "status": "present"
  }
}
```

#### `POST /api/v1/attendance/check-out`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "rec-1234",
    "work_date": "2025-08-22T00:00:00Z",
    "check_in": "2025-08-22T09:02:15Z",
    "check_out": "2025-08-22T17:35:00Z",
    "work_hours": 8.54,
    "extra_hours": 0.54,
    "status": "present"
  }
}
```

#### `GET /api/v1/attendance/summary`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "days_present": 20,
    "days_absent": 1,
    "days_half_day": 0,
    "days_leave": 2,
    "total_working_days": 23,
    "total_hours_worked": 165.2,
    "total_extra_hours": 5.2
  }
}
```

---

### 5. Leave & Time-Off Management

#### `GET /api/v1/timeoff/types`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "t1-uuid",
      "name": "Paid Time Off",
      "is_paid": true,
      "requires_attachment": false
    },
    {
      "id": "t2-uuid",
      "name": "Sick Leave",
      "is_paid": true,
      "requires_attachment": true
    }
  ]
}
```

#### `POST /api/v1/timeoff/requests`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "time_off_type_id": "t1-uuid",
  "start_date": "2025-09-10",
  "end_date": "2025-09-12",
  "days_requested": 3,
  "remarks": "Family vacation"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "req-uuid",
    "status": "pending",
    "days_requested": 3,
    "start_date": "2025-09-10T00:00:00Z",
    "end_date": "2025-09-12T00:00:00Z"
  }
}
```

#### `PATCH /api/v1/timeoff/requests/:id/review`
- **Access:** Admin / HR Officer
- **Request Body:**
```json
{
  "status": "approved",
  "comments": "Approved by Manager"
}
```
- **Response `200 OK`:** Returns approved request with updated status and decremented leave balance.

---

### 6. Dynamic Salary & Payroll

#### `POST /api/v1/salary/calculate-preview`
- **Access:** Public / Utility
- **Request Body:**
```json
{
  "wage_amount": 50000,
  "components": [
    {
      "kind": "earning",
      "name": "Basic Salary",
      "calculation_type": "percentage",
      "value": 60,
      "display_order": 1
    },
    {
      "kind": "earning",
      "name": "House Rent Allowance (HRA)",
      "calculation_type": "percentage",
      "value": 50,
      "display_order": 2
    },
    {
      "kind": "deduction",
      "name": "Provident Fund (PF)",
      "calculation_type": "percentage",
      "value": 12,
      "display_order": 3
    },
    {
      "kind": "deduction",
      "name": "Professional Tax",
      "calculation_type": "fixed",
      "value": 200,
      "display_order": 4
    }
  ]
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "wage_amount": 50000,
    "total_earnings": 45000,
    "total_deductions": 3800,
    "net_salary": 41200,
    "components": [
      {
        "kind": "earning",
        "name": "Basic Salary",
        "calculation_type": "percentage",
        "value": 60,
        "computed_amount": 30000,
        "display_order": 1
      },
      {
        "kind": "earning",
        "name": "House Rent Allowance (HRA)",
        "calculation_type": "percentage",
        "value": 50,
        "computed_amount": 15000,
        "display_order": 2
      },
      {
        "kind": "deduction",
        "name": "Provident Fund (PF)",
        "calculation_type": "percentage",
        "value": 12,
        "computed_amount": 3600,
        "display_order": 3
      },
      {
        "kind": "deduction",
        "name": "Professional Tax",
        "calculation_type": "fixed",
        "value": 200,
        "computed_amount": 200,
        "display_order": 4
      }
    ]
  }
}
```

---

## 🔒 ACID Guarantees & Concurrency

1. **Leave Review Transaction:**
   `ReviewRequestAtomic` uses `WithTransaction` with row-level locks (`SELECT ... FOR UPDATE`) to prevent double-spending of leave balances under concurrent review attempts.
2. **Sequential Login ID Counter:**
   Queries the maximum existing sequence inside an atomic block per company/joining year to guarantee collision-free Login IDs.
3. **Salary Structure Versioning:**
   Atomically deactivates older active structures (`is_current = false`) when new structures and components are inserted.

---

## 🧪 Running Tests

```bash
cd api
go test -v ./...
```

Expected output:
```text
=== RUN   TestJWTGenerationAndValidation
--- PASS: TestJWTGenerationAndValidation (0.00s)
=== RUN   TestGenerateLoginID
--- PASS: TestGenerateLoginID (0.00s)
=== RUN   TestPasswordHashing
--- PASS: TestPasswordHashing (0.14s)
=== RUN   TestGenerateRandomPassword
--- PASS: TestGenerateRandomPassword (0.00s)
=== RUN   TestCalculateSalaryBreakdown
--- PASS: TestCalculateSalaryBreakdown (0.00s)
=== RUN   TestCalculateSalaryBreakdown_ExceedWage
--- PASS: TestCalculateSalaryBreakdown_ExceedWage (0.00s)
PASS
ok  	dayflow/internal/utils	0.812s
```

---

## 📬 Postman Collection

Import the included files in the `postman/` directory:
- Collection: `postman/Dayflow_HRMS_API.postman_collection.json`
- Environment: `postman/Dayflow_Local_Environment.postman_environment.json`
