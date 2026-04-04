// Competitions.jsx
import React, { useState, useEffect } from 'react';
import { competitionAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Plus, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

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
      toast.success('تم نشر المنافسة!'); setShowNew(false); load();
    } catch(err) { toast.error(err.response?.data?.message||'خطأ'); }
    finally { setSub(false); }
  };

  const submitBid = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await competitionAPI.submitBid(bidModal.id, { bid_amount:bidAmt });
      toast.success('تم تقديم عرضك!'); setBidModal(null); setBidAmt('');
    } catch(err) { toast.error(err.response?.data?.message||'خطأ'); }
    finally { setSub(false); }
  };

  const tabs = [['project','🏗️ مشاريع'],['product','📦 منتجات'],['service','🔧 خدمات'],['financing','⚖️ تمويل فواتير']];
  const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] text-sm";

  return (
    <div className="font-arabic space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Trophy size={20} className="text-[#7B2FFF]"/> المنافسات والمناقصات</h1>
        {(user?.role==='buyer'||user?.role==='admin') && (
          <button onClick={()=>setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-[#7B2FFF] to-[#00D4FF] text-white text-sm font-bold hover:opacity-90 shadow-lg">
            <Plus size={15}/> نشر منافسة
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D1B5E] p-1 rounded-xl w-fit border border-[#00D4FF11]">
        {tabs.map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===t?'bg-[#7B2FFF] text-white shadow':'text-[#90A4AE] hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {/* Create form */}
      {showNew && (
        <form onSubmit={createComp} className="bg-[#0D1B5E] border border-[#7B2FFF44] rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-white">نشر منافسة جديدة</h3>
          <input required className={inp} placeholder="عنوان المنافسة *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className={inp} placeholder="الميزانية (SAR)" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/>
            <input className={inp} placeholder="الموقع / المنطقة" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
          </div>
          <input required type="datetime-local" className={inp} value={form.closing_date} onChange={e=>setForm({...form,closing_date:e.target.value})}/>
          <textarea className={inp} rows={3} placeholder="متطلبات المشاركة..." value={form.requirements} onChange={e=>setForm({...form,requirements:e.target.value})}/>
          <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#7B2FFF] to-[#00D4FF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg">
            {submitting?'جارٍ النشر...':'🚀 نشر المنافسة'}
          </button>
        </form>
      )}

      {/* Competition cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="col-span-3 text-center py-10 text-[#90A4AE]">جارٍ التحميل...</p>}
        {!loading && comps.length===0 && <p className="col-span-3 text-center py-10 text-[#90A4AE]">لا توجد منافسات مفتوحة</p>}
        {comps.map(c=>(
          <div key={c.id} className="bg-[#0D1B5E] border border-[#7B2FFF33] rounded-2xl p-5 hover:border-[#7B2FFF] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#7B2FFF] bg-[#7B2FFF15] px-2.5 py-1 rounded-lg">{c.comp_number}</span>
              <span className="text-xs text-[#00C853] bg-[#00C85315] px-2.5 py-1 rounded-lg font-bold">{c.bid_count||0} عروض</span>
            </div>
            <h3 className="font-bold text-white text-sm mb-2 leading-snug">{c.title}</h3>
            <p className="text-[#90A4AE] text-xs mb-3 truncate">{c.buyer_name}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#00C853] font-bold text-base">{c.budget?`SAR ${Number(c.budget).toLocaleString()}`:'—'}</p>
                <p className="text-[#90A4AE] text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={10}/>{new Date(c.closing_date).toLocaleDateString('ar-SA')}
                </p>
              </div>
              {user?.role==='supplier' && (
                <button onClick={()=>setBidModal(c)} className="px-3 py-2 rounded-lg bg-[#7B2FFF] text-white text-xs font-bold hover:bg-[#6B1FEF] transition">
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
            className="bg-[#0D1B5E] border border-[#7B2FFF44] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-lg">تقديم عرض: {bidModal.title}</h3>
            <div>
              <label className="text-xs text-[#90A4AE] mb-1.5 block">قيمة عرضك (SAR) *</label>
              <input required type="number" className={inp} placeholder="0" value={bidAmt} onChange={e=>setBidAmt(e.target.value)}/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-l from-[#7B2FFF] to-[#00D4FF] text-white font-bold hover:opacity-90 disabled:opacity-50">
                {submitting?'...':'تقديم العرض'}
              </button>
              <button type="button" onClick={()=>setBidModal(null)} className="px-4 py-2.5 rounded-xl border border-[#ffffff22] text-[#90A4AE] hover:text-white">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
