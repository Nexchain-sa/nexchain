const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const genNumber = (prefix) => `${prefix}-${Date.now().toString().slice(-8)}`;

// GET /api/rfqs  (list with filters)
exports.list = async (req, res) => {
  try {
    const { status, category_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = ['1=1'];
    let params = [];
    let i = 1;

    if (status)      { where.push(`r.status=$${i++}`);      params.push(status); }
    if (category_id) { where.push(`r.category_id=$${i++}`); params.push(category_id); }
    if (search)      { where.push(`r.title ILIKE $${i++}`); params.push(`%${search}%`); }

    // buyers see only their own; suppliers see all open
    if (req.user.role === 'buyer') {
      where.push(`r.buyer_id=$${i++}`); params.push(req.user.id);
    } else if (req.user.role === 'supplier') {
      where.push(`r.status='open'`);
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM rfqs r WHERE ${where.join(' AND ')}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(`
      SELECT r.*, u.company_name as buyer_company, c.name_ar as category_name,
             (SELECT COUNT(*) FROM quotes q WHERE q.rfq_id=r.id) as quote_count
      FROM rfqs r
      JOIN users u ON r.buyer_id=u.id
      LEFT JOIN categories c ON r.category_id=c.id
      WHERE ${where.join(' AND ')}
      ORDER BY r.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `, params);

    res.json({ success: true, data: rows, total, page: +page, pages: Math.ceil(total/limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// GET /api/rfqs/:id
exports.get = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, u.company_name as buyer_company, u.phone as buyer_phone,
             c.name_ar as category_name
      FROM rfqs r
      JOIN users u ON r.buyer_id=u.id
      LEFT JOIN categories c ON r.category_id=c.id
      WHERE r.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// POST /api/rfqs
exports.create = async (req, res) => {
  try {
    const { title, description, category_id, quantity, unit, budget_min, budget_max, delivery_date, closing_date } = req.body;
    const rfq_number = genNumber('RFQ');
    const { rows } = await pool.query(`
      INSERT INTO rfqs(rfq_number,buyer_id,title,description,category_id,quantity,unit,budget_min,budget_max,delivery_date,closing_date)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [rfq_number, req.user.id, title, description, category_id, quantity, unit, budget_min, budget_max, delivery_date, closing_date]);

    // notify suppliers — demo: just return
    res.status(201).json({ success: true, data: rows[0], message: 'تم نشر الطلب بنجاح' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// PUT /api/rfqs/:id
exports.update = async (req, res) => {
  try {
    const { title, description, quantity, budget_min, budget_max, delivery_date, closing_date, status } = req.body;
    const { rows } = await pool.query(`
      UPDATE rfqs SET title=$1,description=$2,quantity=$3,budget_min=$4,budget_max=$5,
        delivery_date=$6,closing_date=$7,status=COALESCE($8,status),updated_at=NOW()
      WHERE id=$9 AND buyer_id=$10 RETURNING *
    `, [title, description, quantity, budget_min, budget_max, delivery_date, closing_date, status, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'الطلب غير موجود أو لا تملك صلاحية التعديل' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// DELETE /api/rfqs/:id
exports.remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM rfqs WHERE id=$1 AND buyer_id=$2 AND status='open'`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ success: false, message: 'لا يمكن حذف هذا الطلب' });
    res.json({ success: true, message: 'تم حذف الطلب' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// GET /api/rfqs/:id/quotes
exports.getQuotes = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.*, u.company_name as supplier_company, u.rating as supplier_rating
      FROM quotes q JOIN users u ON q.supplier_id=u.id
      WHERE q.rfq_id=$1 ORDER BY q.total_price ASC
    `, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// POST /api/rfqs/:id/award/:quote_id
exports.award = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: q } = await client.query('SELECT * FROM quotes WHERE id=$1 AND rfq_id=$2', [req.params.quote_id, req.params.id]);
    if (!q.length) return res.status(404).json({ success: false, message: 'العرض غير موجود' });

    await client.query(`UPDATE quotes SET status='awarded' WHERE id=$1`, [q[0].id]);
    await client.query(`UPDATE quotes SET status='rejected' WHERE rfq_id=$1 AND id!=$2`, [req.params.id, q[0].id]);
    await client.query(`UPDATE rfqs SET status='awarded' WHERE id=$1`, [req.params.id]);

    const po_number = genNumber('PO');
    const { rows: po } = await client.query(`
      INSERT INTO purchase_orders(po_number,rfq_id,quote_id,buyer_id,supplier_id,total_amount,delivery_date)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [po_number, req.params.id, q[0].id, req.user.id, q[0].supplier_id, q[0].total_price, null]);

    await client.query('COMMIT');
    res.json({ success: true, data: po[0], message: 'تم ترسية العطاء وإنشاء أمر الشراء' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  } finally { client.release(); }
};
