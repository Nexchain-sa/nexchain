import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t, dir, lang } = useLang();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success((lang==='ar'?'مرحباً ':'Welcome ') + user.name + '!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || t('خطأ في تسجيل الدخول'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-arabic" style={{ direction: dir }} dir={dir}>

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
            {t('منصة سلاسل الإمداد')}<br/>{t('الذكية')}
          </h2>
          <p className="text-slate-400 text-lg">
            {t('ربط المشترين والموردين والممولين في منصة واحدة متكاملة')}
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
              <p className="text-sm text-slate-400 mt-1">{t(s.label)}</p>
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

          <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('تسجيل الدخول')}</h2>
          <p className="text-slate-500 text-sm mb-8">{t('أدخل بياناتك للوصول إلى حسابك')}</p>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('البريد الإلكتروني')}</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400"
                placeholder="email@company.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('كلمة المرور')}</label>
              <input type="password" required value={form.password}
                onChange={e => setForm({...form, password:e.target.value})}
                className="w-full rounded-xl px-4 py-3 text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background:'#4F46E5' }}>
              {loading ? t('جارٍ الدخول...') : t('تسجيل الدخول')}
            </button>
          </form>

          <p className="text-center text-sm mt-4 text-slate-500">
            {t('ليس لديك حساب؟')}{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">{t('سجّل الآن')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
