const pool = require('../config/db');

const genNumber = (p) => `${p}-${Date.now().toString().slice(-8)}`;

// ═══════════════════════════════
// QUOTES
// ═══════════════════════════════
exports.submitQuote = async (req, res) => {
  try {
    const { rfq_id } = req.params;
    const { unit_price, total_price, delivery_days, validity_days, payment_terms, notes } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO quotes(rfq_id,supplier_id,unit_price,total_price,delivery_days,validity_days,payment_terms,notes)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(rfq_id,supplier_id) DO UPDATE
        SET unit_price=$3,total_price=$4,delivery_days=$5,validity_days=$6,payment_terms=$7,notes=$8,updated_at=NOW()
      RETURNING *
    `, [rfq_id, req.user.id, unit_price, total_price, delivery_days, validity_days, payment_terms, notes]);
    res.status(201).json({ success: true, data: rows[0], message: 'تم تقديم عرضك بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.myQuotes = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.*, r.title as rfq_title, r.rfq_number, u.company_name as buyer_company
      FROM quotes q JOIN rfqs r ON q.rfq_id=r.id JOIN users u ON r.buyer_id=u.id
      WHERE q.supplier_id=$1 ORDER BY q.submitted_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// ═══════════════════════════════
// INVOICES
// ═══════════════════════════════
exports.listInvoices = async (req, res) => {
  try {
    const field = req.user.role === 'buyer' ? 'buyer_id' : 'supplier_id';
    const { rows } = await pool.query(`
      SELECT i.*, u1.company_name as buyer_name, u2.company_name as supplier_name
      FROM invoices i
      JOIN users u1 ON i.buyer_id=u1.id
      JOIN users u2 ON i.supplier_id=u2.id
      WHERE i.${field}=$1 ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { po_id, buyer_id, supplier_id, amount, due_date, notes } = req.body;
    const invoice_number = genNumber('INV');
    const { rows } = await pool.query(`
      INSERT INTO invoices(invoice_number,po_id,buyer_id,supplier_id,amount,due_date,notes)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [invoice_number, po_id, buyer_id, supplier_id, amount, due_date, notes]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// ═══════════════════════════════
// FINANCING
// ═══════════════════════════════
exports.requestFinancing = async (req, res) => {
  try {
    const { invoice_id, requested_amount, financing_type, competition_end } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO financing_requests(invoice_id,requester_id,requested_amount,financing_type,competition_end)
      VALUES($1,$2,$3,$4,$5) RETURNING *
    `, [invoice_id, req.user.id, requested_amount, financing_type, competition_end]);
    await pool.query(`UPDATE invoices SET status='financing_requested' WHERE id=$1`, [invoice_id]);
    res.status(201).json({ success: true, data: rows[0], message: 'تم تقديم طلب التمويل' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.listFinancingRequests = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT fr.*, i.invoice_number, i.amount as invoice_amount, i.due_date,
             u.company_name as requester_name,
             (SELECT COUNT(*) FROM financing_bids fb WHERE fb.financing_request_id=fr.id) as bid_count,
             (SELECT MIN(fb.monthly_rate) FROM financing_bids fb WHERE fb.financing_request_id=fr.id) as best_rate
      FROM financing_requests fr
      JOIN invoices i ON fr.invoice_id=i.id
      JOIN users u ON fr.requester_id=u.id
      WHERE fr.status='open'
      ORDER BY fr.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.submitFinancingBid = async (req, res) => {
  try {
    const { financing_request_id } = req.params;
    const { offered_amount, monthly_rate, duration_days, terms, financier_type } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO financing_bids(financing_request_id,financier_id,financier_type,offered_amount,monthly_rate,duration_days,terms)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [financing_request_id, req.user.id, financier_type, offered_amount, monthly_rate, duration_days, terms]);
    res.status(201).json({ success: true, data: rows[0], message: 'تم تقديم عرض التمويل' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.acceptFinancingBid = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { bid_id } = req.params;
    const { rows: bid } = await client.query('SELECT * FROM financing_bids WHERE id=$1', [bid_id]);
    if (!bid.length) return res.status(404).json({ success: false, message: 'العرض غير موجود' });

    await client.query(`UPDATE financing_bids SET status='accepted' WHERE id=$1`, [bid_id]);
    await client.query(`UPDATE financing_bids SET status='rejected' WHERE financing_request_id=$1 AND id!=$2`, [bid[0].financing_request_id, bid_id]);
    await client.query(`UPDATE financing_requests SET status='funded',selected_bid_id=$1 WHERE id=$2`, [bid_id, bid[0].financing_request_id]);
    await client.query(`
      UPDATE invoices SET status='financed' WHERE id=(
        SELECT invoice_id FROM financing_requests WHERE id=$1)
    `, [bid[0].financing_request_id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'تم قبول عرض التمويل بنجاح' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  } finally { client.release(); }
};

// ═══════════════════════════════
// COMPETITIONS
// ═══════════════════════════════
exports.listCompetitions = async (req, res) => {
  try {
    const { type, status = 'open', search } = req.query;
    let where = [`c.status=$1`]; let params = [status]; let i = 2;
    if (type)   { where.push(`c.type=$${i++}`);        params.push(type); }
    if (search) { where.push(`c.title ILIKE $${i++}`); params.push(`%${search}%`); }
    if (req.user.role === 'buyer') { where.push(`c.buyer_id=$${i++}`); params.push(req.user.id); }

    const { rows } = await pool.query(`
      SELECT c.*, u.company_name as buyer_name,
             (SELECT COUNT(*) FROM competition_bids cb WHERE cb.competition_id=c.id) as bid_count
      FROM competitions c JOIN users u ON c.buyer_id=u.id
      WHERE ${where.join(' AND ')}
      ORDER BY c.created_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.createCompetition = async (req, res) => {
  try {
    const { title, description, type, category_id, budget, location, closing_date, requirements } = req.body;
    const comp_number = genNumber('COMP');
    const { rows } = await pool.query(`
      INSERT INTO competitions(comp_number,buyer_id,title,description,type,category_id,budget,location,closing_date,requirements)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [comp_number, req.user.id, title, description, type, category_id, budget, location, closing_date, requirements]);
    res.status(201).json({ success: true, data: rows[0], message: 'تم نشر المنافسة' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.submitCompBid = async (req, res) => {
  try {
    const { competition_id } = req.params;
    const { bid_amount, notes } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO competition_bids(competition_id,supplier_id,bid_amount,notes)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(competition_id,supplier_id) DO UPDATE SET bid_amount=$3,notes=$4
      RETURNING *
    `, [competition_id, req.user.id, bid_amount, notes]);
    res.status(201).json({ success: true, data: rows[0], message: 'تم تقديم عرضك في المنافسة' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// ═══════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════
exports.dashboardStats = async (req, res) => {
  try {
    const id = req.user.id;
    const role = req.user.role;
    let stats = {};

    if (role === 'buyer') {
      const [rfq, po, inv, fin] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM rfqs WHERE buyer_id=$1', [id]),
        pool.query('SELECT COUNT(*),COALESCE(SUM(total_amount),0) as total FROM purchase_orders WHERE buyer_id=$1', [id]),
        pool.query('SELECT COUNT(*) FROM invoices WHERE buyer_id=$1', [id]),
        pool.query(`SELECT COUNT(*) FROM financing_requests fr JOIN invoices i ON fr.invoice_id=i.id WHERE i.buyer_id=$1`, [id]),
      ]);
      stats = {
        rfqs: +rfq.rows[0].count,
        orders: +po.rows[0].count,
        orders_value: po.rows[0].total,
        invoices: +inv.rows[0].count,
        financing: +fin.rows[0].count,
      };
    } else if (role === 'supplier') {
      const [quotes, won, sales] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM quotes WHERE supplier_id=$1', [id]),
        pool.query('SELECT COUNT(*) FROM quotes WHERE supplier_id=$1 AND status=$2', [id,'awarded']),
        pool.query('SELECT COALESCE(SUM(total_amount),0) as total FROM purchase_orders WHERE supplier_id=$1', [id]),
      ]);
      stats = {
        quotes: +quotes.rows[0].count,
        won: +won.rows[0].count,
        win_rate: quotes.rows[0].count > 0 ? Math.round((won.rows[0].count / quotes.rows[0].count) * 100) : 0,
        total_sales: sales.rows[0].total,
      };
    } else if (role === 'admin') {
      const [users, rfqs, comps, fin] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM users WHERE role!=$1', ['admin']),
        pool.query('SELECT COUNT(*) FROM rfqs'),
        pool.query('SELECT COUNT(*) FROM competitions'),
        pool.query('SELECT COUNT(*),COALESCE(SUM(requested_amount),0) as total FROM financing_requests'),
      ]);
      stats = {
        users: +users.rows[0].count,
        rfqs: +rfqs.rows[0].count,
        competitions: +comps.rows[0].count,
        financing_requests: +fin.rows[0].count,
        financing_volume: fin.rows[0].total,
      };
    }

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// NOTIFICATIONS
exports.getNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// ADMIN: users list
exports.adminUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,name,email,role,company_name,city,is_verified,is_approved,rating,total_orders,created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_approved=$1,updated_at=NOW() WHERE id=$2 RETURNING id,name,is_approved`,
      [req.body.approve, req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories WHERE is_active=true ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
