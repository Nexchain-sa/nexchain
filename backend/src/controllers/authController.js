const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, company_name, phone, city } = req.body;

    if (!['buyer','supplier','investor'].includes(role))
      return res.status(400).json({ success: false, message: 'نوع الحساب غير صالح' });

    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length)
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجّل مسبقاً' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(`
      INSERT INTO users(name,email,password,role,company_name,phone,city)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING id,name,email,role,company_name,phone,city,is_verified,created_at
    `, [name, email, hash, role, company_name, phone, city]);

    const user  = rows[0];
    const token = makeToken(user.id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة' });

    const token = makeToken(user.id);
    const { password: _, ...safe } = user;
    res.json({ success: true, token, user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,name,email,role,company_name,phone,city,logo_url,rating,total_orders,is_verified,is_approved,created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, city, company_name } = req.body;
    const { rows } = await pool.query(`
      UPDATE users SET name=$1,phone=$2,city=$3,company_name=$4,updated_at=NOW()
      WHERE id=$5 RETURNING id,name,email,role,company_name,phone,city
    `, [name, phone, city, company_name, req.user.id]);
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const { rows } = await pool.query('SELECT password FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password);
    if (!valid) return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password=$1,updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};
