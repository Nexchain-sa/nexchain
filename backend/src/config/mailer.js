const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

// إرسال بريد (best-effort) — لا يفشل الطلب إن لم يُضبط SMTP
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) { console.log('SMTP not configured — skipping email to', to); return false; }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await t.sendMail({ from: `FLOWRIZ <${from}>`, to, subject, html });
  return true;
}

module.exports = { sendMail };
