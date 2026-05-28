# Smart Canteen Portal - Production Deployment Guide

## ✅ Current Status
All systems are ready for deployment. The project has passed:
- Django system checks
- Dependency verification
- Database migrations
- Frontend build verification
- API endpoint testing

---

## 🚀 Deployment Steps

### 1. Environment Configuration

Create a `.env` file in the project root:
```bash
# Security
DJANGO_SECRET_KEY=your-very-long-random-secret-key-here
DJANGO_DEBUG=False

# Deployment
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database (Optional - for PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/smartcanteen

# Email (Optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### 2. Backend Setup

```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone <your-repo-url>
cd "smart canteen portal"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn  # Production WSGI server
pip install psycopg2-binary  # If using PostgreSQL

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 3. Frontend Build

```bash
cd frontend
npm install
npm run build

# The `dist/` folder contains production-ready files
# Upload these to your web server or CDN
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/smartcanteen`:

```nginx
upstream smartcanteen_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    client_max_body_size 10M;
    
    # Static files from Django
    location /static/ {
        alias /path/to/project/staticfiles/;
        expires 30d;
    }
    
    # Media files
    location /media/ {
        alias /path/to/project/media/;
        expires 7d;
    }
    
    # Frontend dist files (if served from same server)
    location / {
        try_files $uri $uri/ /index.html;
        alias /path/to/project/frontend/dist/;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://smartcanteen_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/smartcanteen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Gunicorn Setup

Create `/etc/systemd/system/smartcanteen.service`:

```ini
[Unit]
Description=Smart Canteen Portal
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/project
Environment="PATH=/path/to/project/venv/bin"
ExecStart=/path/to/project/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    smartserve_backend.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable smartcanteen
sudo systemctl start smartcanteen
sudo systemctl status smartcanteen
```

### 6. SSL/TLS Certificate

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 7. Database (PostgreSQL Recommended)

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE smartcanteen;
CREATE USER smartcanteen WITH PASSWORD 'secure-password';
ALTER ROLE smartcanteen SET client_encoding TO 'utf8';
ALTER ROLE smartcanteen SET default_transaction_isolation TO 'read committed';
ALTER ROLE smartcanteen SET default_transaction_deferrable TO on;
ALTER ROLE smartcanteen SET timezone TO 'Asia/Kolkata';
GRANT ALL PRIVILEGES ON DATABASE smartcanteen TO smartcanteen;
\q
```

Update `.env`:
```
DATABASE_URL=postgresql://smartcanteen:secure-password@localhost:5432/smartcanteen
```

### 8. Monitoring & Logging

Create `/etc/rsyslog.d/smartcanteen.conf`:
```
if $programname == 'gunicorn' then /var/log/smartcanteen/access.log
if $programname == 'gunicorn' then /var/log/smartcanteen/error.log
& stop
```

```bash
sudo mkdir -p /var/log/smartcanteen
sudo chown www-data:www-data /var/log/smartcanteen
sudo systemctl restart rsyslog
```

---

## 🔧 Production Security Checklist

- [ ] `SECRET_KEY` changed to secure random value
- [ ] `DEBUG = False`
- [ ] `ALLOWED_HOSTS` configured with actual domains
- [ ] `SECURE_SSL_REDIRECT = True`
- [ ] `SECURE_HSTS_SECONDS = 31536000`
- [ ] `SECURE_BROWSER_XSS_FILTER = True`
- [ ] `SECURE_CONTENT_SECURITY_POLICY` configured
- [ ] SSL/TLS certificates installed
- [ ] Database password secured
- [ ] API rate limiting configured
- [ ] CORS origins limited to actual frontends
- [ ] Error logging configured
- [ ] Database backups automated
- [ ] Firewall rules configured

---

## 📊 Monitoring Commands

```bash
# Check service status
sudo systemctl status smartcanteen

# View logs
sudo journalctl -u smartcanteen -f  # Live logs
sudo journalctl -u smartcanteen -n 100  # Last 100 lines

# Monitor resources
top
ps aux | grep gunicorn

# Database health
python manage.py dbshell

# Check migrations
python manage.py showmigrations
```

---

## 🔄 Updates & Maintenance

```bash
# Update code
git pull origin main

# Install new dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart service
sudo systemctl restart smartcanteen
```

---

## 📱 Frontend Deployment (Alternative)

If hosting frontend separately:

```bash
# Build frontend
cd frontend
npm run build

# Upload dist/ folder to CDN or static hosting
# Configure API endpoint in frontend/.env or API base URL

# Update CORS in Django settings
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

---

## 🆘 Troubleshooting

### Django Not Starting
```bash
# Check logs
sudo journalctl -u smartcanteen -n 50 --no-pager

# Run directly for debugging
cd /path/to/project
source venv/bin/activate
python manage.py runserver
```

### Static Files Not Loading
```bash
# Recollect static files
python manage.py collectstatic --noinput --clear

# Check permissions
sudo chown -R www-data:www-data /path/to/project/staticfiles
sudo chmod -R 755 /path/to/project/staticfiles
```

### Database Connection Error
```bash
# Test PostgreSQL connection
python manage.py shell -c "from django.db import connection; print(connection.ensure_connection())"

# Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/database
```

### Nginx 502 Bad Gateway
```bash
# Check if Gunicorn is running
sudo systemctl status smartcanteen

# Check Gunicorn socket
lsof -i :8000

# Restart services
sudo systemctl restart smartcanteen
sudo systemctl restart nginx
```

---

## 📞 Support Resources

- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- Gunicorn Docs: https://gunicorn.org/
- Nginx Docs: https://nginx.org/
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Last Updated**: May 28, 2026  
**Status**: ✅ Ready for Production
