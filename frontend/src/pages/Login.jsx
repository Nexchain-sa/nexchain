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
    <div className="min-h-screen bg-[#0A0F2E] flex items-center justify-center p-4 font-arabic" dir="rtl">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#00D4FF] opacity-5 blur-3xl"/>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-[#7B2FFF] opacity-5 blur-3xl"/>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] text-3xl text-[#0A0F2E] font-bold shadow-lg shadow-cyan-500/30 mb-4">⬡</div>
          <h1 className="text-3xl font-bold text-white">NexChain</h1>
          <p className="text-[#90A4AE] mt-1">منصة سلاسل الإمداد الذكية</p>
        </div>

        <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">تسجيل الدخول</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-sm text-[#90A4AE] mb-1.5">البريد الإلكتروني</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                className="w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-3 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] transition-colors"
                placeholder="email@company.com"/>
            </div>
            <div>
              <label className="block text-sm text-[#90A4AE] mb-1.5">كلمة المرور</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({...form, password:e.target.value})}
                className="w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00D4FF] transition-colors"
                placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-cyan-500/20">
              {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 rounded-xl bg-[#0A0F2E] border border-[#00D4FF11]">
            <p className="text-xs text-[#90A4AE] mb-2 font-bold">حسابات تجريبية:</p>
            {[
              {label:'مدير',   email:'admin@nexchain.sa',  pass:'Admin@123456'},
              {label:'مشترٍ',  email:'buyer@demo.com',     pass:'Buyer@123456'},
              {label:'مورد',   email:'supplier@demo.com',  pass:'Supplier@123456'},
            ].map(a => (
              <button key={a.email} onClick={() => setForm({email:a.email,password:a.pass})}
                className="w-full text-right text-xs text-[#00D4FF] hover:text-white py-1 transition-colors">
                {a.label}: {a.email}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-[#90A4AE] mt-4">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-[#00D4FF] hover:underline font-bold">سجّل الآن</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
