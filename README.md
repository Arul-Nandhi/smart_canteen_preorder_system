# SmartServe - Smart Canteen Preorder & Queue Optimization System

> Smart Ordering. Smarter Queue Management.

## Quick Start

### 1. Backend (Django)
```bash
cd "smart canteen portal"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python seed.py          # Creates users, menu items, and slots
python manage.py runserver
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### URLs
- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:8000
- Django Admin: http://127.0.0.1:8000/admin

### Test Accounts
| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@smartserve.com     | admin123    |
| Staff   | staff@smartserve.com     | staff123    |
| Student | student@smartserve.com   | student123  |

## Tech Stack
- **Frontend**: React 19, Vite, React Router, Recharts, Lucide Icons
- **Backend**: Django 6, Django REST Framework, SimpleJWT
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT with role-based access control

## Project Structure
```
smart canteen portal/
├── manage.py
├── seed.py
├── requirements.txt
├── smartserve_backend/     # Django settings & root URLs
├── authentication/         # User model, register, login, JWT
├── menu/                   # MenuItem CRUD with search/filter
├── orders/                 # Order placement, token generation
├── slots/                  # Slot management & capacity control
├── queue_engine/           # Live queue status & overload detection
├── notifications/          # Push notifications & alerts
├── analytics/              # Dashboard KPIs, charts data
└── frontend/               # React SPA
    └── src/
        ├── context/        # AuthContext, CartContext
        ├── components/     # Navbar
        ├── routes/         # ProtectedRoute
        ├── services/       # Axios API layer
        └── pages/          # All page components
```

## API Endpoints
| Method | Endpoint                  | Auth   | Description           |
|--------|---------------------------|--------|-----------------------|
| POST   | /api/auth/register/       | None   | Register user         |
| POST   | /api/auth/login/          | None   | Login, returns JWT    |
| GET    | /api/auth/profile/        | JWT    | User profile          |
| GET    | /api/menu/                | Public | Menu items            |
| POST   | /api/menu/                | Admin  | Add menu item         |
| GET    | /api/slots/               | JWT    | Available slots       |
| POST   | /api/orders/              | JWT    | Place order           |
| PATCH  | /api/orders/{id}/         | Staff  | Update order status   |
| GET    | /api/queue/status/        | JWT    | Live queue status     |
| GET    | /api/queue/token/{token}/ | JWT    | Track by token        |
| GET    | /api/queue/kitchen/       | Staff  | Kitchen order queue   |
| GET    | /api/notifications/       | JWT    | User notifications    |
| GET    | /api/analytics/           | Admin  | Dashboard analytics   |

## Features
- Preorder slot booking with capacity control
- Live instant queue with token tracking
- Smart overload detection and queue balancing
- Kitchen dashboard with order status workflow
- Admin dashboard with analytics charts
- Role-based access (Student / Staff / Admin)
- Real-time notifications
- Auto-refresh queue status
