// ─── RFQList.jsx ──────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfqAPI, categoriesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './Dashboard';
import { Search, Plus, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function RFQList() {
  const { user } = useAuth();
  const [rfqs, setRfqs]   = useState([]);
  const [cats, setCats]   = useState([]);
  const [loading, setL]   = useState(true);
  const [filters, setF]   = useState({ status:'', category_id:'', search:'' });

  useEffect(() => {
    categoriesAPI.list().then(r=>setCats(r.data.data||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    setL(true);
    rfqAPI.list(filters).then(r=>{ setRfqs(r.data.data||[]); setL(false); }).catch(()=>setL(false));
  }, [filters]);

  return (
    <div className="font-arabic space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          {user?.role==='buyer' ? 'طلبات الشراء' : 'الفرص المتاحة'}
        </h1>
        {user?.role==='buyer' && (
          <Link to="/rfqs/new" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white text-sm font-bold hover:opacity-90 shadow-lg shadow-cyan-500/20">
            <Plus size={15}/> طلب جديد
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#90A4AE]"/>
          <input value={filters.search} onChange={e=>setF({...filters,search:e.target.value})}
            placeholder="بحث..." className="w-full bg-[#0D1B5E] border border-[#00D4FF22] rounded-xl pr-9 pl-4 py-2.5 text-sm text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF]"/>
        </div>
        <select value={filters.status} onChange={e=>setF({...filters,status:e.target.value})}
          className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D4FF]">
          <option value="">جميع الحالات</option>
          <option value="open">مفتوح</option>
          <option value="closed">مغلق</option>
          <option value="awarded">مُرسى</option>
        </select>
        <select value={filters.category_id} onChange={e=>setF({...filters,category_id:e.target.value})}
          className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D4FF]">
          <option value="">جميع الفئات</option>
          {cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#00D4FF11]">
              {['رقم الطلب','العنوان','الجهة','الكمية','ينتهي','العروض','الحالة',''].map(h=>(
                <th key={h} className="text-right px-4 py-3 text-[#90A4AE] text-xs font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00D4FF08]">
            {loading && <tr><td colSpan={8} className="text-center py-10 text-[#90A4AE]">جارٍ التحميل...</td></tr>}
            {!loading && rfqs.length===0 && <tr><td colSpan={8} className="text-center py-10 text-[#90A4AE]">لا توجد طلبات</td></tr>}
            {rfqs.map(r=>(
              <tr key={r.id} className="hover:bg-[#0A0F2E] transition-colors">
                <td className="px-4 py-3 text-[#00D4FF] font-mono text-xs">{r.rfq_number}</td>
                <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{r.title}</td>
                <td className="px-4 py-3 text-[#90A4AE]">{r.buyer_company||'—'}</td>
                <td className="px-4 py-3 text-[#90A4AE]">{r.quantity||'—'}</td>
                <td className="px-4 py-3 text-[#90A4AE] text-xs">
                  <span className="flex items-center gap-1"><Clock size={11}/>{new Date(r.closing_date).toLocaleDateString('ar-SA')}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[#00C853] font-bold">{r.quote_count||0}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status}/></td>
                <td className="px-4 py-3">
                  <Link to={`/rfqs/${r.id}`} className="text-[#00D4FF] text-xs hover:underline">عرض</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RFQList;
