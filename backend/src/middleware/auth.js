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
      'SELECT id, name, email, role, company_name, is_approved FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });

    req.user = rows[0];

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

module.exports = { auth, requireRole };
