# ☁️ Smart Canteen Portal - Cloud Deployment Checklist

## 🎯 Quick Start (Choose One)

### Option 1: Render (Recommended - Full Stack)
- Backend + Frontend + Database in one place
- Free tier available
- Follow: [Render Guide](#render-full-stack-recommended)

### Option 2: Vercel + Render
- Best frontend performance
- Backend separate on Render
- Follow: [Vercel Guide](#vercel-frontend--render-backend)

### Option 3: Netlify + Render
- Alternative frontend option
- Backend separate on Render
- Follow: [Netlify Guide](#netlify-frontend--render-backend)

---

## 📋 Pre-Deployment Checklist

### Code Ready
- [ ] Code committed to GitHub/GitLab/Bitbucket
- [ ] `.env.example` file present
- [ ] `requirements.txt` includes `gunicorn` and `psycopg2-binary`
- [ ] `frontend/vercel.json` or `frontend/netlify.toml` present
- [ ] `Procfile` present for backend
- [ ] No sensitive data in code

### Configuration Ready
- [ ] `DEBUG=False` for production
- [ ] `ALLOWED_HOSTS` configured for your domain
- [ ] `CORS_ALLOWED_ORIGINS` restricted (not `*`)
- [ ] `DJANGO_SECRET_KEY` ready (will set in environment)
- [ ] Environment variables template (`.env.example`) created
- [ ] Security headers configured

### Database Ready
- [ ] Migrations created (`python manage.py makemigrations`)
- [ ] Migrations applied locally (`python manage.py migrate`)
- [ ] Seed data script present (`seed.py`)
- [ ] PostgreSQL connection string format known

### Frontend Ready
- [ ] `npm run build` works locally
- [ ] API endpoint environment variable configured
- [ ] No hardcoded API URLs
- [ ] Build output in `dist/` directory

---

## 🚀 RENDER (Recommended - Full Stack)

### Prerequisites ✓
- [ ] GitHub account (free)
- [ ] Render account (free at https://render.com)
- [ ] Repository pushed to GitHub
- [ ] Code committed and all files present

### Deployment Steps

#### 1. Create Render Account
```
1. Visit https://render.com
2. Sign up with GitHub
3. Authorize access to repositories
```

#### 2. Deploy Backend (Django)
```
1. Dashboard → New +
2. Select "Web Service"
3. Connect GitHub repository
4. Enter Details:
   Name: smartcanteen-backend
   Environment: Python 3.11
   Region: (closest to you)
   Build: pip install -r requirements.txt && python manage.py collectstatic --noinput
   Start: gunicorn smartserve_backend.wsgi:application --bind 0.0.0.0:$PORT
5. Add Environment Variables:
   PYTHON_VERSION: 3.11.0
   DEBUG: False
   ALLOWED_HOSTS: yourdomain.render.com
   DJANGO_SECRET_KEY: (generate 50+ char random string)
   DJANGO_SETTINGS_MODULE: smartserve_backend.settings
6. Deploy (wait ~5 min)
7. Note the URL: https://smartcanteen-backend.render.com
```

#### 3. Deploy PostgreSQL Database
```
1. Dashboard → New +
2. Select "PostgreSQL"
3. Enter Details:
   Name: smartcanteen-db
   Database: smartcanteen
   User: smartcanteen
   Region: (same as backend)
4. Create (wait ~1 min)
5. Copy Internal Database URL
6. Add to backend environment:
   DATABASE_URL: postgresql://user:pass@host/db
```

#### 4. Run Migrations & Seed Data
```
1. Open backend service
2. Go to "Shell" tab
3. Run:
   python manage.py migrate
   python seed.py
   python manage.py createsuperuser
4. Note admin credentials
```

#### 5. Deploy Frontend (React)
```
1. Dashboard → New +
2. Select "Static Site"
3. Connect repository
4. Enter Details:
   Name: smartcanteen-frontend
   Build: cd frontend && npm run build
   Publish: frontend/dist
5. Add Environment Variables:
   VITE_API_BASE_URL: https://smartcanteen-backend.render.com/api
6. Deploy (wait ~3 min)
7. Your site is live!
```

#### 6. Update CORS & Security
```
Edit smartserve_backend/settings.py:

ALLOWED_HOSTS = [
    'smartcanteen-backend.render.com',
    'yourdomain.render.com'
]

CORS_ALLOWED_ORIGINS = [
    'https://smartcanteen-frontend.render.com',
    'https://yourdomain.render.com'
]

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000

Commit and push - auto-redeploys!
```

### ✅ Render Complete!
- Backend: https://smartcanteen-backend.render.com
- Frontend: https://smartcanteen-frontend.render.com
- Admin: https://smartcanteen-backend.render.com/admin

---

## 🔷 VERCEL (Frontend Only)

### Prerequisites ✓
- [ ] Frontend app ready (`frontend/` directory)
- [ ] `vercel.json` present
- [ ] `VITE_API_BASE_URL` environment variable defined
- [ ] Backend deployed on Render (get URL)

### Deployment Steps

```
1. Visit https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Framework: React
5. Root Directory: frontend
6. Build: npm run build
7. Output: dist
8. Environment Variable:
   VITE_API_BASE_URL: https://smartcanteen-backend.render.com/api
9. Deploy
10. Your frontend is live!
```

### ✅ Vercel Complete!
- Frontend: https://your-project.vercel.app

---

## 🟦 NETLIFY (Frontend Only)

### Prerequisites ✓
- [ ] Frontend app ready (`frontend/` directory)
- [ ] `netlify.toml` present
- [ ] Backend deployed on Render (get URL)

### Deployment Steps

```
1. Visit https://netlify.com
2. Click "Add new site"
3. "Import existing project" → GitHub
4. Authorize Netlify
5. Select repository
6. Build settings:
   Build command: cd frontend && npm run build
   Publish directory: frontend/dist
7. Environment:
   VITE_API_BASE_URL: https://smartcanteen-backend.render.com/api
8. Deploy
9. Your frontend is live!
```

### ✅ Netlify Complete!
- Frontend: https://your-project.netlify.app

---

## 🧪 Post-Deployment Testing

After deployment, test these features:

### Authentication
- [ ] Register new user
- [ ] Login with email/password
- [ ] JWT token created
- [ ] Refresh token working

### Menu
- [ ] Browse 226 items
- [ ] Search functionality
- [ ] Filter by category
- [ ] Load images correctly

### Orders
- [ ] Add items to cart
- [ ] Place order
- [ ] Order token generated
- [ ] Track order status

### Queue
- [ ] View live queue
- [ ] See rush level
- [ ] View estimated time

### Staff (if deployed)
- [ ] View orders
- [ ] Update status
- [ ] Handle billing
- [ ] Manage queue

### Admin (if deployed)
- [ ] Access admin panel
- [ ] Manage menu items
- [ ] View analytics
- [ ] Manage users

---

## 🔒 Security Verification

After deployment, verify:

- [ ] `DEBUG = False` in production
- [ ] HTTPS enabled (automatic on all platforms)
- [ ] `ALLOWED_HOSTS` set correctly
- [ ] `CORS_ALLOWED_ORIGINS` restricted
- [ ] `DJANGO_SECRET_KEY` is random 50+ chars
- [ ] No hardcoded passwords or keys
- [ ] Database password is strong
- [ ] Security headers present

---

## 📊 Monitoring & Logs

### View Logs
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Deployments → Logs
- **Netlify**: Dashboard → Deploys → Deploy log

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Backend crash | Check logs in Render |
| 404 Not Found | Route not found | Verify URL paths |
| CORS Error | Origins not allowed | Update `CORS_ALLOWED_ORIGINS` |
| DB Connection Error | Wrong URL/credentials | Verify `DATABASE_URL` |
| Static files missing | Not collected | Run `collectstatic` |

---

## 💾 Backup & Recovery

### Database Backups (Render)
1. Open PostgreSQL in Render
2. Go to "Backups" tab
3. Automatic daily backups enabled
4. Download backup if needed

### Code Backups
- Automatic via GitHub
- All deployment history saved

---

## 📈 Performance Optimization

### Frontend
- Enable caching (automatic on Vercel/Netlify)
- Use CDN (included in all platforms)
- Compress assets (automatic in build)

### Backend
- Enable query caching
- Use Gunicorn workers (set to CPU count)
- Monitor database queries

### Database
- Create indexes on frequently queried columns
- Regular VACUUM operations
- Monitor connection pool

---

## 🆘 Troubleshooting

### Backend Won't Start
```bash
# Check in Render shell:
pip install -r requirements.txt
python manage.py check
python manage.py migrate
```

### Frontend Build Fails
```bash
# Verify locally:
cd frontend
npm run build
# Check console errors
```

### Database Connection Fails
```bash
# Verify DATABASE_URL format:
postgresql://user:password@host:5432/database
# Check credentials in Render PostgreSQL panel
```

### CORS Errors
```python
# Update Django settings:
CORS_ALLOWED_ORIGINS = [
    'https://frontend-domain.vercel.app',
    'https://yourdomain.com'
]
# Commit and push
```

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Django Deploy**: https://docs.djangoproject.com/en/6.0/howto/deployment/
- **DRF Guide**: https://www.django-rest-framework.org/

---

## ✨ Success Indicators

Your deployment is successful when:

✅ Frontend loads without errors
✅ Login works correctly
✅ API calls succeed (check Network tab)
✅ Menu loads with 226 items
✅ Orders can be placed
✅ Queue updates in real-time
✅ No CORS errors in console
✅ Admin panel accessible
✅ Staff dashboard working
✅ No 500 errors in backend logs

---

## 🎉 Congratulations!

Your Smart Canteen Portal is now deployed to the cloud!

**Next Steps:**
1. Share URLs with users
2. Monitor performance
3. Collect feedback
4. Optimize as needed
5. Scale when necessary

---

**Status**: ✅ Ready for Cloud Deployment  
**Last Updated**: May 28, 2026  
**Difficulty**: Easy (Follow exact steps above)
