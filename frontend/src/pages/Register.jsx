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

  const roleOptions = [
    { r:'buyer',    l:'🛒 مشترٍ',    c:'#00F5FF' },
    { r:'supplier', l:'📦 مورد',      c:'#00E5A0' },
    { r:'investor', l:'💰 مستثمر',   c:'#FFB800' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-arabic"
      style={{ background:'#07080F', direction:'rtl' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ background:'#6C63FF' }}/>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ background:'#00F5FF' }}/>
      </div>

      <div className="w-full max-w-lg relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-bold mb-3"
            style={{ background:'linear-gradient(135deg, #6C63FF, #00F5FF)', color:'#07080F', boxShadow:'0 0 25px #6C63FF44' }}>⬡</div>
          <h1 className="text-2xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="text-sm mt-1" style={{ color:'#8892B0' }}>انضم إلى منصة FLOWRIZ</p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl"
          style={{ background:'#0E0F1E', border:'1px solid #6C63FF33', boxShadow:'0 0 40px #6C63FF15' }}>

          {/* Role selector */}
          <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background:'#13142A' }}>
            {roleOptions.map(({r,l,c})=>(
              <button key={r} type="button" onClick={()=>set('role',r)}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={form.role===r
                  ? { background:`linear-gradient(to left, ${c}, #6C63FF)`, color:'#fff', boxShadow:`0 0 12px ${c}55` }
                  : { color:'#8892B0' }
                }
                onMouseEnter={e=>{ if(form.role!==r) e.currentTarget.style.color='#E8EAF6'; }}
                onMouseLeave={e=>{ if(form.role!==r) e.currentTarget.style.color='#8892B0'; }}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-3">
            {[
              [['name','الاسم الكامل','الاسم...'],['company_name','اسم الشركة / المؤسسة','اسم الجهة...']],
            ].map((row,i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                {row.map(([k,lbl,ph]) => (
                  <div key={k}>
                    <label className="block text-xs mb-1.5 font-medium" style={{ color:'#8892B0' }}>{lbl}</label>
                    <input required className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#455A64] focus:outline-none transition-colors"
                      style={{ background:'#13142A', border:'1px solid #6C63FF33' }}
                      onFocus={e=>e.target.style.borderColor='#6C63FF'}
                      onBlur={e=>e.target.style.borderColor='#6C63FF33'}
                      placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                  </div>
                ))}
              </div>
            ))}

            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color:'#8892B0' }}>البريد الإلكتروني</label>
              <input required type="email"
                className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#455A64] focus:outline-none transition-colors"
                style={{ background:'#13142A', border:'1px solid #6C63FF33' }}
                onFocus={e=>e.target.style.borderColor='#6C63FF'}
                onBlur={e=>e.target.style.borderColor='#6C63FF33'}
                placeholder="email@company.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[['phone','رقم الجوال','+966 5X...'],['city','المدينة','الرياض...']].map(([k,lbl,ph])=>(
                <div key={k}>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color:'#8892B0' }}>{lbl}</label>
                  <input className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#455A64] focus:outline-none transition-colors"
                    style={{ background:'#13142A', border:'1px solid #6C63FF33' }}
                    onFocus={e=>e.target.style.borderColor='#6C63FF'}
                    onBlur={e=>e.target.style.borderColor='#6C63FF33'}
                    placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[['password','كلمة المرور','8 أحرف+'],['confirm','تأكيد كلمة المرور','••••••••']].map(([k,lbl,ph])=>(
                <div key={k}>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color:'#8892B0' }}>{lbl}</label>
                  <input required type="password"
                    className="w-full rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#455A64] focus:outline-none transition-colors"
                    style={{ background:'#13142A', border:'1px solid #6C63FF33' }}
                    onFocus={e=>e.target.style.borderColor='#6C63FF'}
                    onBlur={e=>e.target.style.borderColor='#6C63FF33'}
                    placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              style={{ background:'linear-gradient(to left, #6C63FF, #00F5FF)', boxShadow:'0 0 20px #6C63FF33' }}>
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color:'#8892B0' }}>
            لديك حساب؟{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color:'#6C63FF' }}>تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
