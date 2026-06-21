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
    // user documents + review status (idempotent)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'approved'`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS review_note TEXT`).catch(()=>{});
    await client.query(`ALTER TABLE installments ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500)`).catch(()=>{});
    await client.query(`ALTER TABLE installments ADD COLUMN IF NOT EXISTS receipt_name VARCHAR(255)`).catch(()=>{});
    await client.query(`ALTER TABLE financing_requests ADD COLUMN IF NOT EXISTS earnest_amount NUMERIC(15,2) DEFAULT 0`).catch(()=>{});
    for (const col of ['contract_url VARCHAR(500)','contract_name VARCHAR(255)','promissory_url VARCHAR(500)','promissory_name VARCHAR(255)','signed_contract_url VARCHAR(500)','signed_contract_name VARCHAR(255)','signed_promissory_url VARCHAR(500)','signed_promissory_name VARCHAR(255)','signed_at TIMESTAMP','financing_mode VARCHAR(20)']) {
      await client.query(`ALTER TABLE financing_requests ADD COLUMN IF NOT EXISTS ${col}`).catch(()=>{});
    }
    // installments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS installments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        financing_request_id UUID REFERENCES financing_requests(id) ON DELETE CASCADE,
        invoice_id UUID REFERENCES invoices(id),
        payer_id UUID NOT NULL REFERENCES users(id),
        seq INTEGER NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'due' CHECK (status IN ('due','pending_review','paid','overdue')),
        late_fee NUMERIC(15,2) DEFAULT 0,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const { rows: buyerRow } = await client.query(`SELECT id FROM users WHERE email='buyer@demo.com'`);
    if (buyerRow.length) {
      const bId = buyerRow[0].id;
      const { rows: instCount } = await client.query(`SELECT COUNT(*)::int AS n FROM installments WHERE payer_id=$1`, [bId]);
      if (instCount[0].n === 0) {
        const demoInst = [[1,8500,'-60 days','paid'],[2,8500,'-30 days','due'],[3,8500,'-2 days','pending_review'],[4,8500,'28 days','due'],[5,8500,'58 days','due'],[6,8500,'88 days','due']];
        for (const [seq, amt, off, st] of demoInst) {
          await client.query(
            `INSERT INTO installments(payer_id,seq,amount,due_date,status,paid_at) VALUES($1,$2,$3, CURRENT_DATE + ($4)::interval, $5, $6)`,
            [bId, seq, amt, off, st, st === 'paid' ? new Date() : null]
          );
        }
        console.log('Demo installments seeded');
      }
    }
    // ── وحدة التصنيع (ORDRAX) — جداول ──────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS manufacturing_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(30) UNIQUE NOT NULL,
        customer_id UUID NOT NULL REFERENCES users(id),
        factory_id UUID REFERENCES users(id),
        product VARCHAR(300) NOT NULL,
        specs TEXT,
        quantity VARCHAR(100),
        total_amount NUMERIC(15,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'SAR',
        status VARCHAR(30) DEFAULT 'pending_match' CHECK (status IN ('pending_match','in_production','completed','cancelled')),
        released_amount NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS production_stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
        seq INTEGER NOT NULL,
        name VARCHAR(150) NOT NULL,
        payment_pct NUMERIC(5,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','qa_review','passed','failed')),
        qa_note TEXT,
        released BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // ذكاء التصنيع: أعمدة + سمات المصانع
    await client.query(`ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS category VARCHAR(40)`).catch(()=>{});
    await client.query(`ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS complexity VARCHAR(20)`).catch(()=>{});
    await client.query(`ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS escrow_funded NUMERIC(15,2) DEFAULT 0`).catch(()=>{});
    await client.query(`ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS invoice_id UUID`).catch(()=>{});
    await client.query(`ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS financing_request_id UUID`).catch(()=>{});
    // سوق التصنيع: عروض المصانع على الطلبات المفتوحة
    await client.query(`
      CREATE TABLE IF NOT EXISTS manufacturing_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
        factory_id UUID NOT NULL REFERENCES users(id),
        offered_price NUMERIC(15,2) NOT NULL,
        lead_days INTEGER,
        note TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(order_id, factory_id)
      );
    `).catch(()=>{});
    // التقييمات والمراجعات (سمعة المصانع/الموردين)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        target_type VARCHAR(20) NOT NULL,
        target_id UUID NOT NULL,
        subject_id UUID NOT NULL REFERENCES users(id),
        author_id UUID NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(target_type, target_id, author_id)
      );
    `).catch(()=>{});
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0`).catch(()=>{});
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfg_specialties JSONB DEFAULT '[]'::jsonb`).catch(()=>{});
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfg_capacity INTEGER DEFAULT 1000`).catch(()=>{});
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mfg_lead_days INTEGER DEFAULT 14`).catch(()=>{});
    await client.query(`UPDATE users SET mfg_specialties='["apparel","textile"]'::jsonb, mfg_capacity=5000, mfg_lead_days=9, rating=4.6 WHERE email='supplier@demo.com'`).catch(()=>{});
    // السوق الثانوي — جدول الإدراجات
    await client.query(`
      CREATE TABLE IF NOT EXISTS secondary_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bid_id UUID NOT NULL REFERENCES financing_bids(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES users(id),
        ask_price NUMERIC(15,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','sold','cancelled')),
        buyer_id UUID REFERENCES users(id),
        sold_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // الاستثمار التلقائي — قواعد الممولين
    await client.query(`
      CREATE TABLE IF NOT EXISTS auto_invest_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        financier_id UUID UNIQUE NOT NULL REFERENCES users(id),
        enabled BOOLEAN DEFAULT FALSE,
        max_grade VARCHAR(2) DEFAULT 'B',
        amount_per_deal NUMERIC(15,2) DEFAULT 0,
        min_monthly_rate NUMERIC(5,2) DEFAULT 2,
        max_total NUMERIC(15,2) DEFAULT 0,
        deployed NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
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
