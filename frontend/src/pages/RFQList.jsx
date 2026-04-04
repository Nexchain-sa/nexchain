// ─── RFQList.jsx ──────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfqAPI, categoriesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './Dashboard';
import { Search, Plus, Clock } from 'lucide-react';

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

  const inputStyle = {
    background: '#0E0F1E',
    border: '1px solid #6C63FF33',
    color: '#E8EAF6',
  };

  return (
    <div className="font-arabic space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          {user?.role==='buyer' ? 'طلبات الشراء' : 'الفرص المتاحة'}
        </h1>
        {user?.role==='buyer' && (
          <Link to="/rfqs/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background:'linear-gradient(to left, #6C63FF, #00F5FF)', boxShadow:'0 0 16px #6C63FF33' }}>
            <Plus size={15}/> طلب جديد
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'#8892B0' }}/>
          <input value={filters.search} onChange={e=>setF({...filters,search:e.target.value})}
            placeholder="بحث..."
            className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm placeholder-[#455A64] focus:outline-none transition-colors"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#6C63FF'}
            onBlur={e=>e.target.style.borderColor='#6C63FF33'}/>
        </div>
        <select value={filters.status} onChange={e=>setF({...filters,status:e.target.value})}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          style={inputStyle}
          onFocus={e=>e.target.style.borderColor='#6C63FF'}
          onBlur={e=>e.target.style.borderColor='#6C63FF33'}>
          <option value="">جميع الحالات</option>
          <option value="open">مفتوح</option>
          <option value="closed">مغلق</option>
          <option value="awarded">مُرسى</option>
        </select>
        <select value={filters.category_id} onChange={e=>setF({...filters,category_id:e.target.value})}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          style={inputStyle}
          onFocus={e=>e.target.style.borderColor='#6C63FF'}
          onBlur={e=>e.target.style.borderColor='#6C63FF33'}>
          <option value="">جميع الفئات</option>
          {cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background:'#0E0F1E', border:'1px solid #6C63FF22' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom:'1px solid #6C63FF11' }}>
              {['رقم الطلب','العنوان','الجهة','الكمية','ينتهي','العروض','الحالة',''].map(h=>(
                <th key={h} className="text-right px-4 py-3 text-xs font-semibold"
                  style={{ color:'#8892B0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-10" style={{ color:'#8892B0' }}>جارٍ التحميل...</td></tr>
            )}
            {!loading && rfqs.length===0 && (
              <tr><td colSpan={8} className="text-center py-10" style={{ color:'#8892B0' }}>لا توجد طلبات</td></tr>
            )}
            {rfqs.map(r=>(
              <tr key={r.id} className="transition-colors"
                style={{ borderTop:'1px solid #6C63FF08' }}
                onMouseEnter={e=>e.currentTarget.style.background='#13142A'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color:'#6C63FF' }}>{r.rfq_number}</td>
                <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{r.title}</td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>{r.buyer_company||'—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>{r.quantity||'—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>
                  <span className="flex items-center gap-1">
                    <Clock size={11}/>{new Date(r.closing_date).toLocaleDateString('ar-SA')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold" style={{ color:'#00E5A0' }}>{r.quote_count||0}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status}/></td>
                <td className="px-4 py-3">
                  <Link to={`/rfqs/${r.id}`}
                    className="text-xs hover:underline transition-colors"
                    style={{ color:'#6C63FF' }}>
                    عرض
                  </Link>
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
