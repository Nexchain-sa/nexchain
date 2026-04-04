const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── USERS ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          VARCHAR(200) NOT NULL,
        email         VARCHAR(200) UNIQUE NOT NULL,
        password      VARCHAR(255) NOT NULL,
        phone         VARCHAR(30),
        role          VARCHAR(20) NOT NULL CHECK (role IN ('buyer','supplier','admin','investor')),
        company_name  VARCHAR(200),
        company_cr    VARCHAR(50),
        logo_url      VARCHAR(500),
        city          VARCHAR(100),
        country       VARCHAR(100) DEFAULT 'SA',
        is_verified   BOOLEAN DEFAULT FALSE,
        is_approved   BOOLEAN DEFAULT FALSE,
        rating        NUMERIC(3,2) DEFAULT 0,
        total_orders  INTEGER DEFAULT 0,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── CATEGORIES ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        name_ar     VARCHAR(150) NOT NULL,
        name_en     VARCHAR(150) NOT NULL,
        icon        VARCHAR(10),
        parent_id   INTEGER REFERENCES categories(id),
        is_active   BOOLEAN DEFAULT TRUE
      );
    `);

    // ── RFQs (Requests for Quotation) ─────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS rfqs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_number      VARCHAR(30) UNIQUE NOT NULL,
        buyer_id        UUID NOT NULL REFERENCES users(id),
        title           VARCHAR(300) NOT NULL,
        description     TEXT,
        category_id     INTEGER REFERENCES categories(id),
        quantity        VARCHAR(100),
        unit            VARCHAR(50),
        budget_min      NUMERIC(15,2),
        budget_max      NUMERIC(15,2),
        currency        VARCHAR(10) DEFAULT 'SAR',
        delivery_date   DATE,
        closing_date    TIMESTAMP NOT NULL,
        status          VARCHAR(30) DEFAULT 'open'
                          CHECK (status IN ('open','closed','awarded','cancelled')),
        attachments     TEXT[],
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── QUOTES (Supplier Offers) ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_id          UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
        supplier_id     UUID NOT NULL REFERENCES users(id),
        unit_price      NUMERIC(15,2) NOT NULL,
        total_price     NUMERIC(15,2) NOT NULL,
        currency        VARCHAR(10) DEFAULT 'SAR',
        delivery_days   INTEGER,
        validity_days   INTEGER DEFAULT 30,
        payment_terms   VARCHAR(100),
        notes           TEXT,
        attachments     TEXT[],
        status          VARCHAR(30) DEFAULT 'submitted'
                          CHECK (status IN ('submitted','shortlisted','awarded','rejected')),
        submitted_at    TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW(),
        UNIQUE(rfq_id, supplier_id)
      );
    `);

    // ── PURCHASE ORDERS ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_number     VARCHAR(30) UNIQUE NOT NULL,
        rfq_id        UUID REFERENCES rfqs(id),
        quote_id      UUID REFERENCES quotes(id),
        buyer_id      UUID NOT NULL REFERENCES users(id),
        supplier_id   UUID NOT NULL REFERENCES users(id),
        total_amount  NUMERIC(15,2) NOT NULL,
        currency      VARCHAR(10) DEFAULT 'SAR',
        status        VARCHAR(30) DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','delivered','completed','cancelled')),
        delivery_date DATE,
        notes         TEXT,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── INVOICES ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number  VARCHAR(30) UNIQUE NOT NULL,
        po_id           UUID REFERENCES purchase_orders(id),
        buyer_id        UUID NOT NULL REFERENCES users(id),
        supplier_id     UUID NOT NULL REFERENCES users(id),
        amount          NUMERIC(15,2) NOT NULL,
        currency        VARCHAR(10) DEFAULT 'SAR',
        due_date        DATE NOT NULL,
        status          VARCHAR(30) DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','financing_requested','financed','paid','overdue')),
        file_url        VARCHAR(500),
        notes           TEXT,
        created_at      TIMESTAMP DEFAULT NOW(),
        updated_at      TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── FINANCING REQUESTS ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS financing_requests (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id        UUID NOT NULL REFERENCES invoices(id),
        requester_id      UUID NOT NULL REFERENCES users(id),
        requested_amount  NUMERIC(15,2) NOT NULL,
        financing_type    VARCHAR(30) CHECK (financing_type IN ('fund','company','individual','competition')),
        status            VARCHAR(30) DEFAULT 'open'
                            CHECK (status IN ('open','funded','cancelled','expired')),
        competition_end   TIMESTAMP,
        selected_bid_id   UUID,
        notes             TEXT,
        created_at        TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── FINANCING BIDS ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS financing_bids (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        financing_request_id UUID NOT NULL REFERENCES financing_requests(id) ON DELETE CASCADE,
        financier_id        UUID NOT NULL REFERENCES users(id),
        financier_type      VARCHAR(30) CHECK (financier_type IN ('fund','company','individual')),
        offered_amount      NUMERIC(15,2) NOT NULL,
        monthly_rate        NUMERIC(5,3) NOT NULL,
        duration_days       INTEGER NOT NULL,
        terms               TEXT,
        status              VARCHAR(20) DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected')),
        submitted_at        TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── COMPETITIONS / TENDERS ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        comp_number     VARCHAR(30) UNIQUE NOT NULL,
        buyer_id        UUID NOT NULL REFERENCES users(id),
        title           VARCHAR(300) NOT NULL,
        description     TEXT,
        type            VARCHAR(30) CHECK (type IN ('project','product','service','financing')),
        category_id     INTEGER REFERENCES categories(id),
        budget          NUMERIC(15,2),
        currency        VARCHAR(10) DEFAULT 'SAR',
        location        VARCHAR(200),
        closing_date    TIMESTAMP NOT NULL,
        status          VARCHAR(20) DEFAULT 'open'
                          CHECK (status IN ('open','closed','awarded','cancelled')),
        is_public       BOOLEAN DEFAULT TRUE,
        requirements    TEXT,
        attachments     TEXT[],
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── COMPETITION BIDS ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS competition_bids (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competition_id  UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
        supplier_id     UUID NOT NULL REFERENCES users(id),
        bid_amount      NUMERIC(15,2) NOT NULL,
        technical_score NUMERIC(5,2),
        notes           TEXT,
        attachments     TEXT[],
        status          VARCHAR(20) DEFAULT 'submitted'
                          CHECK (status IN ('submitted','shortlisted','awarded','rejected')),
        submitted_at    TIMESTAMP DEFAULT NOW(),
        UNIQUE(competition_id, supplier_id)
      );
    `);

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type        VARCHAR(50),
        title       VARCHAR(200),
        message     TEXT,
        link        VARCHAR(300),
        is_read     BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── INDEXES ───────────────────────────────────────────────────────────
    await client.query(`CREATE INDEX IF NOT EXISTS idx_rfqs_buyer     ON rfqs(buyer_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_rfqs_status    ON rfqs(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quotes_rfq     ON quotes(rfq_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quotes_supplier ON quotes(supplier_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_buyer  ON invoices(buyer_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notif_user      ON notifications(user_id);`);

    await client.query('COMMIT');
    console.log('✅ All tables created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

migrate();
