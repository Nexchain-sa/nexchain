# ⬡ FLOWRIZ — منصة سلاسل الإمداد الذكية

## هيكل المشروع
```
FLOWRIZ/
├── backend/          ← Node.js + Express API
│   ├── src/
│   │   ├── server.js         ← نقطة البداية
│   │   ├── config/
│   │   │   ├── db.js         ← اتصال PostgreSQL
│   │   │   ├── migrate.js    ← إنشاء الجداول
│   │   │   └── seed.js       ← البيانات الأولية
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── rfqController.js
│   │   │   └── mainController.js
│   │   ├── middleware/
│   │   │   └── auth.js       ← JWT authentication
│   │   └── routes/
│   │       └── index.js      ← جميع API Routes
│   └── .env.example
│
└── frontend/         ← React.js
    └── src/
        ├── App.jsx            ← التوجيه الرئيسي
        ├── context/AuthContext.jsx
        ├── utils/api.js       ← axios + جميع API calls
        ├── components/Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── RFQList.jsx
            ├── RFQCreate.jsx
            ├── RFQDetail.jsx
            ├── Competitions.jsx
            ├── Financing.jsx
            ├── Invoices.jsx
            ├── AdminPanel.jsx
            └── Profile.jsx
```

---

## 🚀 التشغيل خطوة بخطوة

### المتطلبات
- Node.js 18+
- PostgreSQL 14+
- npm أو yarn

---

### 1️⃣ إعداد قاعدة البيانات (PostgreSQL)

```sql
-- افتح psql وأنشئ قاعدة البيانات والمستخدم:
CREATE DATABASE FLOWRIZ_db;
CREATE USER FLOWRIZ_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE FLOWRIZ_db TO FLOWRIZ_user;
\c FLOWRIZ_db
GRANT ALL ON SCHEMA public TO FLOWRIZ_user;
```

---

### 2️⃣ إعداد Backend

```bash
cd FLOWRIZ/backend

# نسخ ملف البيئة
cp .env.example .env

# عدّل .env بقيمك الحقيقية:
# DB_HOST=localhost
# DB_NAME=FLOWRIZ_db
# DB_USER=FLOWRIZ_user
# DB_PASSWORD=your_strong_password
# JWT_SECRET=minimum_32_chars_secret_key

# تثبيت الحزم
npm install

# إنشاء الجداول
npm run db:migrate

# إدخال البيانات الأولية (فئات + حسابات تجريبية)
npm run db:seed

# تشغيل الخادم
npm run dev
# ✅ يعمل على: http://localhost:5000
```

---

### 3️⃣ إعداد Frontend

```bash
cd FLOWRIZ/frontend

# إنشاء ملف البيئة
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# تثبيت الحزم
npm install

# تشغيل التطبيق
npm start
# ✅ يفتح تلقائياً: http://localhost:3000
```

---

## 🔑 حسابات تجريبية جاهزة

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير النظام | admin@FLOWRIZ.sa | Admin@123456 |
| مشترٍ | buyer@demo.com | Buyer@123456 |
| مورد | supplier@demo.com | Supplier@123456 |

---

## 📡 API Endpoints الرئيسية

### المصادقة
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | /api/auth/register | تسجيل حساب |
| POST | /api/auth/login | تسجيل الدخول |
| GET  | /api/auth/me | بيانات المستخدم |
| PUT  | /api/auth/profile | تحديث الملف |

### طلبات الشراء (RFQ)
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET  | /api/rfqs | قائمة الطلبات |
| POST | /api/rfqs | إنشاء طلب |
| GET  | /api/rfqs/:id | تفاصيل طلب |
| POST | /api/rfqs/:id/quotes | تقديم عرض |
| POST | /api/rfqs/:id/award/:qid | ترسية عطاء |

### المنافسات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET  | /api/competitions | قائمة المنافسات |
| POST | /api/competitions | نشر منافسة |
| POST | /api/competitions/:id/bid | المشاركة |

### التمويل
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | /api/financing/request | طلب تمويل |
| GET  | /api/financing/requests | فرص التمويل |
| POST | /api/financing/requests/:id/bid | تقديم عرض تمويل |
| POST | /api/financing/bids/:id/accept | قبول عرض |

---

## 🌐 النشر على الإنترنت

### خيار A — مجاني (Render.com)
```bash
# Backend على Render:
# 1. ارفع FLOWRIZ/backend على GitHub
# 2. أنشئ Web Service على render.com
# 3. أضف متغيرات البيئة
# 4. Build Command: npm install
# 5. Start Command: node src/server.js

# Frontend على Netlify:
# 1. ارفع FLOWRIZ/frontend على GitHub
# 2. أنشئ موقع على netlify.com
# 3. Build: npm run build | Publish: build/
# 4. أضف: REACT_APP_API_URL=https://your-backend.onrender.com/api
```

### خيار B — VPS (DigitalOcean/Hetzner)
```bash
# على السيرفر:
sudo apt update && sudo apt install -y nodejs npm postgresql nginx

# PostgreSQL setup
sudo -u postgres psql -c "CREATE DATABASE FLOWRIZ_db;"
sudo -u postgres psql -c "CREATE USER FLOWRIZ_user WITH PASSWORD 'StrongPass123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE FLOWRIZ_db TO FLOWRIZ_user;"

# Backend
cd /var/www/FLOWRIZ/backend
npm install && npm run db:migrate && npm run db:seed
npm install -g pm2
pm2 start src/server.js --name FLOWRIZ-api
pm2 startup && pm2 save

# Frontend
cd /var/www/FLOWRIZ/frontend
npm install && npm run build

# Nginx config
# server { listen 80; location /api { proxy_pass http://localhost:5000; } location / { root /var/www/FLOWRIZ/frontend/build; try_files $uri /index.html; } }
```

---

## 📊 قاعدة البيانات — الجداول

| الجدول | الوصف |
|--------|-------|
| users | المستخدمون (مشترون، موردون، مستثمرون، مدراء) |
| categories | فئات المنتجات والخدمات |
| rfqs | طلبات عروض الأسعار |
| quotes | عروض الموردين |
| purchase_orders | أوامر الشراء |
| invoices | الفواتير |
| financing_requests | طلبات التمويل |
| financing_bids | عروض التمويل (المنافسة) |
| competitions | المنافسات والمناقصات |
| competition_bids | عروض المنافسات |
| notifications | الإشعارات |

---

## 🔒 الأمان المُطبَّق
- JWT Authentication مع انتهاء الصلاحية
- bcrypt لتشفير كلمات المرور
- Rate Limiting (200 طلب/15 دقيقة)
- Helmet.js لحماية HTTP Headers
- CORS مُقيَّد بالـ Frontend URL
- Role-based Authorization

---

## 📞 للمساعدة
- فحص صحة API: GET /health
- تشغيل migrate من جديد: npm run db:migrate
- إعادة seed: npm run db:seed
