# Team Task Manager

A production-grade SaaS application for managing team projects and tasks with role-based access control.

## Architecture

```
project-focus/
├── frontend/    # React + Vite + TypeScript (UI)
└── backend/     # Django + DRF (API server)
```

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, Vite, TypeScript, Tailwind   |
| Backend    | Django 5.1, Django REST Framework   |
| Auth       | JWT (SimpleJWT)                     |
| Database   | PostgreSQL (SQLite for local dev)   |
| Deployment | Railway                             |

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
cp .env.example .env         # Edit with your settings

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API available at: `http://localhost:8000/api/v1/`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI available at: `http://localhost:5173`

## API Endpoints

| Method | Endpoint                              | Access       |
|--------|---------------------------------------|--------------|
| POST   | `/api/v1/auth/signup/`                | Public       |
| POST   | `/api/v1/auth/login/`                 | Public       |
| POST   | `/api/v1/auth/token/refresh/`         | Public       |
| GET    | `/api/v1/auth/profile/`               | Authenticated|
| PATCH  | `/api/v1/auth/profile/`               | Authenticated|
| GET    | `/api/v1/auth/users/`                 | Authenticated|
| GET    | `/api/v1/projects/`                   | Authenticated|
| POST   | `/api/v1/projects/`                   | Admin        |
| GET    | `/api/v1/projects/{id}/`              | Authenticated|
| PUT    | `/api/v1/projects/{id}/`              | Admin        |
| DELETE | `/api/v1/projects/{id}/`              | Admin        |
| POST   | `/api/v1/projects/{id}/add-member/`   | Admin        |
| POST   | `/api/v1/projects/{id}/remove-member/`| Admin        |
| GET    | `/api/v1/tasks/`                      | Authenticated|
| POST   | `/api/v1/tasks/`                      | Admin        |
| GET    | `/api/v1/tasks/{id}/`                 | Authenticated|
| PUT    | `/api/v1/tasks/{id}/`                 | Admin/Assigned|
| DELETE | `/api/v1/tasks/{id}/`                 | Admin        |
| GET    | `/api/v1/dashboard/`                  | Authenticated|

## Environment Variables

| Variable               | Description                        |
|------------------------|------------------------------------|
| `SECRET_KEY`           | Django secret key                  |
| `DEBUG`                | Debug mode (True/False)            |
| `ALLOWED_HOSTS`        | Comma-separated allowed hosts      |
| `DATABASE_URL`         | PostgreSQL connection URL          |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins   |

## License

Private — All rights reserved.
