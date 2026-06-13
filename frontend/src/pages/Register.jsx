import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { uploadToCloudinary } from '../config/cloudinary';
import { Upload, FileText, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const REQUIRED_DOCS = [
  { key:'cr',         label:'السجل التجاري' },
  { key:'articles',   label:'عقد التأسيس' },
  { key:'owner_id',   label:'هوية الملاك' },
  { key:'financials', label:'آخر قوائم مالية معتمدة' },
  { key:'profile',    label:'الملف التعريفي للشركة' },
  { key:'vat',        label:'شهادة ضريبة القيمة المضافة' },
  { key:'zakat',      label:'شهادة الزكاة' },
  { key:'bank',       label:'كشف الحساب البنكي' },
];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [docs, setDocs] = useState({});
  const [form, setForm] = useState({
    name:'', email:'', password:'', confirm:'',
    role:'buyer', company_name:'', phone:'', city:''
  });

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const uploadDoc = async (key, file) => {
    setUploadingKey(key);
    try {
      const up = await uploadToCloudinary(file);
      setDocs(prev => ({ ...prev, [key]: up }));
      toast.success('تم رفع المستند');
    } catch (e) { toast.error(e.message || 'فشل الرفع'); }
    finally { setUploadingKey(null); }
  };
  const removeDoc = (key) => setDocs(prev => { const n = {...prev}; delete n[key]; return n; });

  const handle = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('كلمتا المرور غير متطابقتين');
    const missing = REQUIRED_DOCS.filter(d => !docs[d.key]);
    if (missing.length) return toast.error('يجب رفع جميع المستندات المطلوبة: ' + missing.map(m=>m.label).join('، '));
    setLoading(true);
    try {
      await authAPI.register({
        name:form.name, email:form.email, password:form.password,
        role:form.role, company_name:form.company_name, phone:form.phone, city:form.city,
        documents: REQUIRED_DOCS.map(d => ({ key:d.key, label:d.label, url:docs[d.key].url, name:docs[d.key].name }))
      });
      toast.success('تم إنشاء الحساب! حسابك قيد المراجعة من الإدارة');
      navigate('/login');
    } catch(err) {
      toast.error(err.response?.data?.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  const roleOptions = [
    { r:'buyer',    l:'🛒 مشترٍ',    c:'#4F46E5' },
    { r:'supplier', l:'📦 مورد',      c:'#059669' },
    { r:'investor', l:'💰 مستثمر',   c:'#D97706' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-arabic"
      style={{ background:'#F4F6FB', direction:'rtl' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ background:'#4F46E5' }}/>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ background:'#4F46E5' }}/>
      </div>

      <div className="w-full max-w-lg relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-bold mb-3"
            style={{ background:'linear-gradient(135deg, #4F46E5, #4F46E5)', color:'#FFFFFF', boxShadow:'0 0 25px #EEF2FF' }}>⬡</div>
          <h1 className="text-2xl font-bold text-slate-800">إنشاء حساب جديد</h1>
          <p className="text-sm mt-1" style={{ color:'#8892B0' }}>انضم إلى منصة FLOWRIZ</p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl"
          style={{ background:'#FFFFFF', border:'1px solid #EEF2FF', boxShadow:'0 0 40px #EEF2FF' }}>

          {/* Role selector */}
          <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background:'#EEF2FF' }}>
            {roleOptions.map(({r,l,c})=>(
              <button key={r} type="button" onClick={()=>set('role',r)}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={form.role===r
                  ? { background:`linear-gradient(to left, ${c}, #4F46E5)`, color:'#fff', boxShadow:`0 0 12px ${c}55` }
                  : { color:'#8892B0' }
                }
                onMouseEnter={e=>{ if(form.role!==r) e.currentTarget.style.color='#4F46E5'; }}
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
                    <input required className="w-full rounded-xl px-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none transition-colors"
                      style={{ background:'#FFFFFF', border:'1px solid #EEF2FF' }}
                      onFocus={e=>e.target.style.borderColor='#4F46E5'}
                      onBlur={e=>e.target.style.borderColor='#EEF2FF'}
                      placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                  </div>
                ))}
              </div>
            ))}

            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color:'#8892B0' }}>البريد الإلكتروني</label>
              <input required type="email"
                className="w-full rounded-xl px-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none transition-colors"
                style={{ background:'#FFFFFF', border:'1px solid #EEF2FF' }}
                onFocus={e=>e.target.style.borderColor='#4F46E5'}
                onBlur={e=>e.target.style.borderColor='#EEF2FF'}
                placeholder="email@company.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[['phone','رقم الجوال','+966 5X...'],['city','المدينة','الرياض...']].map(([k,lbl,ph])=>(
                <div key={k}>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color:'#8892B0' }}>{lbl}</label>
                  <input className="w-full rounded-xl px-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none transition-colors"
                    style={{ background:'#FFFFFF', border:'1px solid #EEF2FF' }}
                    onFocus={e=>e.target.style.borderColor='#4F46E5'}
                    onBlur={e=>e.target.style.borderColor='#EEF2FF'}
                    placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[['password','كلمة المرور','8 أحرف+'],['confirm','تأكيد كلمة المرور','••••••••']].map(([k,lbl,ph])=>(
                <div key={k}>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color:'#8892B0' }}>{lbl}</label>
                  <input required type="password"
                    className="w-full rounded-xl px-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none transition-colors"
                    style={{ background:'#FFFFFF', border:'1px solid #EEF2FF' }}
                    onFocus={e=>e.target.style.borderColor='#4F46E5'}
                    onBlur={e=>e.target.style.borderColor='#EEF2FF'}
                    placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium" style={{ color:'#8892B0' }}>المستندات الرسمية المطلوبة (إلزامية)</label>
                <span className="text-xs font-bold" style={{ color: Object.keys(docs).length === REQUIRED_DOCS.length ? '#059669' : '#D97706' }}>
                  {Object.keys(docs).length}/{REQUIRED_DOCS.length}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {REQUIRED_DOCS.map(d => {
                  const up = docs[d.key]; const isUp = uploadingKey === d.key;
                  return (
                    <label key={d.key} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs cursor-pointer border transition-colors"
                      style={{ borderColor: up ? '#059669' : '#E5E7EF', background: up ? '#ECFDF5' : '#FFFFFF' }}>
                      {up ? <Check size={15} style={{color:'#059669'}}/> : <Upload size={15} style={{color:'#4F46E5'}}/>}
                      <span className="flex-1 font-medium truncate" style={{ color: up ? '#059669' : '#475569' }}>{d.label}</span>
                      {up
                        ? <button type="button" onClick={e=>{e.preventDefault(); removeDoc(d.key);}} className="text-slate-400 hover:text-red-500 flex-shrink-0"><X size={13}/></button>
                        : <span className="text-slate-400 flex-shrink-0">{isUp ? 'جارٍ...' : 'رفع'}</span>}
                      <input type="file" accept="image/*,application/pdf" className="hidden" disabled={isUp}
                        onChange={e=>e.target.files[0] && uploadDoc(d.key, e.target.files[0])}/>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color:'#94A3B8' }}>يجب رفع جميع المستندات الثمانية لإتمام التسجيل (PDF أو صور).</p>
            </div>

            <button type="submit" disabled={loading || uploadingKey}
              className="w-full py-3 rounded-xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              style={{ background:'linear-gradient(to left, #4F46E5, #4F46E5)', boxShadow:'0 0 20px #EEF2FF' }}>
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color:'#8892B0' }}>
            لديك حساب؟{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color:'#4F46E5' }}>تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
