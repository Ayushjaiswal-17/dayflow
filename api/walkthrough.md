# Dayflow HRMS — Backend Implementation Walkthrough


---

## 1. Project Architecture & File Structure

```
api/
├── go.mod
├── go.sum
├── .env.example
├── .env
├── main.go                                  # Application entry point with graceful shutdown
└── internal/
    ├── config/
    │   └── config.go                        # Environment variable management
    ├── database/
    │   ├── postgres.go                      # pgxpool PostgreSQL connection pool
    │   └── tx.go                            # ACID Transaction manager (WithTransaction)
    ├── domain/
    │   ├── models.go                        # Entity structs & Postgres enum mappings
    │   ├── dto.go                           # Request/Response DTOs with validation
    │   └── errors.go                        # Domain errors
    ├── utils/
    │   ├── password.go                      # Bcrypt hashing & random password generation
    │   ├── jwt.go                           # Signed JWT claims generation & validation
    │   ├── login_id.go                      # Spec Login ID generator: [Code][Initials][Year][Serial]
    │   └── salary_calculator.go             # Dynamic salary engine (fixed & percentage math)
    ├── repository/
    │   ├── company_repo.go                  # Company CRUD
    │   ├── employee_repo.go                 # Employee profile, skills, certs, docs, serials
    │   ├── attendance_repo.go               # Check-in, check-out, history, aggregations
    │   ├── salary_repo.go                   # Salary structures & dynamic components
    │   ├── timeoff_repo.go                  # Leave types, allocations & atomic review tx
    │   └── audit_repo.go                    # Audit logging for mutations
    ├── service/
    │   ├── auth_service.go                  # Signup, login, password reset, me
    │   ├── employee_service.go              # Employee onboarding with login_id generator
    │   ├── attendance_service.go            # Work hours, extra hours calculation
    │   ├── salary_service.go                # Salary computation & structure versioning
    │   ├── timeoff_service.go               # Leave applications & allocation decrementing
    │   └── dashboard_service.go             # Team stats, counts & activity feeds
    ├── middleware/
    │   ├── auth.go                          # Bearer JWT verification
    │   ├── rbac.go                          # Role-Based Access Control (Admin/HR vs Employee)
    │   ├── cors.go                          # Configurable CORS handling
    │   ├── logger.go                        # Structured HTTP logging
    │   └── recovery.go                      # Panic recovery
    ├── handler/
    │   ├── response.go                      # Standardized JSON response envelope
    │   ├── auth_handler.go                  # Auth controllers
    │   ├── employee_handler.go              # Employee controllers
    │   ├── attendance_handler.go            # Attendance controllers
    │   ├── timeoff_handler.go               # Time-off controllers
    │   ├── salary_handler.go                # Salary controllers
    │   └── dashboard_handler.go             # Dashboard controller
    └── routes/
        └── routes.go                        # Gin engine and route group wiring
```

---

## 2. Key Architecture Highlights & ACID Guarantees

1. **ACID Transaction Management:**
   - **Leave Approvals (`ReviewRequestAtomic`):** Updates leave request status to `approved` and decrements allocation balance inside a single database transaction with row-level locks (`SELECT ... FOR UPDATE`), eliminating race conditions under high concurrency.
   - **Company Signup & First Admin:** Atomic insertion of company and initial administrator account.
   - **Salary Structure Versioning:** Atomically archives previous active salary structures and inserts new salary components.

2. **Fault Tolerance & Connection Pooling:**
   - Direct connection to Supabase PostgreSQL using `pgxpool` with tuned pool size, health-checks, max lifetime, and idle limits.

3. **Core Algorithmic Business Logic:**
   - **Login ID Generator:** Adheres strictly to the specification format: `[Company Code][Initials][Year][Serial]` (e.g. `OEDO20250001`).
   - **Dynamic Salary Engine:** Computes percentages (e.g. Basic = 60% of wage, HRA = 50% of Basic), validates that total earnings do not exceed base wage, and computes net salary in $O(N)$ time.

---

## 3. Implemented REST API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service health status |
| `GET` | `/ping` | Public | Ping check |
| `POST` | `/api/v1/auth/signup-company` | Public | Register company + initial admin |
| `POST` | `/api/v1/auth/login` | Public | Login with Email / Login ID + Password |
| `POST` | `/api/v1/salary/calculate-preview` | Public | Preview salary component breakdowns |
| `GET` | `/api/v1/auth/me` | Authenticated | Current user profile & permissions |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Change temporary/current password |
| `GET` | `/api/v1/dashboard/stats` | Authenticated | Dashboard counters & recent activities |
| `GET` | `/api/v1/employees` | Admin / HR | List all employees (filter by dept/status) |
| `POST` | `/api/v1/employees` | Admin / HR | Create employee (auto Login ID & password) |
| `GET` | `/api/v1/employees/:id` | Authenticated | View employee profile |
| `PUT` | `/api/v1/employees/:id` | Authenticated | Update profile (RBAC scoped) |
| `POST` | `/api/v1/employees/:id/skills` | Authenticated | Add skill |
| `DELETE` | `/api/v1/employees/:id/skills/:skillId` | Authenticated | Delete skill |
| `POST` | `/api/v1/employees/:id/certifications` | Authenticated | Add certification |
| `DELETE` | `/api/v1/employees/:id/certifications/:certId` | Authenticated | Delete certification |
| `POST` | `/api/v1/employees/:id/documents` | Authenticated | Upload/Attach document |
| `POST` | `/api/v1/attendance/check-in` | Authenticated | Clock in for today |
| `POST` | `/api/v1/attendance/check-out` | Authenticated | Clock out for today |
| `GET` | `/api/v1/attendance/my` | Authenticated | User's attendance records |
| `GET` | `/api/v1/attendance/summary` | Authenticated | Attendance summary metrics |
| `GET` | `/api/v1/attendance` | Admin / HR | Company-wide attendance view |
| `GET` | `/api/v1/timeoff/types` | Authenticated | List leave types (Paid, Sick, Unpaid) |
| `GET` | `/api/v1/timeoff/allocations` | Authenticated | View yearly leave balances |
| `POST` | `/api/v1/timeoff/requests` | Authenticated | Submit leave application |
| `GET` | `/api/v1/timeoff/requests` | Authenticated | List leave applications |
| `PATCH` | `/api/v1/timeoff/requests/:id/review` | Admin / HR | Approve or Reject leave request |
| `POST` | `/api/v1/timeoff/allocations` | Admin / HR | Update/Set leave balances |
| `GET` | `/api/v1/salary/my` | Authenticated | View own salary breakdown (read-only) |
| `GET` | `/api/v1/salary/employees/:id` | Admin / HR | View employee salary breakdown |
| `POST` | `/api/v1/salary/employees/:id` | Admin | Upsert salary structure & components |

---

## 4. Verification & Testing

All unit tests passed with 100% success:
- `TestJWTGenerationAndValidation`: PASS
- `TestGenerateLoginID`: PASS
- `TestPasswordHashing`: PASS
- `TestGenerateRandomPassword`: PASS
- `TestCalculateSalaryBreakdown`: PASS
- `TestCalculateSalaryBreakdown_ExceedWage`: PASS
