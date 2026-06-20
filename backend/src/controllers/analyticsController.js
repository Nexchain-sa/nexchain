const pool = require('../config/db');

exports.impact = async (req, res) => {
  try {
    const q = (sql, params = []) => pool.query(sql, params).then(r => r.rows);
    const [inv]  = await q(`SELECT COALESCE(SUM(amount),0)::float AS v, COUNT(*)::int AS n FROM invoices`);
    const [mfg]  = await q(`SELECT COALESCE(SUM(total_amount),0)::float AS v, COALESCE(SUM(released_amount),0)::float AS rel, COUNT(*)::int AS n FROM manufacturing_orders`);
    const [fund] = await q(`SELECT COALESCE(SUM(requested_amount),0)::float AS v, COUNT(*)::int AS n, COUNT(DISTINCT requester_id)::int AS smes FROM financing_requests WHERE status='funded'`);
    const [shar] = await q(`SELECT COUNT(*)::int AS n FROM financing_requests WHERE status='funded' AND financing_mode='shariah'`);
    const [sup]  = await q(`SELECT COUNT(*)::int AS n FROM users WHERE role='supplier' AND is_approved=true`);
    const [fac]  = await q(`SELECT COUNT(DISTINCT factory_id)::int AS n FROM manufacturing_orders WHERE factory_id IS NOT NULL`);
    const [inst] = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='paid')::int AS paid FROM installments`);
    const [stg]  = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='passed')::int AS passed FROM production_stages`);
    const [usr]  = await q(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE role='buyer')::int AS buyers, COUNT(*) FILTER (WHERE role='supplier')::int AS suppliers FROM users`);
    const monthly = await q(`
      SELECT to_char(date_trunc('month', created_at),'Mon') AS m, COALESCE(SUM(amount),0)::float AS v
      FROM invoices WHERE created_at > NOW() - INTERVAL '7 months'
      GROUP BY date_trunc('month', created_at) ORDER BY date_trunc('month', created_at)`);

    const gmv = inv.v + mfg.v;
    const repayment_rate = inst.total ? Math.round(inst.paid * 100 / inst.total) : 0;
    const qa_pass_rate   = stg.total  ? Math.round(stg.passed * 100 / stg.total) : 0;
    const shariah_pct    = fund.n     ? Math.round(shar.n * 100 / fund.n) : 0;
    const jobs_supported = fund.smes * 8 + fac.n * 25;

    res.json({ success: true, data: {
      gmv, invoices_value: inv.v, financed_total: fund.v, active_financings: fund.n, smes_financed: fund.smes,
      suppliers_enabled: sup.n, factories_active: fac.n, jobs_supported,
      installments_total: inst.total, installments_paid: inst.paid, repayment_rate,
      mfg_orders: mfg.n, mfg_value: mfg.v, mfg_released: mfg.rel, qa_pass_rate,
      shariah_pct, users_total: usr.total, buyers: usr.buyers, suppliers: usr.suppliers,
      monthly,
    }});
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};


exports.portfolio = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT fb.id, fb.offered_amount, fb.monthly_rate, fb.duration_days, fb.financier_type,
             fr.id AS request_id, fr.status AS req_status, fr.financing_mode,
             i.invoice_number, u.company_name AS buyer_name,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.financing_request_id=fr.id) AS inst_total,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.financing_request_id=fr.id AND inst.status='paid') AS inst_paid,
             (SELECT COALESCE(SUM(amount),0)::float FROM installments inst WHERE inst.financing_request_id=fr.id) AS inst_amount_total,
             (SELECT COALESCE(SUM(amount),0)::float FROM installments inst WHERE inst.financing_request_id=fr.id AND inst.status='paid') AS inst_amount_paid
      FROM financing_bids fb
      JOIN financing_requests fr ON fr.id=fb.financing_request_id
      JOIN invoices i ON i.id=fr.invoice_id
      JOIN users u ON u.id=fr.requester_id
      WHERE fb.financier_id=$1 AND fb.status='accepted'
      ORDER BY fb.submitted_at DESC
    `, [req.user.id]);
    const positions = rows.map(p => {
      const invested = Number(p.offered_amount) || 0;
      const rate = Number(p.monthly_rate) || 0;
      const months = Math.max(1, Math.round((Number(p.duration_days) || 90) / 30));
      const expected_profit = Math.round(invested * (rate / 100) * months);
      const expected_return = invested + expected_profit;
      const realized = Number(p.inst_amount_paid) || 0;
      const outstanding = Math.max(0, (Number(p.inst_amount_total) || expected_return) - realized);
      return { ...p, invested, rate, months, expected_profit, expected_return, realized, outstanding };
    });
    const sum = (k) => positions.reduce((a, p) => a + (p[k] || 0), 0);
    const invested = sum('invested'), expected_profit = sum('expected_profit'), realized = sum('realized'), outstanding = sum('outstanding');
    const wMonths = invested ? positions.reduce((a, p) => a + p.invested * p.months, 0) / invested : 1;
    const period_yield = invested ? expected_profit / invested * 100 : 0;
    const annual_yield = wMonths ? Math.round(period_yield * 12 / wMonths * 10) / 10 : 0;
    res.json({ success: true, data: {
      positions,
      summary: { invested, expected_profit, expected_return: invested + expected_profit, realized, outstanding, annual_yield, active: positions.length },
    }});
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};
