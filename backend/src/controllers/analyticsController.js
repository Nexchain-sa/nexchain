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
