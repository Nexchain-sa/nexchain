// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`مرحباً ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-arabic"
      style={{ background: '#07080F', direction:'rtl' }}>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ background: '#6C63FF' }}/>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ background: '#00F5FF' }}/>
        <div className="absolute top-3/4 right-3/4 w-64 h-64 rounded-full opacity-5 blur-3xl"
          style={{ background: '#FF6BFF' }}/>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #6C63FF, #00F5FF)',
              color: '#07080F',
              boxShadow: '0 0 30px #6C63FF44',
            }}>⬡</div>
          <h1 className="text-3xl font-bold text-white">FLOWRIZ</h1>
          <p className="mt-1" style={{ color: '#8892B0' }}>منصة سلاسل الإمداد الذكية</p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: '#0E0F1E',
            border: '1px solid #6C63FF33',
            boxShadow: '0 0 40px #6C63FF15',
          }}>
          <h2 className="text-xl font-bold text-white mb-6">تسجيل الدخول</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#8892B0' }}>البريد الإلكتروني</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-[#455A64] focus:outline-none transition-colors"
                style={{
                  background: '#13142A',
                  border: '1px solid #6C63FF33',
                }}
                onFocus={e => e.target.style.borderColor='#6C63FF'}
                onBlur={e => e.target.style.borderColor='#6C63FF33'}
                placeholder="email@company.com"/>
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#8892B0' }}>كلمة المرور</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({...form, password:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
                style={{
                  background: '#13142A',
                  border: '1px solid #6C63FF33',
                }}
                onFocus={e => e.target.style.borderColor='#6C63FF'}
                onBlur={e => e.target.style.borderColor='#6C63FF33'}
                placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{
                background: 'linear-gradient(to left, #6C63FF, #00F5FF)',
                boxShadow: '0 0 20px #6C63FF33',
              }}>
              {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: '#13142A', border: '1px solid #6C63FF22' }}>
            <p className="text-xs mb-2 font-bold" style={{ color: '#8892B0' }}>حسابات تجريبية:</p>
            {[
              { label:'👑 مالك المنصة', email:'owner@FLOWRIZ.sa',   pass:'Owner@Flowriz2025',  color:'#FF6BFF' },
              { label:'🛡️ مدير النظام', email:'admin@FLOWRIZ.sa',   pass:'Admin@123456',       color:'#6C63FF' },
              { label:'🛒 مشترٍ',        email:'buyer@demo.com',     pass:'Buyer@123456',       color:'#00F5FF' },
              { label:'📦 مورد',          email:'supplier@demo.com',  pass:'Supplier@123456',    color:'#00E5A0' },
            ].map(a => (
              <button key={a.email} onClick={() => setForm({email:a.email, password:a.pass})}
                className="w-full text-right text-xs py-1.5 transition-colors hover:opacity-80"
                style={{ color: a.color }}>
                {a.label}: {a.email}
              </button>
            ))}
          </div>

          <p className="text-center text-sm mt-4" style={{ color: '#8892B0' }}>
            ليس لديك حساب؟{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: '#6C63FF' }}>سجّل الآن</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
