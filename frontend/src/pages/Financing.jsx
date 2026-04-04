// Financing.jsx
import React, { useState, useEffect } from 'react';
import { financingAPI, invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Banknote, TrendingUp, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Financing() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState('browse');
  const [bidModal, setBidModal] = useState(null);
  const [bidForm, setBidForm] = useState({ offered_amount:'', monthly_rate:'', duration_days:'30', financier_type:'individual' });
  const [submitting, setSub] = useState(false);

  useEffect(() => {
    financingAPI.listRequests().then(r=>setRequests(r.data.data||[])).catch(()=>{});
    if(user?.role==='buyer'||user?.role==='supplier')
      invoiceAPI.list().then(r=>setInvoices(r.data.data||[])).catch(()=>{});
  }, []);

  const submitBid = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await financingAPI.submitBid(bidModal.id, bidForm);
      toast.success('تم تقديم عرض التمويل!'); setBidModal(null);
    } catch(err) { toast.error(err.response?.data?.message||'خطأ'); }
    finally { setSub(false); }
  };

  const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] text-sm";

  return (
    <div className="font-arabic space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Banknote size={20} className="text-[#00C853]"/> منصة تمويل الفواتير</h1>
      </div>

      {/* Fund info banner */}
      <div className="bg-gradient-to-l from-[#00C85310] to-[#00D4FF10] border border-[#00C85330] rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {icon:Banknote, label:'حجم الصندوق', value:'SAR 50M', color:'#00C853'},
            {icon:TrendingUp, label:'عائد المستثمر', value:'12-18%', color:'#00D4FF'},
            {icon:Clock, label:'موافقة التمويل', value:'48 ساعة', color:'#7B2FFF'},
            {icon:Shield, label:'معدل الاسترداد', value:'98.5%', color:'#FF6B35'},
          ].map(({icon:Icon,label,value,color})=>(
            <div key={label} className="text-center">
              <Icon size={22} className="mx-auto mb-1" style={{color}}/>
              <p className="text-sm font-bold" style={{color}}>{value}</p>
              <p className="text-xs text-[#90A4AE]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D1B5E] p-1 rounded-xl w-fit border border-[#00D4FF11]">
        {[['browse','🔍 فرص التمويل'],['my','📋 فواتيري']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===t?'bg-[#00C853] text-white':'text-[#90A4AE] hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {tab==='browse' && (
        <div className="space-y-4">
          <p className="text-[#90A4AE] text-sm">منافسة مفتوحة — قدّم عرض تمويل بأفضل سعر للفوز</p>
          {requests.length===0 && <p className="text-center py-10 text-[#90A4AE]">لا توجد طلبات تمويل مفتوحة حالياً</p>}
          {requests.map(r=>(
            <div key={r.id} className="bg-[#0D1B5E] border border-[#00C85322] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#00C853] bg-[#00C85315] px-2.5 py-1 rounded-lg">منافسة تمويل</span>
                    <span className="text-xs text-[#90A4AE]">{r.invoice_number}</span>
                  </div>
                  <p className="font-bold text-white">{r.requester_name}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-[#00C853] font-bold text-lg">SAR {Number(r.invoice_amount||0).toLocaleString()}</span>
                    <span className="text-xs text-[#90A4AE]">يستحق: {new Date(r.due_date).toLocaleDateString('ar-SA')}</span>
                    {r.best_rate && <span className="text-xs text-[#00D4FF]">أفضل سعر: {r.best_rate}% شهرياً</span>}
                    <span className="text-xs text-[#90A4AE]">{r.bid_count||0} عرض تمويل</span>
                  </div>
                </div>
                {(user?.role==='investor'||user?.role==='admin') && (
                  <button onClick={()=>setBidModal(r)} className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#00C853] to-[#00D4FF] text-white text-sm font-bold hover:opacity-90 shadow-lg flex-shrink-0">
                    💰 تقديم عرض تمويل
                  </button>
                )}
              </div>
              <div className="mt-3 bg-[#0A0F2E] rounded-xl overflow-hidden h-1.5">
                <div className="h-full bg-gradient-to-l from-[#00D4FF] to-[#00C853]" style={{width:`${Math.min((r.bid_count||0)*15,100)}%`}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='my' && (
        <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#00D4FF11]">
                {['رقم الفاتورة','المبلغ','تاريخ الاستحقاق','الحالة','إجراءات'].map(h=>(
                  <th key={h} className="text-right px-4 py-3 text-[#90A4AE] text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00D4FF08]">
              {invoices.length===0 && <tr><td colSpan={5} className="text-center py-10 text-[#90A4AE]">لا توجد فواتير</td></tr>}
              {invoices.map(inv=>(
                <tr key={inv.id} className="hover:bg-[#0A0F2E] transition-colors">
                  <td className="px-4 py-3 text-[#00D4FF] font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-white font-bold">SAR {Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#90A4AE]">{new Date(inv.due_date).toLocaleDateString('ar-SA')}</td>
                  <td className="px-4 py-3"><span className="text-xs font-bold text-[#00C853] bg-[#00C85315] px-2 py-1 rounded-lg">{inv.status}</span></td>
                  <td className="px-4 py-3">
                    {inv.status==='pending' && user?.role==='buyer' && (
                      <button onClick={async()=>{
                        try{ await financingAPI.request({invoice_id:inv.id,requested_amount:inv.amount,financing_type:'competition'}); toast.success('تم طلب التمويل!'); }
                        catch{ toast.error('خطأ'); }
                      }} className="text-xs text-[#00C853] hover:underline font-bold">طلب تمويل</button>
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
            className="bg-[#0D1B5E] border border-[#00C85344] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-white text-lg">تقديم عرض تمويل</h3>
            <p className="text-[#90A4AE] text-sm">الفاتورة: {bidModal.invoice_number} — SAR {Number(bidModal.invoice_amount||0).toLocaleString()}</p>
            <div><label className="text-xs text-[#90A4AE] mb-1.5 block">المبلغ المعروض (SAR) *</label>
              <input required type="number" className={inp} value={bidForm.offered_amount} onChange={e=>setBidForm({...bidForm,offered_amount:e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-[#90A4AE] mb-1.5 block">معدل الفائدة الشهري % *</label>
                <input required type="number" step="0.1" className={inp} value={bidForm.monthly_rate} onChange={e=>setBidForm({...bidForm,monthly_rate:e.target.value})}/></div>
              <div><label className="text-xs text-[#90A4AE] mb-1.5 block">مدة التمويل (أيام) *</label>
                <select className={inp} value={bidForm.duration_days} onChange={e=>setBidForm({...bidForm,duration_days:e.target.value})}>
                  <option value="30">30 يوم</option><option value="60">60 يوم</option><option value="90">90 يوم</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-l from-[#00C853] to-[#00D4FF] text-white font-bold hover:opacity-90 disabled:opacity-50">
                {submitting?'...':'تقديم عرض التمويل'}
              </button>
              <button type="button" onClick={()=>setBidModal(null)} className="px-4 py-2.5 rounded-xl border border-[#ffffff22] text-[#90A4AE]">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
