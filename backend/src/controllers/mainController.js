


exports.listDeals = async (req, res) => {
  try {
    const isAdmin = ['admin','owner'].includes(req.user.role);
    const where  = isAdmin ? '' : 'WHERE (i.buyer_id=$1 OR i.supplier_id=$1)';
    const params = isAdmin ? [] : [req.user.id];
    const { rows } = await pool.query(`
      SELECT i.id, i.invoice_number, i.amount, i.status, i.due_date, i.created_at,
             b.company_name AS buyer_name, s.company_name AS supplier_name,
             (SELECT fr.status FROM financing_requests fr WHERE fr.invoice_id=i.id ORDER BY fr.created_at DESC LIMIT 1) AS financing_status,
             (SELECT fr.financing_type FROM financing_requests fr WHERE fr.invoice_id=i.id ORDER BY fr.created_at DESC LIMIT 1) AS financing_type,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.invoice_id=i.id) AS inst_total,
             (SELECT COUNT(*)::int FROM installments inst WHERE inst.invoice_id=i.id AND inst.status='paid') AS inst_paid
      FROM invoices i
      LEFT JOIN users b ON b.id=i.buyer_id
      LEFT JOIN users s ON s.id=i.supplier_id
      ${where}
      ORDER BY i.created_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success:false, message:'خطأ في الخادم' }); }
};
