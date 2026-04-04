// Invoices.jsx
import React, { useState, useEffect } from 'react';
import { invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Receipt, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export function Invoices() {
  const { user } = useAuth();
  const [invs, setInvs] = useState([]);
  const [loading, setL] = useState(true);
  const [showForm, setShow] = useState(false);
  const [form, setForm] = useState({ buyer_id:'', supplier_id:'', amount:'', due_date:'', notes:'' });
  const [sub, setSub] = useState(false);

  useEffect(() => {
    invoiceAPI.list().then(r=>{ setInvs(r.data.data||[]); setL(false); }).catch(()=>setL(false));
  }, []);

  const create = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await invoiceAPI.create(form);
      toast.success('تم إنشاء الفاتورة!'); setShow(false);
      invoiceAPI.list().then(r=>setInvs(r.data.data||[]));
    } catch(err) { toast.error(err.response?.data?.message||'خطأ'); }
    finally { setSub(false); }
  };

  const statColor = { pending:'#FF6B35',approved:'#00C853',financed:'#7B2FFF',paid:'#00D4FF',overdue:'#ef4444' };
  const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] text-sm";

  return (
    <div className="font-arabic space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Receipt size={20} className="text-[#7B2FFF]"/> الفواتير</h1>
        <button onClick={()=>setShow(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-[#7B2FFF] to-[#00D4FF] text-white text-sm font-bold hover:opacity-90">
          <Plus size={15}/> فاتورة جديدة
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-[#0D1B5E] border border-[#7B2FFF33] rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-white">إنشاء فاتورة جديدة</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-[#90A4AE] mb-1.5 block">المبلغ (SAR) *</label>
              <input required type="number" className={inp} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
            <div><label className="text-xs text-[#90A4AE] mb-1.5 block">تاريخ الاستحقاق *</label>
              <input required type="date" className={inp} value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></div>
          </div>
          <textarea className={inp} rows={2} placeholder="ملاحظات..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          <button type="submit" disabled={sub} className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#7B2FFF] to-[#00D4FF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
            {sub?'...':'إنشاء الفاتورة'}
          </button>
        </form>
      )}

      <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#00D4FF11]">
              {['رقم الفاتورة','المشتري','المورد','المبلغ','الاستحقاق','الحالة'].map(h=>(
                <th key={h} className="text-right px-4 py-3 text-[#90A4AE] text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00D4FF08]">
            {loading && <tr><td colSpan={6} className="text-center py-10 text-[#90A4AE]">جارٍ التحميل...</td></tr>}
            {!loading && invs.length===0 && <tr><td colSpan={6} className="text-center py-10 text-[#90A4AE]">لا توجد فواتير</td></tr>}
            {invs.map(inv=>(
              <tr key={inv.id} className="hover:bg-[#0A0F2E] transition-colors">
                <td className="px-4 py-3 text-[#00D4FF] font-mono text-xs">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-white text-xs">{inv.buyer_name||'—'}</td>
                <td className="px-4 py-3 text-white text-xs">{inv.supplier_name||'—'}</td>
                <td className="px-4 py-3 text-[#00C853] font-bold">SAR {Number(inv.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-[#90A4AE] text-xs">{new Date(inv.due_date).toLocaleDateString('ar-SA')}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{color:statColor[inv.status]||'#90A4AE',background:(statColor[inv.status]||'#90A4AE')+'20'}}>{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Invoices;
