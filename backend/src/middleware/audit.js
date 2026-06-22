const pool = require('../config/db');

// تطبيع المسار: استبدال المعرّفات/الأرقام بـ :id لمطابقة القاموس
const norm = (p) => p.replace(/^\/api/, '').split('/')
  .map(s => (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(s) || /^\d+$/.test(s)) ? ':id' : s)
  .join('/');

const LABELS = {
  'POST /rfqs': 'أنشأ طلب شراء',
  'PUT /rfqs/:id': 'عدّل طلب شراء',
  'DELETE /rfqs/:id': 'حذف طلب شراء',
  'POST /rfqs/:id/award/:id': 'رسا طلب شراء',
  'POST /rfqs/:id/quotes': 'قدّم عرض سعر',
  'POST /invoices': 'أنشأ فاتورة',
  'POST /financing/request': 'طلب تمويل',
  'POST /financing/requests/:id/bid': 'قدّم عرض تمويل',
  'POST /financing/bids/:id/accept': 'قبِل عرض تمويل',
  'POST /financing/requests/:id/fund-by-platform': 'موّل عبر المنصة',
  'PUT /financing/auto-invest': 'حدّث الاستثمار التلقائي',
  'POST /installments/:id/pay': 'سجّل سداد قسط',
  'PUT /installments/:id/confirm': 'اعتمد سداد قسط',
  'POST /installments/settle/:id': 'قدّم سدادًا مبكرًا',
  'PUT /installments/settle/:id/confirm': 'اعتمد سدادًا مبكرًا',
  'POST /manufacturing/orders': 'أنشأ أمر تصنيع',
  'POST /manufacturing/orders/:id/offers': 'قدّم عرض تصنيع',
  'PUT /manufacturing/offers/:id/accept': 'قبِل عرض تصنيع',
  'PUT /manufacturing/orders/:id/match': 'أسند مصنعًا',
  'PUT /manufacturing/stages/:id/progress': 'حدّث مرحلة إنتاج',
  'PUT /manufacturing/stages/:id/qa': 'فحص جودة',
  'PUT /manufacturing/stages/:id/receive': 'أكّد استلام منتج',
  'POST /manufacturing/orders/:id/finance': 'طلب تمويل تصنيع',
  'POST /manufacturing/orders/:id/disputes': 'فتح نزاعًا',
  'PUT /manufacturing/disputes/:id/resolve': 'حسم نزاعًا',
  'POST /manufacturing/orders/:id/review': 'قيّم مصنعًا',
  'POST /secondary/listings': 'أدرج مركزًا للبيع',
  'POST /secondary/listings/:id/buy': 'اشترى مركزًا (سوق ثانوي)',
  'POST /competitions': 'أنشأ منافسة',
  'POST /competitions/:id/bid': 'قدّم عرضًا بمنافسة',
  'POST /account/members': 'أضاف مستخدمًا',
  'PUT /account/members/:id': 'حدّث صلاحيات مستخدم',
  'DELETE /account/members/:id': 'حذف مستخدمًا',
  'PUT /admin/users/:id/approve': 'راجع حساب مستخدم',
  'PUT /auth/profile': 'حدّث الملف الشخصي',
  'PUT /auth/documents': 'حدّث المستندات',
  'PUT /auth/change-password': 'غيّر كلمة المرور',
};

module.exports = function audit(req, res, next) {
  res.on('finish', () => {
    try {
      if (!req.user || res.statusCode >= 400) return;
      if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return;
      const path = (req.originalUrl || req.url).split('?')[0];
      const key = `${req.method} ${norm(path)}`;
      if (key.includes('/account/activity') || key.includes('/notifications')) return; // تجاهل الضجيج
      const action = LABELS[key] || `${req.method} ${norm(path)}`;
      pool.query(
        `INSERT INTO activity_log(account_id,actor_id,actor_name,actor_role,method,path,action) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [req.user.account_id, req.user.id, req.user.name, req.user.role, req.method, norm(path), action]
      ).catch(() => {});
    } catch (e) { /* best-effort */ }
  });
  next();
};
