const pool = require('../config/db');

// سجل الحركات المالية الموحّد — نموذج قراءة مشتق من مصادر الحقيقة (بلا ازدواج محاسبي)
exports.ledger = async (req, res) => {
  try {
    const uid = req.user.id;
    const tx = [];
    const push = (rows, dir, category, label) => rows.forEach(r =>
      tx.push({ date: r.at, dir, category, amount: Number(r.amount) || 0, label: label(r) }));

    const q = (sql) => pool.query(sql, [uid]).then(r => r.rows).catch(() => []);

    const [inv, ret, fund, paid, esc, rel, secOut, secIn] = await Promise.all([
      // 1) استثمارات قمت بها (خروج)
      q(`SELECT fb.offered_amount AS amount, fb.submitted_at AS at, i.invoice_number AS ref
         FROM financing_bids fb JOIN financing_requests fr ON fr.id=fb.financing_request_id JOIN invoices i ON i.id=fr.invoice_id
         WHERE fb.financier_id=$1 AND fb.status='accepted'`),
      // 2) عوائد أقساط مدفوعة على صفقات موّلتها (دخول)
      q(`SELECT inst.amount AS amount, inst.paid_at AS at, i.invoice_number AS ref
         FROM installments inst
         JOIN financing_requests fr ON fr.id=inst.financing_request_id
         JOIN financing_bids fb ON fb.financing_request_id=fr.id AND fb.status='accepted'
         JOIN invoices i ON i.id=fr.invoice_id
         WHERE fb.financier_id=$1 AND inst.status='paid'`),
      // 3) تمويل استلمته كطالب (دخول)
      q(`SELECT fb.offered_amount AS amount, fb.submitted_at AS at, i.invoice_number AS ref
         FROM financing_bids fb JOIN financing_requests fr ON fr.id=fb.financing_request_id JOIN invoices i ON i.id=fr.invoice_id
         WHERE fr.requester_id=$1 AND fb.status='accepted'`),
      // 4) أقساط سددتها (خروج)
      q(`SELECT inst.amount AS amount, inst.paid_at AS at, i.invoice_number AS ref
         FROM installments inst LEFT JOIN invoices i ON i.id=inst.invoice_id
         WHERE inst.payer_id=$1 AND inst.status='paid'`),
      // 5) ضمان تصنيع موّلته (خروج/محتجز)
      q(`SELECT escrow_funded AS amount, created_at AS at, order_number AS ref
         FROM manufacturing_orders WHERE customer_id=$1 AND escrow_funded>0`),
      // 6) إفراجات دفعات تصنيع استلمتها كمصنع (دخول)
      q(`SELECT ROUND(o.total_amount*ps.payment_pct/100,2) AS amount, ps.updated_at AS at, o.order_number AS ref, ps.name AS stage
         FROM production_stages ps JOIN manufacturing_orders o ON o.id=ps.order_id
         WHERE o.factory_id=$1 AND ps.released=true`),
      // 7) سوق ثانوي — شراء مراكز (خروج)
      q(`SELECT ask_price AS amount, sold_at AS at FROM secondary_listings WHERE buyer_id=$1 AND status='sold'`),
      // 7) سوق ثانوي — بيع مراكز (دخول)
      q(`SELECT ask_price AS amount, sold_at AS at FROM secondary_listings WHERE seller_id=$1 AND status='sold'`),
    ]);

    push(inv, 'out', 'investment', r => `استثمار · ${r.ref || ''}`);
    push(ret, 'in', 'return', r => `عائد قسط · ${r.ref || ''}`);
    push(fund, 'in', 'financing', r => `تمويل مستلم · ${r.ref || ''}`);
    push(paid, 'out', 'repayment', r => `سداد قسط${r.ref ? ' · ' + r.ref : ''}`);
    push(esc, 'out', 'escrow', r => `ضمان تصنيع · ${r.ref || ''}`);
    push(rel, 'in', 'release', r => `إفراج دفعة · ${r.ref || ''}${r.stage ? ' (' + r.stage + ')' : ''}`);
    push(secOut, 'out', 'secondary', () => 'شراء مركز (سوق ثانوي)');
    push(secIn, 'in', 'secondary', () => 'بيع مركز (سوق ثانوي)');

    tx.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const total_in = tx.filter(t => t.dir === 'in').reduce((a, t) => a + t.amount, 0);
    const total_out = tx.filter(t => t.dir === 'out').reduce((a, t) => a + t.amount, 0);
    const byCat = {};
    tx.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + (t.dir === 'in' ? t.amount : -t.amount); });

    res.json({ success: true, data: { transactions: tx, summary: { total_in, total_out, net: total_in - total_out, count: tx.length, by_category: byCat } } });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};
