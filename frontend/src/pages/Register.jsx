import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:'', email:'', password:'', confirm:'',
    role:'buyer', company_name:'', phone:'', city:''
  });

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handle = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('كلمتا المرور غير متطابقتين');
    setLoading(true);
    try {
      await authAPI.register({
        name:form.name, email:form.email, password:form.password,
        role:form.role, company_name:form.company_name, phone:form.phone, city:form.city
      });
      toast.success('تم إنشاء الحساب! يرجى تسجيل الدخول');
      navigate('/login');
    } catch(err) {
      toast.error(err.response?.data?.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] transition-colors text-sm";
  const lbl = "block text-xs text-[#90A4AE] mb-1.5 font-medium";

  return (
    <div className="min-h-screen bg-[#0A0F2E] flex items-center justify-center p-4 font-arabic" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#00D4FF] opacity-5 blur-3xl"/>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-[#7B2FFF] opacity-5 blur-3xl"/>
      </div>
      <div className="w-full max-w-lg relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] text-2xl text-[#0A0F2E] font-bold shadow-lg mb-3">⬡</div>
          <h1 className="text-2xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="text-[#90A4AE] text-sm mt-1">انضم إلى منصة FLOWRIZ</p>
        </div>

        <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-6 shadow-2xl">
          {/* Role selector */}
          <div className="flex gap-2 mb-5 p-1 bg-[#0A0F2E] rounded-xl">
            {[['buyer','🛒 مشترٍ'],['supplier','📦 مورد'],['investor','💰 مستثمر']].map(([r,l])=>(
              <button key={r} type="button" onClick={()=>set('role',r)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  form.role===r
                    ? 'bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white shadow'
                    : 'text-[#90A4AE] hover:text-white'
                }`}>{l}</button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>الاسم الكامل</label>
                <input required className={inp} placeholder="الاسم..." value={form.name} onChange={e=>set('name',e.target.value)}/></div>
              <div><label className={lbl}>اسم الشركة / المؤسسة</label>
                <input required className={inp} placeholder="اسم الجهة..." value={form.company_name} onChange={e=>set('company_name',e.target.value)}/></div>
            </div>
            <div><label className={lbl}>البريد الإلكتروني</label>
              <input required type="email" className={inp} placeholder="email@company.com" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>رقم الجوال</label>
                <input className={inp} placeholder="+966 5X..." value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
              <div><label className={lbl}>المدينة</label>
                <input className={inp} placeholder="الرياض..." value={form.city} onChange={e=>set('city',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>كلمة المرور</label>
                <input required type="password" className={inp} placeholder="8 أحرف+" value={form.password} onChange={e=>set('password',e.target.value)}/></div>
              <div><label className={lbl}>تأكيد كلمة المرور</label>
                <input required type="password" className={inp} placeholder="••••••••" value={form.confirm} onChange={e=>set('confirm',e.target.value)}/></div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg mt-2">
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>
          <p className="text-center text-sm text-[#90A4AE] mt-4">
            لديك حساب؟ <Link to="/login" className="text-[#00D4FF] hover:underline font-bold">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
