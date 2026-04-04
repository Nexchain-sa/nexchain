require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const routes = require('./routes/index');
const pool   = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Auto migrate & seed on startup ───────────────────────────────────────────
const autoSetup = async () => {
  const client = await pool.connect();
  try {
    // Check if users table exists
    const { rows } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      ) as exists
    `);
    if (!rows[0].exists) {
      console.log('⚙️ Running database migration...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(200) NOT NULL,
          email VARCHAR(200) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(30),
          role VARCHAR(20) NOT NULL CHECK (role IN ('buyer','supplier','admin','investor','owner')),
          company_name VARCHAR(200),
          company_cr VARCHAR(50),
          logo_url VARCHAR(500),
          city VARCHAR(100),
          country VARCHAR(100) DEFAULT 'SA',
          is_verified BOOLEAN DEFAULT FALSE,
          is_approved BOOLEAN DEFAULT FALSE,
          rating NUMERIC(3,2) DEFAULT 0,
          total_orders INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name_ar VARCHAR(150) NOT NULL,
          name_en VARCHAR(150) NOT NULL,
          icon VARCHAR(10),
          parent_id INTEGER REFERENCES categories(id),
          is_active BOOLEAN DEFAULT TRUE
        );
        CREATE TABLE IF NOT EXISTS rfqs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rfq_number VARCHAR(30) UNIQUE NOT NULL,
          buyer_id UUID NOT NULL REFERENCES users(id),
          title VARCHAR(300) NOT NULL,
          description TEXT,
          category_id INTEGER REFERENCES categories(id),
          quantity VARCHAR(100),
          unit VARCHAR(50),
          budget_min NUMERIC(15,2),
          budget_max NUMERIC(15,2),
          currency VARCHAR(10) DEFAULT 'SAR',
          delivery_date DATE,
          closing_date TIMESTAMP NOT NULL,
          status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open','closed','awarded','cancelled')),
          attachments TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS quotes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
          supplier_id UUID NOT NULL REFERENCES users(id),
          unit_price NUMERIC(15,2) NOT NULL,
          total_price NUMERIC(15,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'SAR',
          delivery_days INTEGER,
          validity_days INTEGER DEFAULT 30,
          payment_terms VARCHAR(100),
          notes TEXT,
          attachments TEXT[],
          status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted','shortlisted','awarded','rejected')),
          submitted_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(rfq_id, supplier_id)
        );
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          po_number VARCHAR(30) UNIQUE NOT NULL,
          rfq_id UUID REFERENCES rfqs(id),
          quote_id UUID REFERENCES quotes(id),
          buyer_id UUID NOT NULL REFERENCES users(id),
          supplier_id UUID NOT NULL REFERENCES users(id),
          total_amount NUMERIC(15,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'SAR',
          status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','delivered','completed','cancelled')),
          delivery_date DATE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_number VARCHAR(30) UNIQUE NOT NULL,
          po_id UUID REFERENCES purchase_orders(id),
          buyer_id UUID NOT NULL REFERENCES users(id),
          supplier_id UUID NOT NULL REFERENCES users(id),
          amount NUMERIC(15,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'SAR',
          due_date DATE NOT NULL,
          status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','approved','financing_requested','financed','paid','overdue')),
          file_url VARCHAR(500),
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS financing_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_id UUID NOT NULL REFERENCES invoices(id),
          requester_id UUID NOT NULL REFERENCES users(id),
          requested_amount NUMERIC(15,2) NOT NULL,
          financing_type VARCHAR(30) CHECK (financing_type IN ('fund','company','individual','competition')),
          status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open','funded','cancelled','expired')),
          competition_end TIMESTAMP,
          selected_bid_id UUID,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS financing_bids (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          financing_request_id UUID NOT NULL REFERENCES financing_requests(id) ON DELETE CASCADE,
          financier_id UUID NOT NULL REFERENCES users(id),
          financier_type VARCHAR(30) CHECK (financier_type IN ('fund','company','individual')),
          offered_amount NUMERIC(15,2) NOT NULL,
          monthly_rate NUMERIC(5,3) NOT NULL,
          duration_days INTEGER NOT NULL,
          terms TEXT,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
          submitted_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS competitions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          comp_number VARCHAR(30) UNIQUE NOT NULL,
          buyer_id UUID NOT NULL REFERENCES users(id),
          title VARCHAR(300) NOT NULL,
          description TEXT,
          type VARCHAR(30) CHECK (type IN ('project','product','service','financing')),
          category_id INTEGER REFERENCES categories(id),
          budget NUMERIC(15,2),
          currency VARCHAR(10) DEFAULT 'SAR',
          location VARCHAR(200),
          closing_date TIMESTAMP NOT NULL,
          status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','closed','awarded','cancelled')),
          is_public BOOLEAN DEFAULT TRUE,
          requirements TEXT,
          attachments TEXT[],
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS competition_bids (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
          supplier_id UUID NOT NULL REFERENCES users(id),
          bid_amount NUMERIC(15,2) NOT NULL,
          technical_score NUMERIC(5,2),
          notes TEXT,
          attachments TEXT[],
          status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted','shortlisted','awarded','rejected')),
          submitted_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(competition_id, supplier_id)
        );
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50),
          title VARCHAR(200),
          message TEXT,
          link VARCHAR(300),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Migration complete');

      // Seed demo data
      const bcrypt = require('bcryptjs');
      const adminHash = await bcrypt.hash('Admin@123456', 12);
      const buyerHash = await bcrypt.hash('Buyer@123456', 12);
      const supHash   = await bcrypt.hash('Supplier@123456', 12);

      const cats = [
        [1,'تقنية المعلومات','Information Technology','💻'],
        [2,'المعدات الصناعية','Industrial Equipment','🏭'],
        [3,'الصحة والطب','Healthcare & Medical','🏥'],
        [4,'البناء والمقاولات','Construction','🏗️'],
        [5,'الخدمات اللوجستية','Logistics & Transport','🚚'],
        [6,'المواد الغذائية','Food & Beverages','🍱'],
        [7,'المواد الكيميائية','Chemicals','⚗️'],
        [8,'الطاقة والكهرباء','Energy & Electrical','⚡'],
        [9,'المستلزمات المكتبية','Office Supplies','📦'],
        [10,'الخدمات المهنية','Professional Services','🤝'],
      ];
      for (const [id,ar,en,icon] of cats) {
        await client.query(
          `INSERT INTO categories(id,name_ar,name_en,icon) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING`,
          [id,ar,en,icon]
        );
      }
      await client.query(`INSERT INTO users(name,email,password,role,company_name,is_verified,is_approved) VALUES('مدير النظام','admin@FLOWRIZ.sa',$1,'admin','FLOWRIZ Platform',true,true) ON CONFLICT(email) DO NOTHING`, [adminHash]);
      await client.query(`INSERT INTO users(name,email,password,role,company_name,phone,city,is_verified,is_approved) VALUES('شركة الرياض للتقنية','buyer@demo.com',$1,'buyer','شركة الرياض للتقنية','+966501234567','الرياض',true,true) ON CONFLICT(email) DO NOTHING`, [buyerHash]);
      await client.query(`INSERT INTO users(name,email,password,role,company_name,phone,city,is_verified,is_approved) VALUES('مؤسسة النخبة للتوريد','supplier@demo.com',$1,'supplier','مؤسسة النخبة للتوريد','+966509876543','جدة',true,true) ON CONFLICT(email) DO NOTHING`, [supHash]);
      console.log('✅ Seed complete — FLOWRIZ is ready!');
    } else {
      console.log('✅ Tables exist — ensuring demo accounts...');
    }

    // Always ensure all accounts exist (safe with ON CONFLICT DO NOTHING)
    const bcrypt = require('bcryptjs');
    const ownerHash = await bcrypt.hash('Owner@Flowriz2025', 12);
    const adminHash = await bcrypt.hash('Admin@123456', 12);
    const buyerHash = await bcrypt.hash('Buyer@123456', 12);
    const supHash   = await bcrypt.hash('Supplier@123456', 12);
    // Add owner role support via ALTER TABLE
    await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`).catch(()=>{});
    await client.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('buyer','supplier','admin','investor','owner'))`).catch(()=>{});
    await client.query(`INSERT INTO users(name,email,password,role,company_name,is_verified,is_approved) VALUES('مالك المنصة','owner@FLOWRIZ.sa',$1,'owner','FLOWRIZ Platform',true,true) ON CONFLICT(email) DO NOTHING`, [ownerHash]);
    await client.query(`INSERT INTO users(name,email,password,role,company_name,is_verified,is_approved) VALUES('مدير النظام','admin@FLOWRIZ.sa',$1,'admin','FLOWRIZ Platform',true,true) ON CONFLICT(email) DO NOTHING`, [adminHash]);
    await client.query(`INSERT INTO users(name,email,password,role,company_name,phone,city,is_verified,is_approved) VALUES('شركة الرياض للتقنية','buyer@demo.com',$1,'buyer','شركة الرياض للتقنية','+966501234567','الرياض',true,true) ON CONFLICT(email) DO NOTHING`, [buyerHash]);
    await client.query(`INSERT INTO users(name,email,password,role,company_name,phone,city,is_verified,is_approved) VALUES('مؤسسة النخبة للتوريد','supplier@demo.com',$1,'supplier','مؤسسة النخبة للتوريد','+966509876543','جدة',true,true) ON CONFLICT(email) DO NOTHING`, [supHash]);
    console.log('✅ All accounts ready! Owner: owner@FLOWRIZ.sa');

  } catch (err) {
    console.error('❌ Auto-setup error:', err.message);
  } finally {
    client.release();
  }
};

// ── Security & Middlewares ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'طلبات كثيرة — حاول لاحقاً' },
}));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'المسار غير موجود' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
});

app.listen(PORT, async () => {
  console.log(`🚀 FLOWRIZ API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  await autoSetup();
});

module.exports = app;
