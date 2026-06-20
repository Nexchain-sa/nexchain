const pool = require('../config/db');

const genNum = (p) => `${p}-${Date.now().toString().slice(-8)}`;

// قالب مراحل الإنتاج مع نسبة الدفعة لكل مرحلة (المجموع 100%)
const STAGE_TEMPLATE = [
  { name: 'تحضير المواد',        pct: 15 },
  { name: 'الإنتاج',             pct: 40 },
  { name: 'التجميع والتشطيب',    pct: 20 },
  { name: 'التغليف',             pct: 10 },
  { name: 'الشحن',               pct: 10 },
  { name: 'التسليم',             pct: 5  },
];

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { product, specs, quantity, total_amount, currency } = req.body;
    const num = genNum('MFG');
    const { rows } = await client.query(
      `INSERT INTO manufacturing_orders(order_number,customer_id,product,specs,quantity,total_amount,currency,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,'pending_match') RETURNING *`,
      [num, req.user.id, product, specs || null, quantity || null, Number(total_amount) || 0, currency || 'SAR']
    );
    const order = rows[0];
    let seq = 1;
    for (const st of STAGE_TEMPLATE) {
      await client.query(
        `INSERT INTO production_stages(order_id,seq,name,payment_pct,status) VALUES($1,$2,$3,$4,'pending')`,
        [order.id, seq++, st.name, st.pct]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: order });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
  finally { client.release(); }
};

exports.listOrders = async (req, res) => {
  try {
    const role = req.user.role;
    let where, params;
    if (['admin', 'owner'].includes(role)) { where = ''; params = []; }
    else if (role === 'supplier') { where = 'WHERE o.factory_id=$1'; params = [req.user.id]; }
    else { where = 'WHERE o.customer_id=$1'; params = [req.user.id]; }
    const { rows } = await pool.query(`
      SELECT o.*, c.company_name AS customer_name, f.company_name AS factory_name,
        (SELECT COUNT(*)::int FROM production_stages s WHERE s.order_id=o.id) AS stage_total,
        (SELECT COUNT(*)::int FROM production_stages s WHERE s.order_id=o.id AND s.status='passed') AS stage_done
      FROM manufacturing_orders o
      LEFT JOIN users c ON c.id=o.customer_id
      LEFT JOIN users f ON f.id=o.factory_id
      ${where}
      ORDER BY o.created_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.getStages = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM production_stages WHERE order_id=$1 ORDER BY seq ASC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.matchFactory = async (req, res) => {
  try {
    const { factory_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE manufacturing_orders SET factory_id=$1, status='in_production' WHERE id=$2 RETURNING *`,
      [factory_id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: rows[0], message: 'تم إسناد المصنع' });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.stageProgress = async (req, res) => {
  try {
    const { status } = req.body; // 'in_progress' | 'qa_review'
    if (!['in_progress', 'qa_review'].includes(status)) return res.status(400).json({ success: false, message: 'حالة غير صالحة' });
    const { rows } = await pool.query(
      `UPDATE production_stages SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'المرحلة غير موجودة' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.stageQA = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { pass, note } = req.body;
    const { rows: st } = await client.query(`SELECT * FROM production_stages WHERE id=$1`, [req.params.id]);
    if (!st.length) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'المرحلة غير موجودة' }); }
    const stage = st[0];
    if (pass) {
      await client.query(`UPDATE production_stages SET status='passed', released=true, qa_note=$1, updated_at=NOW() WHERE id=$2`, [note || null, stage.id]);
      const { rows: ord } = await client.query(`SELECT total_amount FROM manufacturing_orders WHERE id=$1`, [stage.order_id]);
      const releaseAmt = Math.round(Number(ord[0].total_amount) * Number(stage.payment_pct)) / 100;
      await client.query(`UPDATE manufacturing_orders SET released_amount=released_amount+$1 WHERE id=$2`, [releaseAmt, stage.order_id]);
      const { rows: rem } = await client.query(`SELECT COUNT(*)::int AS n FROM production_stages WHERE order_id=$1 AND status!='passed'`, [stage.order_id]);
      if (rem[0].n === 0) await client.query(`UPDATE manufacturing_orders SET status='completed' WHERE id=$1`, [stage.order_id]);
    } else {
      await client.query(`UPDATE production_stages SET status='failed', released=false, qa_note=$1, updated_at=NOW() WHERE id=$2`, [note || null, stage.id]);
    }
    await client.query('COMMIT');
    res.json({ success: true, message: pass ? 'تم اعتماد الجودة والإفراج عن الدفعة' : 'تم رفض الجودة' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
  finally { client.release(); }
};

exports.listFactories = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, company_name, name FROM users WHERE role='supplier' AND is_approved=true ORDER BY company_name`);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};
