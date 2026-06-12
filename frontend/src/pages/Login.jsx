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
    <div className="min-h-screen flex font-arabic" style={{ direction:'rtl' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background:'#1E1B4B' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background:'#4F46E5', color:'#FFFFFF' }}>⬡</div>
            <span className="font-bold text-2xl text-white tracking-widest">FLOWRIZ</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            منصة سلاسل الإمداد<br/>الذكية
          </h2>
          <p className="text-slate-400 text-lg">
            ربط المشترين والموردين والممولين في منصة واحدة متكاملة
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:'مشترٍ نشط', value:'500+' },
            { label:'مورد معتمد', value:'1,200+' },
            { label:'طلب شراء', value:'8,000+' },
            { label:'قيمة المعاملات', value:'SAR 2B+' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background:'#312E81' }}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background:'#4F46E5', color:'#FFFFFF' }}>⬡</div>
            <span className="font-bold text-2xl text-slate-800 tracking-widest">FLOWRIZ</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">تسجيل الدخول</h2>
          <p className="text-slate-500 text-sm mb-8">أدخل بياناتك للوصول إلى حسابك</p>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">البريد الإلكتروني</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400"
                placeholder="email@company.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">كلمة المرور</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({...form, password:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background:'#4F46E5' }}>
              {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-xs font-bold text-slate-500 mb-3">حسابات تجريبية:</p>
            <div className="space-y-1">
              {[
                { label:'مالك المنصة', email:'owner@FLOWRIZ.sa',  pass:'Owner@Flowriz2025', color:'#BE123C', bg:'#FFF1F2' },
                { label:'مدير النظام', email:'admin@FLOWRIZ.sa',  pass:'Admin@123456',      color:'#7C3AED', bg:'#F5F3FF' },
                { label:'مشترٍ',       email:'buyer@demo.com',    pass:'Buyer@123456',      color:'#4F46E5', bg:'#EFF6FF' },
                { label:'مورد',        email:'supplier@demo.com', pass:'Supplier@123456',   color:'#059669', bg:'#ECFDF5' },
              ].map(a => (
                <button key={a.email} onClick={() => setForm({email:a.email, password:a.pass})}
                  className="w-full text-right text-xs py-2 px-3 rounded-lg transition-colors flex items-center gap-2 hover:opacity-80"
                  style={{ background: a.bg, color: a.color }}>
                  <span className="font-bold">{a.label}:</span>
                  <span>{a.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm mt-4 text-slate-500">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">سجّل الآن</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
