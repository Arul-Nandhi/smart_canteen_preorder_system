# 🚀 Smart Canteen Portal - Cloud Deployment Guide

Complete step-by-step guide to deploy your Smart Canteen Portal to **Vercel**, **Netlify**, or **Render**.

---

## 📋 Table of Contents
1. [Render (Recommended - Full Stack)](#render-recommended--full-stack)
2. [Vercel (Frontend Only)](#vercel-frontend-only)
3. [Netlify (Frontend Only)](#netlify-frontend-only)
4. [Comparison & Recommendations](#comparison--recommendations)

---

## 🎯 Render (Recommended - Full Stack)

**Render** is ideal because it can host both your Django backend and React frontend, plus PostgreSQL database, all in one place.

### Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket)
- Render account (free tier available at https://render.com)
- Your code pushed to a git repository

### Step 1: Push Code to GitHub

```bash
cd "smart canteen portal"
git init
git add .
git commit -m "Initial commit: Smart Canteen Portal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-canteen-portal.git
git push -u origin main
```

### Step 2: Create Render Account
- Go to https://render.com
- Sign up with GitHub account
- Connect your GitHub account

### Step 3: Deploy Backend (Django)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Fill in the configuration:
   - **Name**: `smartcanteen-backend`
   - **Environment**: `Python 3.11`
   - **Build Command**: 
     ```
     pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command**: 
     ```
     gunicorn smartserve_backend.wsgi:application --bind 0.0.0.0:$PORT
     ```
4. Add Environment Variables:
   ```
   PYTHON_VERSION=3.11.0
   DEBUG=False
   DJANGO_SETTINGS_MODULE=smartserve_backend.settings
   ALLOWED_HOSTS=yourdomain.render.com
   DJANGO_SECRET_KEY=your-super-secret-key-50-chars-minimum
   ```
5. Click **"Create Web Service"**
6. Note the backend URL (e.g., `https://smartcanteen-backend.render.com`)

### Step 4: Deploy PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name**: `smartcanteen-db`
   - **Database**: `smartcanteen_db`
   - **User**: `smartcanteen_user`
   - **Region**: Same as backend
   - **Plan**: Free tier
3. Click **"Create Database"**
4. Copy the connection string (Internal Database URL)
5. Add to backend environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

### Step 5: Run Database Migrations

After database is created:

1. Go to backend service settings
2. Click **"Shell"** tab
3. Run:
   ```bash
   python manage.py migrate
   python seed.py  # Load initial data
   python manage.py createsuperuser  # Create admin
   ```

### Step 6: Deploy Frontend (React)

1. Click **"New +"** → **"Static Site"**
2. Select your repository
3. Fill in:
   - **Name**: `smartcanteen-frontend`
   - **Build Command**: `cd frontend && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variables:
   ```
   VITE_API_BASE_URL=https://smartcanteen-backend.render.com/api
   ```
5. Click **"Create Static Site"**
6. Wait for build to complete
7. Visit your site URL

### Step 7: Update CORS Settings

Update Django settings for production CORS:

```python
# smartserve_backend/settings.py
ALLOWED_HOSTS = ['smartcanteen-backend.render.com', 'yourdomain.com']

CORS_ALLOWED_ORIGINS = [
    'https://smartcanteen-frontend.render.com',
    'https://yourdomain.com',
]

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
```

Commit and push changes - Render will auto-redeploy.

### ✅ Render Deployment Complete!

- **Backend**: `https://smartcanteen-backend.render.com`
- **Frontend**: `https://smartcanteen-frontend.render.com`
- **Admin Panel**: `https://smartcanteen-backend.render.com/admin`

---

## 🔷 Vercel (Frontend Only)

Deploy React frontend to Vercel (backend on Render).

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub account
- Backend already deployed (use Render backend URL)

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Select your GitHub repository
4. Click **"Import"**

### Step 2: Configure Build Settings

1. **Project Name**: `smartcanteen`
2. **Framework**: `React`
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### Step 3: Add Environment Variables

Click **"Environment Variables"**:

```
VITE_API_BASE_URL=https://smartcanteen-backend.render.com/api
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Your frontend is live!

### ✅ Vercel Deployment Complete!

**Frontend**: `https://smartcanteen.vercel.app`

---

## 🟦 Netlify (Frontend Only)

Deploy React frontend to Netlify (backend on Render).

### Prerequisites
- Netlify account (free at https://netlify.com)
- GitHub account
- Backend already deployed (use Render backend URL)

### Step 1: Connect Repository

1. Go to https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **"GitHub"**
4. Authorize Netlify to access your GitHub
5. Select your repository

### Step 2: Build Settings

1. **Branch**: `main`
2. **Build Command**: `cd frontend && npm run build`
3. **Publish Directory**: `frontend/dist`

### Step 3: Add Environment Variables

1. Click **"Site settings"**
2. Go to **"Build & Deploy"** → **"Environment"**
3. Add:
   ```
   VITE_API_BASE_URL=https://smartcanteen-backend.render.com/api
   ```

### Step 4: Deploy

1. Click **"Deploy"**
2. Netlify automatically builds and deploys
3. Your site is live!

### ✅ Netlify Deployment Complete!

**Frontend**: `https://smartcanteen.netlify.app`

---

## 📊 Comparison & Recommendations

### Platform Comparison

| Feature | Render | Vercel | Netlify |
|---------|--------|--------|---------|
| **Backend (Django)** | ✅ Yes | ❌ No | ❌ No |
| **Frontend (React)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Database** | ✅ PostgreSQL | ❌ No | ❌ No |
| **Free Tier** | ✅ Limited | ✅ Yes | ✅ Yes |
| **Cost** | $7+/month | $0-20/month | $0-20/month |
| **Setup Complexity** | Medium | Low | Low |
| **Full Stack** | ✅ Yes | ❌ No | ❌ No |

### Recommended Configurations

#### Option 1: Render Everything (SIMPLEST) ✅ Recommended
- **Backend**: Render
- **Frontend**: Render
- **Database**: Render PostgreSQL
- **Advantage**: Single platform, simple management
- **Cost**: ~$7-15/month

#### Option 2: Vercel + Render (POPULAR)
- **Backend**: Render
- **Frontend**: Vercel
- **Database**: Render PostgreSQL
- **Advantage**: Best frontend performance
- **Cost**: ~$7-15/month

#### Option 3: Netlify + Render
- **Backend**: Render
- **Frontend**: Netlify
- **Database**: Render PostgreSQL
- **Advantage**: Better DX with Netlify
- **Cost**: ~$7-15/month

---

## 🔐 Security Checklist for Production

Before deploying:

- [ ] Change `DJANGO_SECRET_KEY` to secure random string
- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Set `SECURE_SSL_REDIRECT = True`
- [ ] Configure `CORS_ALLOWED_ORIGINS` (not `*`)
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set strong database password
- [ ] Configure environment variables (not hardcoded)
- [ ] Set up HTTPS (automatic on Render/Vercel/Netlify)
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging

---

## 🔧 Common Issues & Troubleshooting

### Issue: Backend Returns 502 Bad Gateway

**Solution**:
1. Check backend logs in Render dashboard
2. Verify `requirements.txt` includes `gunicorn`
3. Check Python version matches (3.11+)
4. Verify `ALLOWED_HOSTS` includes your domain

### Issue: Frontend Can't Connect to Backend

**Solution**:
1. Verify `VITE_API_BASE_URL` is set correctly
2. Check CORS configuration in Django
3. Verify backend is running (check Render dashboard)
4. Check browser console for specific error

### Issue: Database Connection Error

**Solution**:
1. Verify `DATABASE_URL` format:
   ```
   postgresql://user:password@host:port/dbname
   ```
2. Check database is running in Render
3. Verify credentials are correct
4. Run migrations: `python manage.py migrate`

### Issue: Static Files Not Loading

**Solution**:
1. Run: `python manage.py collectstatic --noinput`
2. Commit and push changes
3. Render will auto-redeploy

### Issue: Domain/Subdomain Issues

**Solution for Custom Domain**:
1. Go to site settings
2. Add custom domain
3. Update DNS records (instructions provided)
4. Wait 24-48 hours for DNS propagation

---

## 📈 Scaling & Monitoring

### Monitor Performance
- **Render Dashboard**: View logs, metrics, uptime
- **Vercel Analytics**: Monitor frontend performance
- **Netlify Analytics**: Monitor site visits

### Scale for Growth
1. **Render**: Upgrade from Free → Paid plans
2. **Database**: Upgrade PostgreSQL plan
3. **Frontend**: Automatic CDN scaling

---

## 🚀 Post-Deployment Steps

1. **Test Login**: Use test credentials
   ```
   Email: student@gmail.com
   Password: student123
   ```

2. **Test Features**:
   - Browse menu
   - Place order
   - Track order
   - Check staff dashboard

3. **Monitor Logs**:
   - Check for errors
   - Monitor API response times
   - Track database queries

4. **Set Up Alerts**:
   - Configure error notifications
   - Set up uptime monitoring
   - Monitor resource usage

---

## 💰 Cost Breakdown

### Render (Recommended)
- **Backend**: $7/month (Web Service, Starter)
- **Database**: $15/month (PostgreSQL, Starter)
- **Frontend**: $0 (Static Site, Free)
- **Total**: ~$22/month

### Vercel + Render
- **Backend**: $7/month (Render)
- **Database**: $15/month (Render)
- **Frontend**: $0-20/month (Vercel, depending on usage)
- **Total**: ~$22-40/month

### Netlify + Render
- **Backend**: $7/month (Render)
- **Database**: $15/month (Render)
- **Frontend**: $0-20/month (Netlify, depending on usage)
- **Total**: ~$22-40/month

---

## 🎓 Next Steps

1. **Choose Platform**: Follow one of the three options above
2. **Push Code**: Get code into GitHub
3. **Deploy**: Use the step-by-step guide
4. **Test**: Verify all features work
5. **Monitor**: Set up monitoring and alerts
6. **Optimize**: Monitor performance and scale as needed

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Django Deployment**: https://docs.djangoproject.com/en/6.0/howto/deployment/

---

**Status**: ✅ Ready for Cloud Deployment  
**Last Updated**: May 28, 2026  
**Recommended**: Render (Full Stack) for simplicity
