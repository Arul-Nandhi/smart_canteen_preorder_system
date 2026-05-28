# 🏃 Quick Start Guide - Smart Canteen Portal

## ⚡ 2-Minute Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Start Backend
```bash
cd "smart canteen portal"
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS/Linux

python manage.py runserver
# Backend running at: http://127.0.0.1:8000
```

### Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
# Frontend running at: http://localhost:5173
```

**Done!** 🎉 Open http://localhost:5173 in your browser

---

## 📝 Test Accounts

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@gmail.com          | admin123    |
| Staff   | staff@gmail.com          | staff123    |
| Student | student@gmail.com        | student123  |

---

## 🗄️ Database Setup (First Time Only)

```bash
# Apply migrations
python manage.py migrate

# Load seed data
python seed.py

# Create admin user (optional)
python manage.py createsuperuser
```

---

## 🔗 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000/api/ |
| Django Admin | http://127.0.0.1:8000/admin |

---

## 📚 API Documentation

### Authentication
```bash
# Register
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass123", "role": "student"}'

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass123"}'
```

### Menu
```bash
# Get all menu items
curl http://127.0.0.1:8000/api/menu/

# Search menu
curl "http://127.0.0.1:8000/api/menu/?search=pizza"
```

### Orders
```bash
# Place order (requires JWT token)
curl -X POST http://127.0.0.1:8000/api/orders/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": [1, 2, 3], "slot_id": 1}'
```

---

## 🛠️ Development Tools

### Run Django Shell
```bash
python manage.py shell
>>> from authentication.models import User
>>> User.objects.all()
```

### Create Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Run Tests
```bash
python manage.py test
```

---

## 📂 Project Structure

```
smart canteen portal/
├── manage.py                    # Django CLI
├── db.sqlite3                   # Database (dev)
├── requirements.txt             # Python dependencies
├── seed.py                      # Database seeder
├── DEPLOYMENT_GUIDE.md          # Production deployment
├── DEPLOYMENT_CHECKLIST.md      # Pre-deployment checklist
│
├── smartserve_backend/          # Django config
│   ├── settings.py              # Settings & configuration
│   ├── urls.py                  # URL routing
│   ├── asgi.py                  # ASGI config (WebSocket)
│   └── wsgi.py                  # WSGI config (HTTP)
│
├── authentication/              # User auth & JWT
├── menu/                        # Food menu management
├── orders/                      # Order handling
├── queue_engine/                # Queue management
├── slots/                       # Booking slots
├── notifications/               # Push notifications
├── analytics/                   # Dashboard analytics
├── realtime/                    # WebSocket consumers
│
└── frontend/                    # React + Vite
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── dist/                    # Built files (production)
    └── src/
        ├── App.jsx              # Main component
        ├── main.jsx
        ├── services/            # API calls
        ├── context/             # Auth, Cart contexts
        ├── components/          # Reusable components
        ├── pages/               # Page components
        ├── routes/              # Route definitions
        └── styles/              # Global styles
```

---

## 🔄 Workflow

### Making Changes to Backend
1. Edit Django model/view
2. If model changed: `python manage.py makemigrations`
3. Apply migration: `python manage.py migrate`
4. Changes auto-reload on dev server

### Making Changes to Frontend
1. Edit React component
2. Changes auto-reload at http://localhost:5173

### Making Changes to API
1. Update serializer or view in Django
2. Frontend will consume new fields automatically

---

## 🐛 Debugging

### Frontend Issues
- Open Chrome DevTools (F12)
- Check Console for errors
- Check Network tab for API calls
- Verify JWT token in localStorage

### Backend Issues
- Check terminal output for errors
- Use `python manage.py shell` to test models
- Add print statements or use pdb debugger
- Check database with SQLite Browser

### API Issues
```bash
# Test endpoint with curl
curl -v http://127.0.0.1:8000/api/menu/

# With authentication
curl -H "Authorization: Bearer TOKEN" http://127.0.0.1:8000/api/orders/
```

---

## 📦 Installing New Dependencies

### Backend
```bash
pip install package-name
pip freeze > requirements.txt  # Update requirements
```

### Frontend
```bash
npm install package-name
```

---

## 🚀 Next Steps

1. **Test Locally**: Start both servers and try all features
2. **Review Code**: Check [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
3. **Deploy**: Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. **Monitor**: Set up logging and monitoring as per guide

---

## 💡 Tips

- Use Django Admin at `/admin` to manage data
- JWT tokens expire after 24 hours
- Frontend caches data - clear if needed
- WebSocket requires Daphne in production
- Use PostgreSQL for production, not SQLite

---

**Need help?** Check the deployment guide or implementation checklist!
