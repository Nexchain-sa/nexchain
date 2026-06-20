// Financing.jsx
import React, { useState, useEffect } from 'react';
import { financingAPI, invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Banknote, TrendingUp, Shield, Clock, Landmark, Upload, FileText, X } from 'lucide-react';
import { uploadToCloudinary } from '../config/cloudinary';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const RISK = {
  A: { color:'#059669', bg:'#ECFDF5', label:'منخفض المخاطر' },
  B: { color:'#0D9488', bg:'#F0FDFA', label:'جيد' },
  C: { color:'#D97706', bg:'#FEF3C7', label:'مخاطر متوسطة' },
  D: { color:'#DC2626', bg:'#FEE2E2', label:'مرتفع المخاطر' },
};
const riskOf = (g) => RISK[g] || RISK.C;

export default function Financing() {
  const { user } = useAuth();
  const { t, dir, lang } = useLang();
  const { fmt } = useCurrency();
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState('browse');
  const [bidModal, setBidModal] = useState(null);
  const [bidForm, setBidForm] = useState({ offered_amount:'', monthly_rate:'', duration_days:'30', financier_type:'individual' });
  const [submitting, setSub] = useState(false);
  const [fundModal, setFundModal] = useState(null);
  const [fundForm, setFundForm] = useState({ monthly_rate:'2', duration_days:'90', earnest_amount:'', financing_mode:'conventional' });
  const [funding, setFunding] = useState(false);
  const [contract, setContract] = useState(null);
  const [promissory, setPromissory] = useState(null);
  const [upDoc, setUpDoc] = useState(null);
  const upAgr = async (which, file) => {
    setUpDoc(which);
    try { const u = await uploadToCloudinary(file); which==='c'?setContract(u):setPromissory(u); toast.success(t('تم رفع المستند')); }
    catch(e){ toast.error(e.message||t('فشل الرفع')); } finally { setUpDoc(null); }
  };
  const isAdmin = ['admin','owner'].includes(user?.role);

  const loadRequests = () => financingAPI.listRequests().then(r=>setRequests(r.data.data||[])).catch(()=>{});

  useEffect(() => {
    loadRequests();
    if(user?.role==='buyer'||user?.role==='supplier')
      invoiceAPI.list().then(r=>setInvoices(r.data.data||[])).catch(()=>{});
  }, []);

  const submitBid = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await financingAPI.submitBid(bidModal.id, bidForm);
      toast.success(t('تم تقديم عرض التمويل!')); setBidModal(null);
    } catch(err) { toast.error(err.response?.data?.message||t('خطأ')); }
    finally { setSub(false); }
  };

  const fundByPlatform = async (e) => {
    e.preventDefault(); setFunding(true);
    try {
      await financingAPI.fundByPlatform(fundModal.id, { ...fundForm, contract, promissory });
      toast.success(t('تم تمويل الصفقة من صندوق المنصة!'));
      setFundModal(null); setContract(null); setPromissory(null); loadRequests();
    } catch(err) { toast.error(err.response?.data?.message||t('خطأ')); }
    finally { setFunding(false); }
  };

  const inp = "w-full bg-[#F4F6FB] border border-[#EEF2FF] rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] text-sm";

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Banknote size={20} className="text-[#059669]"/> {t('منصة تمويل الفواتير')}</h1>
      </div>

      {/* Fund info banner */}
      <div className="bg-[#EEF2FF] border border-[#ECFDF5] rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {icon:Banknote, label:'حجم الصندوق', value:'SAR 50M', color:'#059669'},
            {icon:TrendingUp, label:'عائد المستثمر', value:'12-18%', color:'#4F46E5'},
            {icon:Clock, label:'موافقة التمويل', value:t('48 ساعة'), color:'#0D9488'},
            {icon:Shield, label:'معدل الاسترداد', value:'98.5%', color:'#D97706'},
          ].map(({icon:Icon,label,value,color})=>(
            <div key={label} className="text-center">
              <Icon size={22} className="mx-auto mb-1" style={{color}}/>
              <p className="text-sm font-bold" style={{color}}>{value}</p>
              <p className="text-xs text-slate-500">{t(label)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl w-fit border border-[#EEF2FF]">
        {[['browse','🔍 فرص التمويل'],['my','📋 فواتيري']].map(([tk,l])=>(
          <button key={tk} onClick={()=>setTab(tk)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===tk?'bg-[#059669] !text-white':'text-slate-500 hover:text-slate-800'}`}>{t(l)}</button>
        ))}
      </div>

      {tab==='browse' && (
        <div className="space-y-4">
          <p className="text-slate-500 text-sm">{t('منافسة مفتوحة — قدّم عرض تمويل بأفضل سعر للفوز')}</p>
          {requests.length===0 && <p className="text-center py-10 text-slate-500">{t('لا توجد طلبات تمويل مفتوحة حالياً')}</p>}
          {requests.map(r=>(
            <div key={r.id} className="bg-white border border-[#ECFDF5] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-lg">{t('منافسة تمويل')}</span>
                    <span className="text-xs text-slate-500">{r.invoice_number}</span>
                  </div>
                  <p className="font-bold text-slate-800">{r.requester_name}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-[#059669] font-bold text-lg">{fmt(r.invoice_amount)}</span>
                    <span className="text-xs text-slate-500">{t('يستحق:')} {new Date(r.due_date).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</span>
                    {r.best_rate && <span className="text-xs text-[#4F46E5]">{t('أفضل سعر:')} {r.best_rate}% {t('شهرياً')}</span>}
                    <span className="text-xs text-slate-500">{r.bid_count||0} {t('عرض تمويل')}</span>
                    {r.risk_grade && <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{background:riskOf(r.risk_grade).bg, color:riskOf(r.risk_grade).color}}>{t('تقييم المخاطر')}: {r.risk_grade} · {r.risk_score}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {(user?.role==='investor'||user?.role==='admin'||user?.role==='owner') && (
                    <button onClick={()=>setBidModal(r)} className="px-4 py-2.5 rounded-xl bg-[#4F46E5] text-sm font-bold hover:opacity-90 shadow-lg !text-white">
                      💰 {t('تقديم عرض تمويل')}
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={()=>{setContract(null);setPromissory(null);setFundModal(r);}} className="px-4 py-2.5 rounded-xl bg-[#0D9488] text-sm font-bold hover:opacity-90 shadow-lg !text-white flex items-center gap-1.5 justify-center">
                      <Landmark size={15}/> {t('تمويل من صندوق المنصة')}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 bg-[#F4F6FB] rounded-xl overflow-hidden h-1.5">
                <div className="h-full bg-[#4F46E5] !text-white" style={{width:`${Math.min((r.bid_count||0)*15,100)}%`}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='my' && (
        <div className="bg-white border border-[#EEF2FF] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EEF2FF]">
                {['رقم الفاتورة','المبلغ','تاريخ الاستحقاق','الحالة','إجراءات'].map(h=>(
                  <th key={h} className="text-right px-4 py-3 text-slate-500 text-xs">{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2FF]">
              {invoices.length===0 && <tr><td colSpan={5} className="text-center py-10 text-slate-500">{t('لا توجد فواتير')}</td></tr>}
              {invoices.map(inv=>(
                <tr key={inv.id} className="hover:bg-[#F4F6FB] transition-colors">
                  <td className="px-4 py-3 text-[#4F46E5] font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-800 font-bold">SAR {Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(inv.due_date).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</td>
                  <td className="px-4 py-3"><span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded-lg">{inv.status}</span></td>
                  <td className="px-4 py-3">
                    {inv.status==='pending' && user?.role==='buyer' && (
                      <button onClick={async()=>{
                        try{ await financingAPI.request({invoice_id:inv.id,requested_amount:inv.amount,financing_type:'competition'}); toast.success(t('تم طلب التمويل!')); }
                        catch{ toast.error(t('خطأ')); }
                      }} className="text-xs text-[#059669] hover:underline font-bold">{t('طلب تمويل')}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bid modal */}
      {bidModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setBidModal(null)}>
          <form onSubmit={submitBid} onClick={e=>e.stopPropagation()}
            className="bg-white border border-[#ECFDF5] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">{t('تقديم عرض تمويل')}</h3>
            <p className="text-slate-500 text-sm">{t('الفاتورة:')} {bidModal.invoice_number} — SAR {Number(bidModal.invoice_amount||0).toLocaleString()}</p>
            {bidModal.risk_grade && <p><span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:riskOf(bidModal.risk_grade).bg,color:riskOf(bidModal.risk_grade).color}}>{t('تقييم المخاطر')}: {bidModal.risk_grade} ({bidModal.risk_score}) — {t(riskOf(bidModal.risk_grade).label)}</span></p>}
            <div><label className="text-xs text-slate-500 mb-1.5 block">{t('المبلغ المعروض (SAR) *')}</label>
              <input required type="number" className={inp} value={bidForm.offered_amount} onChange={e=>setBidForm({...bidForm,offered_amount:e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500 mb-1.5 block">{t('معدل الفائدة الشهري % *')}</label>
                <input required type="number" step="0.1" className={inp} value={bidForm.monthly_rate} onChange={e=>setBidForm({...bidForm,monthly_rate:e.target.value})}/></div>
              <div><label className="text-xs text-slate-500 mb-1.5 block">{t('مدة التمويل (أيام) *')}</label>
                <select className={inp} value={bidForm.duration_days} onChange={e=>setBidForm({...bidForm,duration_days:e.target.value})}>
                  <option value="30">{t('30 يوم')}</option><option value="60">{t('60 يوم')}</option><option value="90">{t('90 يوم')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] text-slate-800 font-bold hover:opacity-90 disabled:opacity-50 !text-white">
                {submitting?'...':t('تقديم عرض التمويل')}
              </button>
              <button type="button" onClick={()=>setBidModal(null)} className="px-4 py-2.5 rounded-xl border border-[#E5E7EF] text-slate-500">{t('إلغاء')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Platform fund modal */}
      {fundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setFundModal(null)}>
          <form onSubmit={fundByPlatform} onClick={e=>e.stopPropagation()}
            className="bg-white border border-[#E5E7EF] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Landmark size={20} style={{color:'#0D9488'}}/> {t('تمويل من صندوق المنصة')}</h3>
            <p className="text-slate-500 text-sm">{t('الفاتورة:')} {fundModal.invoice_number} — SAR {Number(fundModal.invoice_amount||0).toLocaleString()}</p>
            {fundModal.risk_grade && <p><span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:riskOf(fundModal.risk_grade).bg,color:riskOf(fundModal.risk_grade).color}}>{t('تقييم المخاطر')}: {fundModal.risk_grade} ({fundModal.risk_score}) — {t(riskOf(fundModal.risk_grade).label)}</span></p>}
            <p className="text-xs text-slate-500 bg-[#F0FDFA] rounded-lg p-3">{t('ستموّل المنصة هذه الصفقة مباشرة من صندوقها، ويعود الربح بالكامل للمنصة، ويُنشأ جدول الأقساط تلقائياً للمشتري.')}</p>
            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer rounded-xl p-2.5" style={{background:'#F0FDFA', color:'#0F766E'}}>
              <input type="checkbox" checked={fundForm.financing_mode==='shariah'} onChange={e=>setFundForm({...fundForm,financing_mode:e.target.checked?'shariah':'conventional'})}/>
              🌙 {t('متوافق مع الشريعة (مرابحة)')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-500 mb-1.5 block">{fundForm.financing_mode==='shariah' ? t('هامش المرابحة %')+' *' : t('الربح الشهري % *')}</label>
                <input required type="number" step="0.1" className={inp} value={fundForm.monthly_rate} onChange={e=>setFundForm({...fundForm,monthly_rate:e.target.value})}/></div>
              <div><label className="text-xs text-slate-500 mb-1.5 block">{t('مدة التقسيط *')}</label>
                <select className={inp} value={fundForm.duration_days} onChange={e=>setFundForm({...fundForm,duration_days:e.target.value})}>
                  <option value="90">{t('3 أشهر')}</option><option value="180">{t('6 أشهر')}</option><option value="360">{t('12 شهر')}</option>
                </select></div>
            </div>
            <div><label className="text-xs text-slate-500 mb-1.5 block">{t('مبلغ الجدية (ر.س) — اختياري')}</label>
              <input type="number" className={inp} value={fundForm.earnest_amount} onChange={e=>setFundForm({...fundForm,earnest_amount:e.target.value})} placeholder="0"/></div>
            <div className="grid grid-cols-2 gap-3">
              {[['c','العقد',contract],['p','سند لأمر',promissory]].map(([k,lbl,doc])=>(
                <div key={k}>
                  <label className="text-xs text-slate-500 mb-1.5 block">{t(lbl)} *</label>
                  <label className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs cursor-pointer border-2 border-dashed" style={{borderColor: doc?'#059669':'#C7CBE8', color: doc?'#059669':'#4F46E5', background:'#F8FAFC'}}>
                    {doc ? <FileText size={14}/> : <Upload size={14}/>}
                    <span className="truncate">{upDoc===k ? t('جارٍ...') : (doc ? doc.name : t('رفع'))}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e=>e.target.files[0] && upAgr(k, e.target.files[0])}/>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">{t('يرفق الممول العقد وسند لأمر؛ يوقّعهما المشتري ويعيد رفعهما من صفحة العقود.')}</p>
            <div className="flex gap-3">
              <button type="submit" disabled={funding} className="flex-1 py-2.5 rounded-xl bg-[#0D9488] font-bold hover:opacity-90 disabled:opacity-50 !text-white">
                {funding?'...':t('تأكيد التمويل من الصندوق')}
              </button>
              <button type="button" onClick={()=>setFundModal(null)} className="px-4 py-2.5 rounded-xl border border-[#E5E7EF] text-slate-500">{t('إلغاء')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
