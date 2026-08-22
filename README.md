# Dayflow — Human Resource Management System

Dayflow is a full-stack HRMS: a React + TypeScript SPA backed by a Go (Gin) REST API and PostgreSQL, shipped as a single Docker Compose stack. It covers authentication with role-based access control (admin / HR / employee), an employee directory, profiles with salary configuration, attendance tracking with check-in/check-out, and time-off request approvals.

## Features

- **Landing page** — public marketing page; authenticated users are routed straight to the dashboard.
- **Authentication** — JWT sessions, login by email or company Login ID (`OI` + initials + year + serial, e.g. `OITODO20220001`), bcrypt-hashed passwords, forced password-reset flow on first login.
- **Role-based access** — three roles (`admin`, `hr_officer`, `employee`) enforced in both the UI and API middleware.
- **Dashboard** — role-aware stats cards and a recharts visualization (code-split behind Suspense).
- **Employees** — searchable directory with add/edit flows; admin/HR only.
- **Profile** — personal details, bank details, resume, skills/certifications; salary configuration editable by admins.
- **Attendance** — monthly grid per employee plus self-service check-in / check-out.
- **Time off** — leave requests against yearly allocations (PTO / Sick / Unpaid) with approve/reject workflow for HR.
- **Audit trail** — backend writes an audit log entry for privileged mutations.

## Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | Vite 8, React 19, TypeScript (strict), Tailwind CSS 3, recharts   |
| Backend   | Go 1.26, Gin, pgxpool, golang-jwt/v5, bcrypt                     |
| Database  | PostgreSQL 17 (schema + demo seed auto-applied on first run)      |
| Web server| nginx (serves the SPA build and reverse-proxies `/api`)           |
| Tooling   | Docker + Compose, oxlint, tsc                                     |

## Architecture

```
                ┌────────────────────────── docker compose ──────────────────────────┐
 Browser ──────►│  web (:8081)            api (:8090 → :8080)        db (:5432)      │
                │  nginx: SPA +           Go/Gin REST API,           Postgres 17      │
                │  /api/* → api:8080      JWT auth, RBAC             schema+seed      │
                └────────────────────────────────┬──────────────────────────▲─────────┘
                                                 └──────── pgxpool ─────────┘
```

In dev mode without Docker, the Vite dev server proxies `/api` and `/health` to `http://localhost:8090`.

## Quick Start (Docker)

Prerequisites: Docker Engine + Compose plugin. No local Node or Go needed.

```bash
docker compose up --build -d
```

| Service | URL                              |
| ------- | -------------------------------- |
| Web app | http://localhost:8081            |
| API     | http://localhost:8090/api/v1/... |
| Health  | http://localhost:8090/health     |

Migrations (`api/migrations/*.sql`) run automatically when the database volume is empty. To reset to a clean seeded state:

```bash
docker compose down -v && docker compose up -d --build
```

### Demo Accounts

Seeded by `api/migrations/0002_seed.sql`:

| Role    | Identifier                                  | Password     |
| ------- | ------------------------------------------- | ------------ |
| Admin   | `aarav.mehta@oidos.in`                      | `Admin@123`  |
| HR      | `priya.sharma@oidos.in`                     | `Hr@12345`   |
| Employee| `OITODO20220001` or `tom.doe@oidos.in`      | `Dayflow@123`|

The seed also includes ~30 days of weekday attendance history and one pending leave request for review.

## Local Development

### Frontend

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api → :8090
```

Scripts: `npm run dev` · `npm run build` (tsc + vite build) · `npm run lint` (oxlint) · `npm run preview`.

If the API is unreachable, sign-in falls back to bundled demo data so the UI remains explorable offline.

### Backend

Go 1.26 toolchain required (or just use Docker). Point it at any Postgres — the Compose `db` service works fine:

```bash
cd api
export DATABASE_URL="postgres://dayflow:dayflow@localhost:5432/dayflow?sslmode=disable"
go run .            # serves on PORT, default 8080
go test ./...
```

A `.env` file in `api/` is loaded via godotenv if present. See [api/README.md](api/README.md) for the full backend guide, route catalog, and Postman collection.

## Environment Variables

**API** (`api`, set in `docker-compose.yml`):

| Variable               | Default                          | Notes                                |
| ---------------------- | -------------------------------- | ------------------------------------ |
| `PORT`                 | `8080`                           | HTTP listen port                     |
| `ENV`                  | `development`                    |                                      |
| `DATABASE_URL`         | localhost postgres DSN           | Compose points at the `db` service   |
| `JWT_SECRET`           | built-in default                 | Override in production               |
| `JWT_EXPIRY_HOURS`     | `72`                             |                                      |
| `DEFAULT_COMPANY_CODE` | `DF`                             | Used when generating login IDs       |
| `CORS_ALLOWED_ORIGINS` | empty                            | Comma-separated allowlist            |

**Frontend:** `VITE_API_BASE` (optional absolute base URL; defaults to same-origin so the nginx/Vite proxy handles routing).

## Project Structure

```
├── src/
│   ├── components/          # UI building blocks (employees/, layout/, ui/, time-off/)
│   ├── lib/
│   │   ├── api.ts           # Typed fetch client for the Go backend
│   │   ├── mock-data.ts     # Demo dataset + types (offline fallback)
│   │   ├── store.tsx        # App state provider (API-first, local fallback)
│   │   ├── store-context.ts # StoreContext definition (fast-refresh safe)
│   │   ├── toast-context.ts # Toast system
│   │   └── tokens.ts        # Chart color tokens mirroring Tailwind config
│   ├── pages/
│   │   ├── auth/            # SignInPage, SignUpPage, ForgotPasswordPage
│   │   ├── LandingPage.tsx  # Public landing page
│   │   └── ...              # DashboardPage, EmployeesPage, ProfilePage,
│   │                        # AttendancePage, TimeOffPage
│   └── assets/              # Brand imagery used by the auth screens
├── api/                     # Go backend (clean architecture)
│   ├── internal/{config,database,domain,handler,middleware,repository,service,routes,utils}
│   └── migrations/          # 0001_schema.sql, 0002_seed.sql (auto-run on init)
├── docker-compose.yml       # db + api + web
├── Dockerfile.web           # node build stage → nginx runtime
└── nginx.conf               # SPA fallback + /api proxy + asset caching
```

## Conventions

- Conventional Commits (`feat:`, `fix:`, `chore:`, …).
- Colors/fonts live only in `tailwind.config.ts`; chart colors mirror them in `src/lib/tokens.ts`.
