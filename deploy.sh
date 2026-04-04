#!/bin/bash
# ════════════════════════════════════════════════════════
# FLOWRIZ — سكريبت النشر التلقائي الكامل
# يعمل على أي VPS (Ubuntu 20.04 / 22.04)
# تشغيل: chmod +x deploy.sh && sudo ./deploy.sh
# ════════════════════════════════════════════════════════

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log() { echo -e "${CYAN}[FLOWRIZ]${NC} $1"; }
ok()  { echo -e "${GREEN}✅ $1${NC}"; }
err() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── تحقق من الصلاحيات ──
[[ $EUID -ne 0 ]] && err "يجب التشغيل كـ root"

log "بدء تثبيت FLOWRIZ على السيرفر..."

# ── 1. تحديث النظام ──
log "1/8 تحديث النظام..."
apt-get update -qq && apt-get upgrade -y -qq
ok "النظام محدّث"

# ── 2. تثبيت Node.js 20 ──
log "2/8 تثبيت Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
ok "Node.js $(node -v) مثبّت"

# ── 3. تثبيت PostgreSQL ──
log "3/8 تثبيت PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql && systemctl enable postgresql
ok "PostgreSQL مثبّت ويعمل"

# ── 4. إعداد قاعدة البيانات ──
log "4/8 إعداد قاعدة البيانات..."
DB_PASS=$(openssl rand -base64 24 | tr -d "=+/")
sudo -u postgres psql -c "CREATE DATABASE FLOWRIZ_db;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER FLOWRIZ_user WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE FLOWRIZ_db TO FLOWRIZ_user;" 2>/dev/null || true
sudo -u postgres psql -d FLOWRIZ_db -c "GRANT ALL ON SCHEMA public TO FLOWRIZ_user;" 2>/dev/null || true
ok "قاعدة البيانات جاهزة"

# ── 5. تثبيت Nginx ──
log "5/8 تثبيت وإعداد Nginx..."
apt-get install -y nginx
ok "Nginx مثبّت"

# ── 6. تثبيت PM2 ──
log "6/8 تثبيت PM2..."
npm install -g pm2
ok "PM2 مثبّت"

# ── 7. استنساخ المشروع ──
log "7/8 تجهيز ملفات المشروع..."
mkdir -p /var/www/FLOWRIZ
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/")
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

# إنشاء .env للـ backend
cat > /var/www/FLOWRIZ/.env << ENVEOF
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=FLOWRIZ_db
DB_USER=FLOWRIZ_user
DB_PASSWORD=$DB_PASS
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://$SERVER_IP
ENVEOF

ok "ملف البيئة (.env) تم إنشاؤه"

# ── 8. إعداد Nginx ──
log "8/8 إعداد Nginx..."
cat > /etc/nginx/sites-available/FLOWRIZ << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 20M;

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
    }

    # Static uploads
    location /uploads {
        proxy_pass http://localhost:5000;
    }

    # Frontend React App
    location / {
        root /var/www/FLOWRIZ/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/FLOWRIZ /etc/nginx/sites-enabled/FLOWRIZ
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx مُعدّ"

# ── حفظ معلومات التثبيت ──
cat > /root/FLOWRIZ-install-info.txt << INFOEOF
════════════════════════════════════════════
FLOWRIZ — معلومات التثبيت
تاريخ: $(date)
════════════════════════════════════════════

🌐 عنوان السيرفر:   http://$SERVER_IP

🗄️ قاعدة البيانات:
   Database: FLOWRIZ_db
   User:     FLOWRIZ_user
   Password: $DB_PASS

🔑 JWT Secret: $JWT_SECRET

📁 مسار الملفات:
   Backend:  /var/www/FLOWRIZ/backend
   Frontend: /var/www/FLOWRIZ/frontend
   Env File: /var/www/FLOWRIZ/.env

👤 حسابات النظام:
   Admin:    admin@FLOWRIZ.sa / Admin@123456
   Buyer:    buyer@demo.com / Buyer@123456
   Supplier: supplier@demo.com / Supplier@123456

🔧 أوامر مفيدة:
   pm2 list          - عرض العمليات
   pm2 logs FLOWRIZ - عرض السجلات
   pm2 restart FLOWRIZ - إعادة التشغيل
   nginx -t          - فحص إعدادات Nginx
════════════════════════════════════════════
INFOEOF

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ تم تثبيت FLOWRIZ بنجاح!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📋 الخطوات التالية:"
echo "1. انسخ مجلد backend إلى: /var/www/FLOWRIZ/backend"
echo "2. انسخ ملف .env إلى:     /var/www/FLOWRIZ/backend/.env"
echo "3. شغّل:                  cd /var/www/FLOWRIZ/backend && npm install"
echo "4. شغّل:                  node src/config/migrate.js && node src/config/seed.js"
echo "5. شغّل:                  pm2 start src/server.js --name FLOWRIZ"
echo "6. انسخ build إلى:        /var/www/FLOWRIZ/frontend/build"
echo ""
echo -e "${CYAN}🌐 المنصة ستكون متاحة على: http://$SERVER_IP${NC}"
echo -e "${CYAN}📄 معلومات التثبيت محفوظة في: /root/FLOWRIZ-install-info.txt${NC}"
