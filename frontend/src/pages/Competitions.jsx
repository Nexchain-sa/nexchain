// Competitions.jsx
import React, { useState, useEffect } from 'react';
import { competitionAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Plus, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';

export default function Competitions() {
  const { user } = useAuth();
  const [comps, setComps]   = useState([]);
  const [loading, setL]     = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab]       = useState('project');
  const [bidModal, setBidModal] = useState(null);
  const [form, setForm]     = useState({ title:'', description:'', type:'project', budget:'', location:'', closing_date:'', requirements:'' });
  const [bidAmt, setBidAmt] = useState('');
  const [submitting, setSub] = useState(false);

  const load = () => {
    setL(true);
    competitionAPI.list({type:tab}).then(r=>{ setComps(r.data.data||[]); setL(false); }).catch(()=>setL(false));
  };
  useEffect(()=>{ load(); }, [tab]);

  const createComp = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await competitionAPI.create({...form, type:tab});
      toast.success(t('تم نشر المنافسة!')); setShowNew(false); load();
    } catch(err) { toast.error(err.response?.data?.message||t('خطأ')); }
    finally { setSub(false); }
  };

  const submitBid = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await competitionAPI.submitBid(bidModal.id, { bid_amount:bidAmt });
      toast.success(t('تم تقديم عرضك!')); setBidModal(null); setBidAmt('');
    } catch(err) { toast.error(err.response?.data?.message||t('خطأ')); }
    finally { setSub(false); }
  };

  const tabs = [['project','🏗️ مشاريع'],['product','📦 منتجات'],['service','🔧 خدمات'],['financing','⚖️ تمويل فواتير']];
  const inp = "w-full bg-[#F4F6FB] border border-[#EEF2FF] rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] text-sm";

  const { t, dir, lang } = useLang();
  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Trophy size={20} className="text-[#0D9488]"/> {t('المنافسات والمناقصات')}</h1>
        {(user?.role==='buyer'||user?.role==='admin') && (
          <button onClick={()=>setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F46E5] text-slate-800 text-sm font-bold hover:opacity-90 shadow-lg !text-white">
            <Plus size={15}/> نشر منافسة
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl w-fit border border-[#EEF2FF]">
        {tabs.map(([tk,l])=>(
          <button key={tk} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===tk?'bg-[#0D9488] !text-white shadow':'text-slate-500 hover:text-slate-800'}`}>{t(l)}</button>
        ))}
      </div>

      {/* Create form */}
      {showNew && (
        <form onSubmit={createComp} className="bg-white border border-[#F0FDFA] rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-slate-800">{t('نشر منافسة جديدة')}</h3>
          <input required className={inp} placeholder={t('عنوان المنافسة *')} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className={inp} placeholder={t('الميزانية (SAR)')} value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/>
            <input className={inp} placeholder={t('الموقع / المنطقة')} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
          </div>
          <input required type="datetime-local" className={inp} value={form.closing_date} onChange={e=>setForm({...form,closing_date:e.target.value})}/>
          <textarea className={inp} rows={3} placeholder={t('متطلبات المشاركة...')} value={form.requirements} onChange={e=>setForm({...form,requirements:e.target.value})}/>
          <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-[#4F46E5] text-slate-800 font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg !text-white">
            {submitting?'جارٍ النشر...':'🚀 نشر المنافسة'}
          </button>
        </form>
      )}

      {/* Competition cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="col-span-3 text-center py-10 text-slate-500">{t('جارٍ التحميل...')}</p>}
        {!loading && comps.length===0 && <p className="col-span-3 text-center py-10 text-slate-500">{t('لا توجد منافسات مفتوحة')}</p>}
        {comps.map(c=>(
          <div key={c.id} className="bg-white border border-[#F0FDFA] rounded-2xl p-5 hover:border-[#0D9488] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#0D9488] bg-[#F0FDFA] px-2.5 py-1 rounded-lg">{c.comp_number}</span>
              <span className="text-xs text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-lg font-bold">{c.bid_count||0} عروض</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-2 leading-snug">{c.title}</h3>
            <p className="text-slate-500 text-xs mb-3 truncate">{c.buyer_name}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#059669] font-bold text-base">{c.budget?`SAR ${Number(c.budget).toLocaleString()}`:'—'}</p>
                <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={10}/>{new Date(c.closing_date).toLocaleDateString('ar-SA')}
                </p>
              </div>
              {user?.role==='supplier' && (
                <button onClick={()=>setBidModal(c)} className="px-3 py-2 rounded-lg bg-[#0D9488] text-slate-800 text-xs font-bold hover:bg-[#4F46E5] transition !text-white">
                  شارك
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bid modal */}
      {bidModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setBidModal(null)}>
          <form onSubmit={submitBid} onClick={e=>e.stopPropagation()}
            className="bg-white border border-[#F0FDFA] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">تقديم عرض: {bidModal.title}</h3>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">{t('قيمة عرضك (SAR) *')}</label>
              <input required type="number" className={inp} placeholder="0" value={bidAmt} onChange={e=>setBidAmt(e.target.value)}/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] text-slate-800 font-bold hover:opacity-90 disabled:opacity-50 !text-white">
                {submitting?'...':t('تقديم العرض')}
              </button>
              <button type="button" onClick={()=>setBidModal(null)} className="px-4 py-2.5 rounded-xl border border-[#E5E7EF] text-slate-500 hover:text-slate-800">{t('إلغاء')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
