const pool = require('../config/db');

exports.createListing = async (req, res) => {
  try {
    const { bid_id, ask_price } = req.body;
    const { rows: bid } = await pool.query(`SELECT * FROM financing_bids WHERE id=$1 AND financier_id=$2 AND status='accepted'`, [bid_id, req.user.id]);
    if (!bid.length) return res.status(400).json({ success: false, message: 'لا تملك هذا المركز أو غير قابل للبيع' });
    const { rows: existing } = await pool.query(`SELECT id FROM secondary_listings WHERE bid_id=$1 AND status='open'`, [bid_id]);
    if (existing.length) return res.status(409).json({ success: false, message: 'هذا المركز معروض بالفعل' });
    const { rows } = await pool.query(
      `INSERT INTO secondary_listings(bid_id,seller_id,ask_price,status) VALUES($1,$2,$3,'open') RETURNING *`,
      [bid_id, req.user.id, Number(ask_price) || 0]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'تم إدراج المركز للبيع' });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.listListings = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT sl.id, sl.ask_price, sl.seller_id, su.company_name AS seller_name,
             fb.offered_amount, fb.monthly_rate, fb.duration_days,
             fr.financing_mode, i.invoice_number, bu.company_name AS buyer_name,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.financing_request_id=fr.id) AS inst_total,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.financing_request_id=fr.id AND inst.status='paid') AS inst_paid,
             (SELECT COALESCE(SUM(amount),0)::float FROM installments inst WHERE inst.financing_request_id=fr.id AND inst.status!='paid') AS outstanding
      FROM secondary_listings sl
      JOIN financing_bids fb ON fb.id=sl.bid_id
      JOIN financing_requests fr ON fr.id=fb.financing_request_id
      JOIN invoices i ON i.id=fr.invoice_id
      JOIN users bu ON bu.id=fr.requester_id
      JOIN users su ON su.id=sl.seller_id
      WHERE sl.status='open'
      ORDER BY sl.created_at DESC
    `);
    const me = req.user.id;
    res.json({ success: true, data: rows.map(r => ({ ...r, is_own: r.seller_id === me })) });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.buyListing = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: l } = await client.query(`SELECT * FROM secondary_listings WHERE id=$1 AND status='open'`, [req.params.id]);
    if (!l.length) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'العرض غير متاح' }); }
    const listing = l[0];
    if (listing.seller_id === req.user.id) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, message: 'لا يمكنك شراء مركزك' }); }
    await client.query(`UPDATE financing_bids SET financier_id=$1 WHERE id=$2`, [req.user.id, listing.bid_id]);
    await client.query(`UPDATE secondary_listings SET status='sold', buyer_id=$1, sold_at=NOW() WHERE id=$2`, [req.user.id, listing.id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'تم شراء المركز وانتقاله إلى محفظتك' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
  finally { client.release(); }
};

exports.myPositions = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT fb.id AS bid_id, fb.offered_amount, fb.monthly_rate, fb.duration_days,
             i.invoice_number, bu.company_name AS buyer_name,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.financing_request_id=fr.id) AS inst_total,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.financing_request_id=fr.id AND inst.status='paid') AS inst_paid,
             (SELECT COALESCE(SUM(amount),0)::float FROM installments inst WHERE inst.financing_request_id=fr.id AND inst.status!='paid') AS outstanding,
             (SELECT sl.id FROM secondary_listings sl WHERE sl.bid_id=fb.id AND sl.status='open' LIMIT 1) AS listed
      FROM financing_bids fb
      JOIN financing_requests fr ON fr.id=fb.financing_request_id
      JOIN invoices i ON i.id=fr.invoice_id
      JOIN users bu ON bu.id=fr.requester_id
      WHERE fb.financier_id=$1 AND fb.status='accepted'
      ORDER BY fb.submitted_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};
