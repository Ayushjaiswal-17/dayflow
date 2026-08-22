-- Dayflow HRMS — demo seed (matches the frontend demo credentials)
-- Passwords are hashed with pgcrypto bcrypt ($2a$), compatible with Go's bcrypt.

INSERT INTO companies (id, name, code)
VALUES ('11111111-1111-1111-1111-111111111111', 'Oidos India', 'OI');

INSERT INTO employees (id, company_id, manager_id, login_id, email, password_hash,
                       first_name, last_name, role, department, designation,
                       date_of_joining, date_of_birth, phone, about) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', NULL,
   'OIAAME20220001', 'aarav.mehta@oidos.in',
   crypt('Admin@123', gen_salt('bf', 10)),
   'Aarav', 'Mehta', 'admin', 'Leadership', 'Chief Executive Officer',
   DATE '2022-01-03', DATE '1988-04-12', '+91 98200 10001', 'Runs the ship.'),
  ('aaaaaaa1-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111',
   'aaaaaaa1-0000-4000-8000-000000000001',
   'OIPRSH20220002', 'priya.sharma@oidos.in',
   crypt('Hr@12345', gen_salt('bf', 10)),
   'Priya', 'Sharma', 'hr_officer', 'People Ops', 'HR Officer',
   DATE '2022-03-14', DATE '1992-09-21', '+91 98200 10002', 'Keeps the people engine humming.'),
  ('aaaaaaa1-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111',
   'aaaaaaa1-0000-4000-8000-000000000001',
   'OITODO20220001', 'tom.doe@oidos.in',
   crypt('Dayflow@123', gen_salt('bf', 10)),
   'Tom', 'Doe', 'employee', 'Engineering', 'Software Engineer',
   DATE '2022-06-06', DATE '1996-02-08', '+91 98200 10003', 'Ships code, drinks chai.');

-- Leave types
INSERT INTO time_off_types (id, company_id, name, is_paid, requires_attachment) VALUES
  ('bbbbbbb1-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Paid Time Off', true, false),
  ('bbbbbbb1-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sick Leave', true, true),
  ('bbbbbbb1-0000-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Unpaid Leave', false, false);

-- Allocations for current year (PTO 24 / Sick 7)
INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, year, allocated_days, used_days)
SELECT gen_random_uuid(), e.id, t.id, EXTRACT(YEAR FROM CURRENT_DATE)::INT,
       CASE WHEN t.name = 'Paid Time Off' THEN 24 WHEN t.name = 'Sick Leave' THEN 7 ELSE 0 END,
       0
FROM employees e
CROSS JOIN time_off_types t
WHERE t.name IN ('Paid Time Off', 'Sick Leave');

-- Salary structures + components (Basic 50% of wage; HRA 50% of Basic; PF 12% of Basic)
INSERT INTO salary_structures (id, employee_id, wage_type, wage_amount, working_days_per_week, working_hours_per_day, effective_from, is_current)
SELECT gen_random_uuid(), e.id, 'monthly', w.wage, 5, 8, DATE '2026-01-01', true
FROM (
  VALUES
    ('aarav.mehta@oidos.in', 250000.00),
    ('priya.sharma@oidos.in', 120000.00),
    ('tom.doe@oidos.in', 50000.00)
) AS w(email, wage)
JOIN employees e ON e.email = w.email;

INSERT INTO salary_components (id, salary_structure_id, kind, name, calculation_type, value, computed_amount, display_order)
SELECT gen_random_uuid(), s.id, c.kind::component_kind, c.name,
       c.calc::calculation_type, c.pct,
       ROUND(CASE WHEN c.calc = 'fixed' THEN c.pct ELSE s.wage_amount * c.factor END, 2), c.seq
FROM salary_structures s
CROSS JOIN (VALUES
  (1, 'earning',   'Basic',                'percentage', 50.0, 0.50),
  (2, 'earning',   'House Rent Allowance', 'percentage', 25.0, 0.25),
  (3, 'deduction', 'Provident Fund',       'percentage', 12.0, 0.12),
  (4, 'deduction', 'Professional Tax',     'fixed',      200.0, 200.0)
) AS c(seq, kind, name, calc, pct, factor)
ORDER BY s.employee_id, c.seq;

-- Attendance history: past 30 days, weekdays present 09:07–17:42 (~8.58h). Today left open for check-in.
INSERT INTO attendance_records (id, employee_id, work_date, check_in, check_out, work_hours, extra_hours, status)
SELECT gen_random_uuid(), e.id, d.day,
       d.day + TIME '09:07', d.day + TIME '17:42', 8.58, 0.58, 'present'
FROM employees e
CROSS JOIN (
    SELECT CURRENT_DATE - offs AS day
    FROM generate_series(1, 30) AS offs
) d
WHERE EXTRACT(ISODOW FROM d.day) < 6;

-- A pending leave request for Tom next Monday-Tuesday
INSERT INTO time_off_requests (id, employee_id, time_off_type_id, start_date, end_date, days_requested, remarks, status)
VALUES ('fffffff1-0000-4000-8000-000000000001',
        'aaaaaaa1-0000-4000-8000-000000000003',
        'bbbbbbb1-0000-4000-8000-000000000001',
        date_trunc('week', CURRENT_DATE)::date + 14, date_trunc('week', CURRENT_DATE)::date + 15,
        2, 'Family function out of town.', 'pending');

INSERT INTO audit_logs (id, actor_id, action, entity_table, entity_id, metadata)
VALUES (gen_random_uuid(), NULL, 'system.seed', 'system', NULL, '{"seed": "demo"}');
