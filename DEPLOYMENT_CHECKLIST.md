# 🚀 Smart Canteen Portal - Quick Deployment Checklist

## ✅ Pre-Deployment Verification (COMPLETED)

### Backend
- ✅ Django system check: PASSED
- ✅ All migrations applied
- ✅ Database populated (5 users, 226 menu items, 106 slots)
- ✅ Dependencies installed (9 packages, 0 vulnerabilities)
- ✅ Static files collected
- ✅ Server starts without errors
- ✅ JWT authentication configured

### Frontend
- ✅ React build successful
- ✅ TypeScript compilation passed
- ✅ Bundle size: 1.3MB gzipped
- ✅ All dependencies installed (103 packages, 0 vulnerabilities)

---

## 📋 Production Deployment Checklist

### Phase 1: Code & Configuration
- [ ] Create `.env` file with production settings
- [ ] Change `DJANGO_SECRET_KEY` to random 50+ character string
- [ ] Set `DEBUG = False`
- [ ] Update `ALLOWED_HOSTS` with actual domain
- [ ] Update `CORS_ALLOW_ALL_ORIGINS = False`
- [ ] Set specific CORS origins
- [ ] Review and update all API URLs in frontend

### Phase 2: Security
- [ ] Enable HTTPS/SSL certificates
- [ ] Set `SECURE_SSL_REDIRECT = True`
- [ ] Set `SECURE_HSTS_SECONDS = 31536000`
- [ ] Configure security headers in Nginx
- [ ] Set strong database password
- [ ] Configure firewall rules
- [ ] Review and restrict admin access

### Phase 3: Database
- [ ] Switch from SQLite to PostgreSQL
- [ ] Create production database
- [ ] Set `DATABASE_URL` environment variable
- [ ] Run migrations on production DB
- [ ] Set up automated backups
- [ ] Test database restore procedure

### Phase 4: Server & Infrastructure
- [ ] Set up Linux server (Ubuntu 20.04+ recommended)
- [ ] Install Python 3.10+, Node.js 18+
- [ ] Install PostgreSQL 12+
- [ ] Install Nginx
- [ ] Configure Gunicorn with 4+ workers
- [ ] Set up systemd service for auto-restart
- [ ] Configure Nginx reverse proxy
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Set up auto-renewal for SSL cert

### Phase 5: Application Setup
- [ ] Clone repository to production server
- [ ] Create Python virtual environment
- [ ] Install dependencies from requirements.txt
- [ ] Collect Django static files
- [ ] Run Django migrations
- [ ] Create superuser account
- [ ] Build React frontend
- [ ] Upload frontend dist/ files

### Phase 6: Testing
- [ ] Test user registration/login
- [ ] Test menu browsing and search
- [ ] Test order placement
- [ ] Test order tracking
- [ ] Test staff operations
- [ ] Test queue management
- [ ] Test payment flows
- [ ] Test notifications
- [ ] Verify CORS is working correctly
- [ ] Check SSL certificate is valid

### Phase 7: Monitoring & Logging
- [ ] Set up error logging
- [ ] Configure access logs
- [ ] Set up monitoring alerts
- [ ] Test log rotation
- [ ] Set up uptime monitoring
- [ ] Configure backup verification

### Phase 8: Go Live
- [ ] Update DNS to point to production server
- [ ] Monitor for any errors in first hour
- [ ] Check server resource usage
- [ ] Verify all users can access the system
- [ ] Set up on-call support

---

## 🔐 Security Settings to Update

**File: `smartserve_backend/settings.py`**

```python
# CHANGE THESE FOR PRODUCTION
DEBUG = False  # Currently: DEBUG mode
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')  # Use env variable
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# ADD THESE FOR PRODUCTION
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_SECURITY_POLICY = {
    "default-src": ("'self'",),
    "script-src": ("'self'", "'unsafe-inline'"),
    "style-src": ("'self'", "'unsafe-inline'"),
    "img-src": ("'self'", "data:", "https:"),
}

CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

# Limit rate
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

---

## 🌐 Environment Variables Template

```bash
# .env file
DJANGO_SECRET_KEY=your-super-secret-key-with-50-chars-minimum-here
DJANGO_DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/smartcanteen

# Optional: Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-specific-password

# Optional: AWS S3 for media/static
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
```

---

## 🚦 Status Indicators

| Component | Status | Version |
|-----------|--------|---------|
| Django | ✅ Ready | 6.0.5 |
| DRF | ✅ Ready | 3.17.1 |
| React | ✅ Ready | 19.0.0 |
| Vite | ✅ Ready | 8.0.12 |
| PostgreSQL | ⚠️ Recommended | - |
| Gunicorn | ⚠️ Required | - |
| Nginx | ⚠️ Required | - |

---

## 📞 Quick Commands Reference

### Backend
```bash
# Check status
sudo systemctl status smartcanteen

# View logs
sudo journalctl -u smartcanteen -f

# Restart
sudo systemctl restart smartcanteen

# Manual run (for debugging)
python manage.py runserver 0.0.0.0:8000
```

### Database
```bash
# Connect to PostgreSQL
psql -U smartcanteen -d smartcanteen

# Backup
pg_dump -U smartcanteen -d smartcanteen > backup.sql

# Restore
psql -U smartcanteen -d smartcanteen < backup.sql
```

### Frontend
```bash
# Build
npm run build

# Preview
npm run preview
```

---

## 📈 Performance Tips

1. **Enable Compression**: Configure gzip in Nginx
2. **Use CDN**: Serve static assets from CDN
3. **Database Indexing**: Ensure database indexes are created
4. **Caching**: Add Redis for session/cache management
5. **Load Balancing**: Use multiple Gunicorn workers
6. **Monitoring**: Set up New Relic or DataDog

---

## ⚠️ Common Issues & Solutions

### Issue: Static files not loading (CSS/JS)
**Solution**: Run `python manage.py collectstatic --noinput --clear`

### Issue: 502 Bad Gateway
**Solution**: Check Gunicorn status with `sudo systemctl status smartcanteen`

### Issue: CORS errors in browser
**Solution**: Verify `CORS_ALLOWED_ORIGINS` matches frontend domain exactly

### Issue: Database connection refused
**Solution**: Check PostgreSQL is running and `DATABASE_URL` is correct

### Issue: Migrations fail
**Solution**: Check database user permissions and run migrations as sudo if needed

---

## 📞 Support

- **Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **GitHub Issues**: Report bugs at project repository
- **Team**: Contact your deployment administrator

---

**Last Generated**: May 28, 2026  
**Project**: Smart Canteen Portal  
**Status**: ✅ Ready for Production Deployment
