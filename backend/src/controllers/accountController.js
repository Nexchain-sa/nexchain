const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const ALL_PERMS = [
  'manage_users', 'rfqs', 'invoices', 'financing', 'manufacturing', 'installments',
  'qa', 'disputes', 'approve_payments', 'review_accounts', 'invest',
];
const cleanPerms = (p) => (Array.isArray(p) ? p.filter(x => ALL_PERMS.includes(x)) : []);

// أعضاء حسابي (المستخدمون الفرعيون تحت الحساب الرئيسي)
exports.listMembers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, COALESCE(permissions,'[]'::jsonb) AS permissions,
              COALESCE(is_active,true) AS is_active, created_at
       FROM users WHERE parent_id=$1 ORDER BY created_at DESC`, [req.user.account_id]);
    res.json({ success: true, data: rows, all_permissions: ALL_PERMS });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.addMember = async (req, res) => {
  try {
    if (!req.user.is_primary) return res.status(403).json({ success: false, message: 'إضافة المستخدمين متاحة لصاحب الحساب الرئيسي فقط' });
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'الاسم والبريد وكلمة المرور مطلوبة' });
    if (String(password).length < 6) return res.status(400).json({ success: false, message: 'كلمة المرور 6 أحرف على الأقل' });
    const mail = String(email).toLowerCase().trim();
    const { rows: ex } = await pool.query('SELECT id FROM users WHERE email=$1', [mail]);
    if (ex.length) return res.status(409).json({ success: false, message: 'البريد مستخدم بالفعل' });
    const hash = await bcrypt.hash(password, 12);
    const perms = cleanPerms(req.body.permissions);
    const { rows } = await pool.query(
      `INSERT INTO users(name,email,password,role,company_name,parent_id,permissions,is_verified,is_approved,is_active,review_status)
       VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,true,$8,true,'approved')
       RETURNING id,name,email,role,permissions,is_active,created_at`,
      [name, mail, hash, req.user.baseRole, req.user.company_name, req.user.id, JSON.stringify(perms), req.user.is_approved]);
    res.status(201).json({ success: true, data: rows[0], message: 'تمت إضافة المستخدم' });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.updateMember = async (req, res) => {
  try {
    if (!req.user.is_primary) return res.status(403).json({ success: false, message: 'غير مصرّح' });
    const sets = []; const vals = []; let i = 1;
    if (req.body.permissions !== undefined) { sets.push(`permissions=$${i++}::jsonb`); vals.push(JSON.stringify(cleanPerms(req.body.permissions))); }
    if (req.body.is_active !== undefined) { sets.push(`is_active=$${i++}`); vals.push(!!req.body.is_active); }
    if (!sets.length) return res.status(400).json({ success: false, message: 'لا تغييرات' });
    const idParam = i++; const parentParam = i++;
    vals.push(req.params.id, req.user.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idParam} AND parent_id=$${parentParam}
       RETURNING id,name,email,permissions,is_active`, vals);
    if (!rows.length) return res.status(404).json({ success: false, message: 'العضو غير موجود ضمن حسابك' });
    res.json({ success: true, data: rows[0], message: 'تم تحديث الصلاحيات' });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};

exports.removeMember = async (req, res) => {
  try {
    if (!req.user.is_primary) return res.status(403).json({ success: false, message: 'غير مصرّح' });
    const { rows } = await pool.query('DELETE FROM users WHERE id=$1 AND parent_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'العضو غير موجود ضمن حسابك' });
    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch (err) { res.status(500).json({ success: false, message: 'خطأ في الخادم' }); }
};
