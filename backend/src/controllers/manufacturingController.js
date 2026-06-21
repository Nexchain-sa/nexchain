const pool = require('../config/db');

const genNum = (p) => `${p}-${Date.now().toString().slice(-8)}`;

// قالب مراحل الإنتاج مع نسبة الدفعة لكل مرحلة (المجموع 100%)

// محرّك التسعير الآلي (نماذج تكلفة معيارية)
const CATS = {
  apparel:     { base: 45,  lead: 14 },
  textile:     { base: 30,  lead: 18 },
  packaging:   { base: 8,   lead: 10 },
  promotional: { base: 20,  lead: 12 },
  furniture:   { base: 120, lead: 25 },
};
const COMPLEXITY = { simple: 1.0, medium: 1.35, complex: 1.8 };
function estimatePrice(category, complexity, quantity) {
  const c = CATS[category] || CATS.apparel;
  const cm = COMPLEXITY[complexity] || 1.0;
  const qty = Math.max(1, Number(quantity) || 1);
  const qd = qty >= 1000 ? 0.85 : qty >= 500 ? 0.92 : qty >= 100 ? 0.97 : 1.0;
  const unit = Math.round(c.base * cm * qd * 100) / 100;
  const total = Math.round(unit * qty);
  const lead = Math.round(c.lead * (cm > 1.5 ? 1.4 : cm > 1.2 ? 1.2 : 1));
  return { unit_cost: unit, total, lead_days: lead, qty_discount_pct: Math.round((1 - qd) * 100), complexity_mult: cm };
}

exports.estimate = (req, res) => {
  const { category, complexity, quantity } = req.body;
  res.json({ success: true, data: estimatePrice(category, complexity, quantity) });
};

exports.suggest = async (req, res) => {
  try {
    const { rows: ord } = await pool.query(`SELECT category, quantity FROM manufacturing_orders WHERE id=$1`, [req.params.id]);
    if (!ord.length) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const category = ord[0].category || 'apparel';
    const qty = Number(ord[0].quantity) || 0;
    const { rows: facs } = await pool.query(`
      SELECT id, company_name, name, rating,
             COALESCE(mfg_specialties,'[]'::jsonb) AS mfg_specialties,
             COALESCE(mfg_capacity,1000) AS mfg_capacity,
             COALESCE(mfg_lead_days,14) AS mfg_lead_days
      FROM users WHERE role='supplier' AND is_approved=true`);
    const scored = facs.map(f => {
      const spec = Array.isArray(f.mfg_specialties) ? f.mfg_specialties : [];
      const catMatch = spec.includes(category);
      const catScore = catMatch ? 40 : 12;
      const leadScore = Math.max(0, Math.round(30 * (1 - Math.min(Number(f.mfg_lead_days), 30) / 30)));
      const ratingScore = Math.round(20 * (Number(f.rating || 0) / 5));
      const capScore = Number(f.mfg_capacity) >= qty ? 10 : 0;
      const score = catScore + leadScore + ratingScore + capScore;
      const reasons = [
        catMatch ? 'تخصص مطابق' : 'تخصص جزئي',
        `مهلة ${f.mfg_lead_days} يوم`,
        `تقييم ${Number(f.rating || 0)}`,
        Number(f.mfg_capacity) >= qty ? 'سعة كافية' : 'سعة محدودة',
      ];
      return { id: f.id, name: f.company_name || f.name, score, lead_days: f.mfg_lead_days, rating: Number(f.rating || 0), capacity: f.mfg_capacity, reasons };
    }).sort((a, b) => b.score - a.score);
    res.json({ success: true, data: scored });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

const STAGE_TEMPLATE = [
  { name: 'تحضير المواد',           pct: 15 },
  { name: 'الإنتاج',                pct: 35 },
  { name: 'التجميع والتشطيب',       pct: 15 },
  { name: 'التغليف',                pct: 10 },
  { name: 'الشحن',                  pct: 10 },
  { name: 'التخليص الجمركي',        pct: 10 },
  { name: 'التسليم واستلام العميل', pct: 5  },
];

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { product, specs, quantity, total_amount, currency, category, complexity, factory_id } = req.body;
    const finalTotal = Number(total_amount) || estimatePrice(category, complexity, quantity).total;
    const num = genNum('MFG');
    const { rows } = await client.query(
      `INSERT INTO manufacturing_orders(order_number,customer_id,factory_id,product,specs,quantity,total_amount,currency,status,category,complexity,escrow_funded)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [num, req.user.id, factory_id || null, product, specs || null, quantity || null, finalTotal, currency || 'SAR', factory_id ? 'in_production' : 'pending_match', category || 'apparel', complexity || 'simple', finalTotal]
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
    const params = [req.user.id]; // $1 = current user (used by my_offer subquery)
    let where;
    if (['admin', 'owner'].includes(role)) where = '';
    else if (role === 'supplier') where = `WHERE (o.factory_id=$1 OR o.status='pending_match')`;
    else where = 'WHERE o.customer_id=$1';
    const { rows } = await pool.query(`
      SELECT o.*, c.company_name AS customer_name, f.company_name AS factory_name,
        (SELECT COUNT(*)::int FROM production_stages s WHERE s.order_id=o.id) AS stage_total,
        (SELECT COUNT(*)::int FROM production_stages s WHERE s.order_id=o.id AND s.status='passed') AS stage_done,
        (SELECT COUNT(*)::int FROM manufacturing_offers mo WHERE mo.order_id=o.id) AS offer_count,
        (SELECT row_to_json(x) FROM (SELECT offered_price, lead_days, status FROM manufacturing_offers WHERE order_id=o.id AND factory_id=$1) x) AS my_offer
      FROM manufacturing_orders o
      LEFT JOIN users c ON c.id=o.customer_id
      LEFT JOIN users f ON f.id=o.factory_id
      ${where}
      ORDER BY o.created_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

// ── سوق التصنيع: عروض المصانع ──────────────────────────────
exports.submitOffer = async (req, res) => {
  try {
    const { offered_price, lead_days, note } = req.body;
    if (!offered_price || Number(offered_price) <= 0) return res.status(400).json({ success: false, message: 'أدخل سعرًا صحيحًا' });
    const { rows: ord } = await pool.query(`SELECT status FROM manufacturing_orders WHERE id=$1`, [req.params.id]);
    if (!ord.length) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    if (ord[0].status !== 'pending_match') return res.status(400).json({ success: false, message: 'الطلب لم يعد مفتوحًا للعروض' });
    const { rows } = await pool.query(`
      INSERT INTO manufacturing_offers(order_id,factory_id,offered_price,lead_days,note)
      VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(order_id,factory_id) DO UPDATE SET offered_price=$3, lead_days=$4, note=$5, status='pending', created_at=NOW()
      RETURNING *`,
      [req.params.id, req.user.id, offered_price, lead_days || null, note || null]);
    res.status(201).json({ success: true, data: rows[0], message: 'تم إرسال العرض' });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.listOffers = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, f.company_name AS factory_name, f.name AS factory_person, COALESCE(f.rating,0) AS factory_rating
      FROM manufacturing_offers o JOIN users f ON f.id=o.factory_id
      WHERE o.order_id=$1 ORDER BY o.offered_price ASC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.acceptOffer = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: off } = await client.query(
      `SELECT o.*, m.customer_id, m.status AS order_status FROM manufacturing_offers o JOIN manufacturing_orders m ON m.id=o.order_id WHERE o.id=$1`,
      [req.params.id]);
    if (!off.length) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'العرض غير موجود' }); }
    const offer = off[0];
    const isAdmin = ['admin', 'owner'].includes(req.user.role);
    if (!isAdmin && offer.customer_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ success: false, message: 'ليس طلبك' }); }
    if (offer.order_status !== 'pending_match') { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'الطلب لم يعد مفتوحًا' }); }
    await client.query(
      `UPDATE manufacturing_orders SET factory_id=$1, status='in_production', total_amount=$2, escrow_funded=$2 WHERE id=$3`,
      [offer.factory_id, offer.offered_price, offer.order_id]);
    await client.query(`UPDATE manufacturing_offers SET status='accepted' WHERE id=$1`, [offer.id]);
    await client.query(`UPDATE manufacturing_offers SET status='rejected' WHERE order_id=$1 AND id<>$2`, [offer.order_id, offer.id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'تم قبول العرض وبدء التصنيع' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
  finally { client.release(); }
};

// ── تمويل أمر التصنيع (يُنشئ فاتورة + طلب تمويل) ──────────────
exports.financeOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: ord } = await client.query(`SELECT * FROM manufacturing_orders WHERE id=$1`, [req.params.id]);
    if (!ord.length) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'الطلب غير موجود' }); }
    const order = ord[0];
    const isAdmin = ['admin', 'owner'].includes(req.user.role);
    if (!isAdmin && order.customer_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ success: false, message: 'ليس طلبك' }); }
    if (!order.factory_id) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'عيّن مصنعًا أولاً' }); }
    if (order.financing_request_id) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'سبق تقديم طلب تمويل لهذا الأمر' }); }
    const amount = Number(order.total_amount) || 0;
    const { rows: inv } = await client.query(
      `INSERT INTO invoices(invoice_number,buyer_id,supplier_id,amount,due_date,status,notes)
       VALUES($1,$2,$3,$4, CURRENT_DATE + interval '90 days','financing_requested',$5) RETURNING *`,
      [genNum('INV'), order.customer_id, order.factory_id, amount, 'تمويل أمر تصنيع ' + order.order_number]);
    const { rows: fr } = await client.query(
      `INSERT INTO financing_requests(invoice_id,requester_id,requested_amount,financing_type) VALUES($1,$2,$3,'fund') RETURNING *`,
      [inv[0].id, order.customer_id, amount]);
    await client.query(`UPDATE manufacturing_orders SET invoice_id=$1, financing_request_id=$2 WHERE id=$3`, [inv[0].id, fr[0].id, order.id]);
    await client.query('COMMIT');
    res.json({ success: true, data: fr[0], message: 'تم تقديم طلب تمويل التصنيع — سيظهر للممولين' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
  finally { client.release(); }
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


exports.stageReceive = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: st } = await client.query(
      `SELECT s.*, o.customer_id, o.total_amount FROM production_stages s JOIN manufacturing_orders o ON o.id=s.order_id WHERE s.id=$1`, [req.params.id]);
    if (!st.length) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'المرحلة غير موجودة' }); }
    const stage = st[0];
    const isAdmin = ['admin','owner'].includes(req.user.role);
    if (!isAdmin && stage.customer_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ success: false, message: 'ليس طلبك' }); }
    if (stage.status !== 'qa_review') { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'المرحلة غير جاهزة للاستلام' }); }
    await client.query(`UPDATE production_stages SET status='passed', released=true, updated_at=NOW() WHERE id=$1`, [stage.id]);
    const releaseAmt = Math.round(Number(stage.total_amount) * Number(stage.payment_pct)) / 100;
    await client.query(`UPDATE manufacturing_orders SET released_amount=released_amount+$1 WHERE id=$2`, [releaseAmt, stage.order_id]);
    const { rows: rem } = await client.query(`SELECT COUNT(*)::int AS n FROM production_stages WHERE order_id=$1 AND status!='passed'`, [stage.order_id]);
    if (rem[0].n === 0) await client.query(`UPDATE manufacturing_orders SET status='completed' WHERE id=$1`, [stage.order_id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'تم تأكيد الاستلام والإفراج عن الدفعة الأخيرة' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
  finally { client.release(); }
};
