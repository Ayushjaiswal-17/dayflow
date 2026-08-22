-- Dayflow HRMS — schema (applied automatically on first container init)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE companies (
    id          UUID PRIMARY KEY,
    name        TEXT NOT NULL,
    code        TEXT NOT NULL UNIQUE,
    logo_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('admin', 'hr_officer', 'employee');
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave', 'weekend', 'holiday');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE wage_type AS ENUM ('monthly', 'yearly');
CREATE TYPE component_kind AS ENUM ('earning', 'deduction');
CREATE TYPE calculation_type AS ENUM ('fixed', 'percentage');

CREATE TABLE employees (
    id                    UUID PRIMARY KEY,
    company_id            UUID NOT NULL REFERENCES companies(id),
    manager_id            UUID REFERENCES employees(id),
    login_id              TEXT NOT NULL UNIQUE,
    email                 TEXT NOT NULL,
    password_hash         TEXT,
    must_reset_password   BOOLEAN NOT NULL DEFAULT false,
    first_name            TEXT NOT NULL,
    last_name             TEXT NOT NULL,
    phone                 TEXT,
    profile_picture_url   TEXT,
    role                  user_role NOT NULL DEFAULT 'employee',
    department            TEXT,
    designation           TEXT,
    employment_status     employment_status NOT NULL DEFAULT 'active',
    date_of_birth         DATE,
    date_of_joining       DATE,
    address               TEXT,
    about                 TEXT,
    what_i_love_about_job TEXT,
    interests_hobbies     TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_employees_email_lower ON employees (LOWER(email));
CREATE INDEX idx_employees_company ON employees (company_id);

CREATE TABLE employee_skills (
    id          UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_certifications (
    id          UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    issued_by   TEXT,
    issue_date  DATE,
    file_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_documents (
    id          UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    doc_type    TEXT NOT NULL,
    file_url    TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attendance_records (
    id          UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date   DATE NOT NULL,
    check_in    TIMESTAMPTZ,
    check_out   TIMESTAMPTZ,
    work_hours  DOUBLE PRECISION NOT NULL DEFAULT 0,
    extra_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
    status      attendance_status NOT NULL DEFAULT 'absent',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, work_date)
);
CREATE INDEX idx_attendance_company_date ON attendance_records (work_date);

CREATE TABLE time_off_types (
    id                   UUID PRIMARY KEY,
    company_id           UUID REFERENCES companies(id),
    name                 TEXT NOT NULL,
    is_paid              BOOLEAN NOT NULL DEFAULT true,
    requires_attachment  BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_timeoff_type_company_name UNIQUE (company_id, name)
);

CREATE TABLE time_off_allocations (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id UUID NOT NULL REFERENCES time_off_types(id),
    year            INT NOT NULL,
    allocated_days  DOUBLE PRECISION NOT NULL DEFAULT 0,
    used_days       DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_allocation_emp_type_year UNIQUE (employee_id, time_off_type_id, year)
);

CREATE TABLE time_off_requests (
    id               UUID PRIMARY KEY,
    employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id UUID NOT NULL REFERENCES time_off_types(id),
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    days_requested   DOUBLE PRECISION NOT NULL,
    remarks          TEXT,
    attachment_url   TEXT,
    status           leave_status NOT NULL DEFAULT 'pending',
    reviewed_by      UUID REFERENCES employees(id),
    reviewed_at      TIMESTAMPTZ,
    review_comments  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE salary_structures (
    id                     UUID PRIMARY KEY,
    employee_id            UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    wage_type              wage_type NOT NULL DEFAULT 'monthly',
    wage_amount            NUMERIC(12,2) NOT NULL,
    working_days_per_week  INT NOT NULL DEFAULT 5,
    working_hours_per_day  DOUBLE PRECISION NOT NULL DEFAULT 8,
    effective_from         DATE NOT NULL,
    is_current             BOOLEAN NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE salary_components (
    id                  UUID PRIMARY KEY,
    salary_structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    kind                component_kind NOT NULL,
    name                TEXT NOT NULL,
    calculation_type    calculation_type NOT NULL,
    value               NUMERIC(12,2) NOT NULL,
    computed_amount     NUMERIC(12,2) NOT NULL,
    display_order       INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY,
    actor_id     UUID REFERENCES employees(id),
    action       TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id    UUID,
    metadata     JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
