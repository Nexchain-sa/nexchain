// ─── RFQList.jsx ──────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfqAPI, categoriesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { StatusBadge } from './Dashboard';
import { Search, Plus, Clock } from 'lucide-react';

export function RFQList() {
  const { user } = useAuth();
  const { t, dir } = useLang();
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
    background: '#FFFFFF',
    border: '1px solid #EEF2FF',
    color: '#4F46E5',
  };

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">
          {user?.role==='buyer' ? t('طلبات الشراء') : t('الفرص المتاحة')}
        </h1>
        {user?.role==='buyer' && (
          <Link to="/rfqs/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl !text-white text-sm font-bold hover:opacity-90"
            style={{ background:'linear-gradient(to left, #4F46E5, #4F46E5)', boxShadow:'0 0 16px #EEF2FF' }}>
            <Plus size={15}/> {t('طلب جديد')}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'#8892B0' }}/>
          <input value={filters.search} onChange={e=>setF({...filters,search:e.target.value})}
            placeholder={t('بحث...')}
            className="w-full rounded-xl pr-9 pl-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none transition-colors"
            style={inputStyle}
            onFocus={e=>e.target.style.borderColor='#4F46E5'}
            onBlur={e=>e.target.style.borderColor='#EEF2FF'}/>
        </div>
        <select value={filters.status} onChange={e=>setF({...filters,status:e.target.value})}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          style={inputStyle}
          onFocus={e=>e.target.style.borderColor='#4F46E5'}
          onBlur={e=>e.target.style.borderColor='#EEF2FF'}>
          <option value="">{t('جميع الحالات')}</option>
          <option value="open">{t('مفتوح')}</option>
          <option value="closed">{t('مغلق')}</option>
          <option value="awarded">{t('مُرسى')}</option>
        </select>
        <select value={filters.category_id} onChange={e=>setF({...filters,category_id:e.target.value})}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
          style={inputStyle}
          onFocus={e=>e.target.style.borderColor='#4F46E5'}
          onBlur={e=>e.target.style.borderColor='#EEF2FF'}>
          <option value="">{t('جميع الفئات')}</option>
          {cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background:'#FFFFFF', border:'1px solid #EEF2FF' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom:'1px solid #EEF2FF' }}>
              {['رقم الطلب','العنوان','الجهة','الكمية','ينتهي','العروض','الحالة',''].map(h=>(
                <th key={h} className="text-right px-4 py-3 text-xs font-semibold"
                  style={{ color:'#8892B0' }}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-10" style={{ color:'#8892B0' }}>{t('جارٍ التحميل...')}</td></tr>
            )}
            {!loading && rfqs.length===0 && (
              <tr><td colSpan={8} className="text-center py-10" style={{ color:'#8892B0' }}>{t('لا توجد طلبات')}</td></tr>
            )}
            {rfqs.map(r=>(
              <tr key={r.id} className="transition-colors"
                style={{ borderTop:'1px solid #EEF2FF' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F4F6FB'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color:'#4F46E5' }}>{r.rfq_number}</td>
                <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px] truncate">{r.title}</td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>{r.buyer_company||'—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>{r.quantity||'—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>
                  <span className="flex items-center gap-1">
                    <Clock size={11}/>{new Date(r.closing_date).toLocaleDateString('ar-SA')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold" style={{ color:'#059669' }}>{r.quote_count||0}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status}/></td>
                <td className="px-4 py-3">
                  <Link to={`/rfqs/${r.id}`}
                    className="text-xs hover:underline transition-colors"
                    style={{ color:'#4F46E5' }}>
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
