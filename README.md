<p align="center">
  <h1 align="center">Team Task Manager</h1>
  <p align="center">
    A production-grade SaaS platform for managing projects, tasks, and team collaboration — built with modern tooling and designed for scale.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
    <img src="https://img.shields.io/badge/DRF-3.15-ff1709?style=for-the-badge&logo=django&logoColor=white" alt="DRF" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  </p>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Role-Based Access Control](#role-based-access-control)
- [Database Design](#database-design)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Performance Optimizations](#performance-optimizations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Team Task Manager** is a full-stack SaaS application that empowers teams to organize projects, assign tasks, track progress, and visualize productivity — all through a clean, modern interface backed by a robust API.

This is **not a tutorial project**. It is architected like a real-world product with:
- Strict separation of concerns (models, serializers, services, views)
- Standardized API response envelopes
- Role-based access control enforced at every layer
- Optimized database queries with proper indexing
- Production logging, error handling, and deployment configuration

---

## Architecture

```
+------------------------------------------------------------------+
|                           CLIENT                                  |
|                  React + TypeScript + Vite                         |
|                    Deployed on Vercel                              |
+-------------------------------+----------------------------------+
                                | HTTPS (JWT Bearer Token)
                                v
+------------------------------------------------------------------+
|                         API SERVER                                |
|              Django + Django REST Framework                        |
|                   Deployed on Railway                             |
|                                                                   |
|  +-----------+  +-----------+  +-----------+  +----------------+  |
|  | Accounts  |  | Projects  |  |   Tasks   |  |   Dashboard    |  |
|  |   App     |  |   App     |  |   App     |  |     API        |  |
|  +-----+-----+  +-----+-----+  +-----+-----+  +------+-------+  |
|        |              |              |                |            |
|  +-----v--------------v--------------v----------------v--------+  |
|  |         Core Module (Responses, Exceptions, Pagination)     |  |
|  +-----------------------------+-------------------------------+  |
+--------------------------------+----------------------------------+
                                 | SSL Connection
                                 v
                  +------------------------------+
                  |      Neon PostgreSQL          |
                  |    (Serverless, Connection    |
                  |         Pooling)              |
                  +------------------------------+
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|:-----------|:--------|
| **Django 5.1** | Web framework |
| **Django REST Framework 3.17** | RESTful API layer |
| **SimpleJWT 5.5** | JWT authentication (access + refresh tokens) |
| **django-filter** | Advanced queryset filtering |
| **django-cors-headers** | Cross-origin resource sharing |
| **python-decouple** | Environment variable management |
| **dj-database-url** | Database URL parsing |
| **psycopg2-binary** | PostgreSQL adapter |
| **WhiteNoise** | Static file serving in production |
| **Gunicorn** | WSGI HTTP server |

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| **React 18** | UI library |
| **TypeScript 5.8** | Type safety |
| **Vite 5** | Build tool and dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **Shadcn/UI** | Component library |
| **React Router 6** | Client-side routing |
| **TanStack Query** | Server state management |
| **Recharts** | Data visualization |
| **Zod** | Schema validation |

### Infrastructure
| Service | Purpose |
|:--------|:--------|
| **Railway** | Backend hosting (auto-deploy from GitHub) |
| **Vercel** | Frontend hosting (edge CDN, zero-config) |
| **Neon** | Serverless PostgreSQL with connection pooling |

---

## Features

### Authentication and Authorization
- JWT-based authentication with access (1hr) and refresh (7 day) tokens
- Secure signup with Django's password validators
- Token refresh rotation for session persistence
- Global role system: **Admin** and **Member**

### Project Management
- Full CRUD operations for projects (Admin only)
- Team member management (add/remove with auto-task-unassignment)
- Role-filtered project listing (members only see their projects)

### Task Management
- Task creation with project-scoped assignment validation
- Status tracking: `To Do` → `In Progress` → `Done`
- Overdue detection (`due_date < today AND status != done`)
- Members can update status on their assigned tasks only
- Advanced filtering: by status, project, assignee, and overdue flag

### Dashboard API
- Aggregated statistics: total, completed, pending, overdue tasks
- Status breakdown with per-status counts
- Role-scoped: Admin sees global stats, members see their own
- Single-query aggregation using Django's `Count` with `Q` filters (no N+1)

### Standardized API Responses
Every endpoint returns a consistent JSON envelope:
```json
{
  "success": true,
  "message": "Tasks retrieved successfully.",
  "data": { ... },
  "errors": null,
  "status_code": 200
}
```

### Error Handling
- Custom DRF exception handler wraps all errors into the standard envelope
- Covers: `ValidationError`, `AuthenticationFailed`, `PermissionDenied`, `NotFound`
- No raw tracebacks ever exposed to the client

### Structured Logging
- Auth events (login success/failure)
- Membership changes (add/remove team members)
- Dashboard queries
- Unhandled exception capture

---

## Project Structure

```
project-focus/
├── .gitignore
├── README.md
│
├── backend/                        # Django REST Framework API
│   ├── manage.py
│   ├── requirements.txt
│   ├── railway.toml                # Railway deployment config
│   ├── Procfile                    # Process definition
│   ├── runtime.txt                 # Python version
│   ├── .env.example                # Environment template
│   │
│   ├── config/                     # Django configuration
│   │   ├── settings.py             # Env-driven settings
│   │   ├── urls.py                 # Root URL routing + health check
│   │   └── wsgi.py                 # WSGI entry point
│   │
│   ├── core/                       # Shared utilities
│   │   ├── responses.py            # api_response() helper
│   │   ├── exceptions.py           # Custom exception handler
│   │   └── pagination.py           # Standardized pagination
│   │
│   ├── accounts/                   # Users and Authentication
│   │   ├── models.py               # Custom User model (email-based)
│   │   ├── serializers.py          # Signup, Login, Profile serializers
│   │   ├── views.py                # Auth views + User listing
│   │   ├── services.py             # Business logic + token generation
│   │   ├── permissions.py          # IsAdmin, IsAdminOrReadOnly
│   │   ├── admin.py                # Custom UserAdmin
│   │   └── urls.py                 # Auth routes
│   │
│   ├── projects/                   # Project Management
│   │   ├── models.py               # Project with team members (M2M)
│   │   ├── serializers.py          # List, Detail, Create serializers
│   │   ├── views.py                # ProjectViewSet + member actions
│   │   ├── services.py             # Add/remove member + auto-unassign
│   │   ├── permissions.py          # IsProjectAdminOrMemberReadOnly
│   │   ├── admin.py                # ProjectAdmin with member count
│   │   └── urls.py                 # Project routes (Router)
│   │
│   └── tasks/                      # Task Management + Dashboard
│       ├── models.py               # Task with status enum + indexes
│       ├── serializers.py          # CRUD + member-restricted update
│       ├── views.py                # TaskViewSet + DashboardView
│       ├── services.py             # Dashboard aggregation queries
│       ├── permissions.py          # IsAdminOrAssignedMember
│       ├── admin.py                # TaskAdmin with overdue indicator
│       └── urls.py                 # Task routes (Router)
│
└── frontend/                       # React + Vite + TypeScript
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── vercel.json                 # Vercel SPA routing
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── public/
    └── src/
        ├── components/             # UI components
        ├── pages/                  # Route pages
        ├── hooks/                  # Custom React hooks
        ├── store/                  # State management
        └── lib/                    # Utilities and types
```

---

## API Documentation

### Base URL
```
Production: https://project-focus-production.up.railway.app/api/v1
Local:      http://localhost:8000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/auth/signup/` | Public | Register a new user account |
| `POST` | `/auth/login/` | Public | Authenticate and receive JWT tokens |
| `POST` | `/auth/token/refresh/` | Public | Refresh an expired access token |
| `GET` | `/auth/profile/` | Required | Get current user's profile |
| `PATCH` | `/auth/profile/` | Required | Update current user's profile |
| `GET` | `/auth/users/` | Required | List users (supports `?project_id=`) |

### Project Endpoints

| Method | Endpoint | Auth | Access | Description |
|:-------|:---------|:-----|:-------|:------------|
| `GET` | `/projects/` | Required | All | List projects (role-filtered) |
| `POST` | `/projects/` | Required | Admin | Create a new project |
| `GET` | `/projects/{id}/` | Required | Admin / Member | Get project details |
| `PUT` | `/projects/{id}/` | Required | Admin | Full update |
| `PATCH` | `/projects/{id}/` | Required | Admin | Partial update |
| `DELETE` | `/projects/{id}/` | Required | Admin | Delete project |
| `POST` | `/projects/{id}/add-member/` | Required | Admin | Add team member |
| `POST` | `/projects/{id}/remove-member/` | Required | Admin | Remove member (auto-unassigns tasks) |

### Task Endpoints

| Method | Endpoint | Auth | Access | Description |
|:-------|:---------|:-----|:-------|:------------|
| `GET` | `/tasks/` | Required | All | List tasks (role-filtered) |
| `POST` | `/tasks/` | Required | Admin | Create task |
| `GET` | `/tasks/{id}/` | Required | Admin / Assigned | Get task details |
| `PUT` | `/tasks/{id}/` | Required | Admin / Assigned | Full update |
| `PATCH` | `/tasks/{id}/` | Required | Admin / Assigned | Partial update (members: status only) |
| `DELETE` | `/tasks/{id}/` | Required | Admin | Delete task |

**Query Parameters:**
| Parameter | Type | Example | Description |
|:----------|:-----|:--------|:------------|
| `status` | string | `?status=todo` | Filter by status (`todo`, `in_progress`, `done`) |
| `project` | int | `?project=1` | Filter by project ID |
| `assigned_to` | int | `?assigned_to=5` | Filter by assigned user (Admin only) |
| `overdue` | bool | `?overdue=true` | Show only overdue tasks |

### Dashboard Endpoint

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/dashboard/` | Required | Aggregated task statistics |

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully.",
  "data": {
    "total_tasks": 42,
    "completed_tasks": 18,
    "pending_tasks": 20,
    "overdue_tasks": 4,
    "tasks_by_status": {
      "todo": 10,
      "in_progress": 10,
      "done": 18
    }
  },
  "status_code": 200
}
```

### Health Check

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/health/` | Public | Service health status |

---

## Role-Based Access Control

The system enforces a global role model with two tiers:

### Admin
| Resource | Create | Read | Update | Delete |
|:---------|:------:|:----:|:------:|:------:|
| Projects | Yes | All | Yes | Yes |
| Tasks | Yes | All | All fields | Yes |
| Users | — | All | — | — |
| Team Members | Add | Yes | Remove | — |
| Dashboard | — | Global stats | — | — |

### Member
| Resource | Create | Read | Update | Delete |
|:---------|:------:|:----:|:------:|:------:|
| Projects | No | Own only | No | No |
| Tasks | No | Assigned only | Status only | No |
| Users | — | Teammates (with `?project_id`) | — | — |
| Dashboard | — | Own stats | — | — |

**Enforcement layers:**
1. **Permission classes** — DRF permission checks on every request
2. **Queryset filtering** — Members only see data they have access to
3. **Serializer validation** — Members blocked from modifying restricted fields

---

## Database Design

```
+------------------+      +------------------+      +------------------+
|     User         |      |    Project        |      |      Task        |
+------------------+      +------------------+      +------------------+
| id (PK)          |<--+  | id (PK)          |<--+  | id (PK)          |
| username         |   |  | name             |   |  | title            |
| email (unique)   |   |  | description      |   |  | description      |
| password (hash)  |   +--| created_by (FK)  |   +--| project (FK)     |
| role (enum)      |   |  | created_at       |   |  | assigned_to (FK) |
| created_at       |   |  |                  |   |  | created_by (FK)  |
|                  |   |  | team_members ----+---+  | status (enum)    |
|                  |   |  |     (M2M User)   |      | due_date         |
|                  |   |  |                  |      | created_at       |
+------------------+   |  +------------------+      +------------------+
                       |                                     |
                       +-------------------------------------+

Indexes:
  - User: role
  - Project: created_by, created_at
  - Task: status, assigned_to, due_date, project, (project + status) composite
```

**Key constraints:**
- Tasks can only be assigned to users who are members of the task's project
- Removing a user from a project auto-unassigns their tasks (`assigned_to = NULL`)
- Deleting a project cascades to delete all its tasks
- Deleting a user with created projects is blocked (`PROTECT`)

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

**Backend API:** `http://localhost:8000/api/v1/`  
**Admin Panel:** `http://localhost:8000/admin/`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend UI:** `http://localhost:8080`

---

## Deployment

### Backend on Railway

1. Connect your GitHub repository on [railway.app](https://railway.app)
2. Set **Root Directory** to `backend`
3. Railway auto-detects `requirements.txt` and `railway.toml`
4. Configure environment variables (see below)
5. Deploy — Railway runs: `collectstatic` then `migrate` then `gunicorn`

### Frontend on Vercel

1. Import your GitHub repository on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. **Framework Preset**: Vite
4. Configure `VITE_API_URL` environment variable
5. Deploy — Vercel handles build and edge distribution

### Database on Neon

1. Create a PostgreSQL database on [neon.tech](https://neon.tech)
2. Copy the connection string
3. Set as `DATABASE_URL` on Railway
4. Migrations run automatically on each deploy

---

## Environment Variables

### Backend (Railway)

| Variable | Required | Description |
|:---------|:--------:|:------------|
| `SECRET_KEY` | Yes | Django secret key (generate a unique one) |
| `DEBUG` | Yes | `False` for production |
| `ALLOWED_HOSTS` | Yes | `.railway.app` or your custom domain |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `CORS_ALLOWED_ORIGINS` | Yes | Frontend URL(s), comma-separated |
| `CSRF_TRUSTED_ORIGINS` | Yes | Backend URL for Django admin |

### Frontend (Vercel)

| Variable | Required | Description |
|:---------|:--------:|:------------|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## Security

| Layer | Implementation |
|:------|:---------------|
| **Authentication** | JWT tokens via SimpleJWT (Bearer scheme) |
| **Password Security** | Django's built-in validators (similarity, length, common, numeric) |
| **CORS** | Explicit origin whitelist in production, credentials enabled |
| **CSRF** | Trusted origins configured for admin panel |
| **SSL** | Enforced via `SECURE_PROXY_SSL_HEADER` behind Railway's proxy |
| **Input Validation** | Serializer-level validation on all endpoints |
| **Error Masking** | Custom exception handler — no raw tracebacks exposed |
| **DB Security** | SSL-only connection to Neon PostgreSQL |

---

## Performance Optimizations

| Optimization | Where |
|:-------------|:------|
| `select_related()` | All foreign key lookups (project, assigned_to, created_by) |
| `prefetch_related()` | ManyToMany relations (team_members) |
| **Composite DB index** | `(project, status)` for dashboard queries |
| **5 single-field indexes** | status, assigned_to, due_date, project, created_by |
| **Aggregate queries** | Dashboard uses `Count` with `Q` filters — single query, no N+1 |
| **Connection pooling** | `conn_max_age=600` + Neon's built-in pooler |
| **Static compression** | WhiteNoise with `CompressedManifestStaticFilesStorage` |
| **Pagination** | Default 20, max 100 per page with `page_size` parameter |
| **JSON-only rendering** | Browsable API disabled in production |

---

## License

This project is private. All rights reserved.

---

<p align="center">
  Built with precision. Deployed with confidence.
</p>
