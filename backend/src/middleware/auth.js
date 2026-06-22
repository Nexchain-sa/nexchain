const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'غير مصرح — يرجى تسجيل الدخول' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      `SELECT id, name, email, role, company_name, is_approved, parent_id,
              COALESCE(permissions,'[]'::jsonb) AS permissions, COALESCE(is_active,true) AS is_active
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });

    req.user = rows[0];
    if (req.user.is_active === false)
      return res.status(403).json({ success: false, message: 'الحساب موقوف — تواصل مع مدير حسابك' });

    // الحساب الفعّال: الأعضاء الفرعيون يعملون تحت الحساب الرئيسي (parent)
    req.user.account_id = req.user.parent_id || req.user.id;
    req.user.is_primary = !req.user.parent_id;

    // الدور الفعّال — يتيح للحساب الواحد العمل بعدة أدوار (مشترٍ/بائع/ممول)
    req.user.baseRole = rows[0].role;
    const activeRole = req.headers['x-active-role'];
    const OPERATIONAL = ['buyer', 'supplier', 'investor'];
    const allowed = (rows[0].role === 'admin' || rows[0].role === 'owner')
      ? [...OPERATIONAL, 'admin', 'owner']
      : OPERATIONAL;
    if (activeRole && allowed.includes(activeRole)) req.user.role = activeRole;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'جلسة منتهية — يرجى إعادة تسجيل الدخول' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'لا تملك صلاحية هذا الإجراء' });
  next();
};

// تحقّق صلاحية لعضو الحساب — الحساب الرئيسي يملك كل الصلاحيات تلقائيًّا
const requirePermission = (perm) => (req, res, next) => {
  if (req.user.is_primary) return next();
  const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
  if (perms.includes(perm)) return next();
  return res.status(403).json({ success: false, message: 'ليست لديك صلاحية لهذا الإجراء' });
};

module.exports = { auth, requireRole, requirePermission };
