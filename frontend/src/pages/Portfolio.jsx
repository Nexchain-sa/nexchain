import React, { useState, useEffect } from 'react';
import { financingAPI } from '../utils/api';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Briefcase, Banknote, TrendingUp, PiggyBank, Clock } from 'lucide-react';

export default function Portfolio() {
  const { t, dir } = useLang();
  const { fmt } = useCurrency();
  const [d, setD] = useState(null);

  useEffect(() => { financingAPI.portfolio().then(r => setD(r.data.data)).catch(() => setD({ positions: [], summary: {} })); }, []);

  const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E5E7EF' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl" style={{ background: color + '15' }}><Icon size={18} style={{ color }} /></div>
        <span className="text-xs font-medium text-slate-500">{t(label)}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );

  if (!d) return <p className="text-center text-slate-400 py-12 font-arabic" dir={dir}>{t('جارٍ التحميل...')}</p>;
  const s = d.summary || {};

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center gap-2">
        <Briefcase size={22} style={{ color: '#4F46E5' }} />
        <h1 className="text-xl font-bold text-slate-800">{t('محفظتي الاستثمارية')}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Banknote} label="إجمالي المستثمَر" value={fmt(s.invested)} color="#4F46E5" />
        <Stat icon={TrendingUp} label="الربح المتوقع" value={fmt(s.expected_profit)} color="#059669" />
        <Stat icon={TrendingUp} label="العائد السنوي المتوقع" value={`${s.annual_yield || 0}%`} color="#0D9488" />
        <Stat icon={Briefcase} label="صفقات نشطة" value={s.active || 0} color="#7C3AED" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={PiggyBank} label="المحقَّق (مُحصّل)" value={fmt(s.realized)} color="#059669" />
        <Stat icon={Clock} label="المتبقّي (قائم)" value={fmt(s.outstanding)} color="#D97706" />
        <Stat icon={TrendingUp} label="العائد المتوقع الإجمالي" value={fmt(s.expected_return)} color="#4F46E5" />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EF' }}>
        {(!d.positions || d.positions.length === 0) ? (
          <div className="text-center py-14">
            <Briefcase size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400">{t('لا توجد استثمارات بعد. موّل صفقة من صفحة التمويل لتبدأ محفظتك.')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs" style={{ background: '#F8FAFC' }}>
                {['الفاتورة', 'المشتري', 'المستثمَر', 'الربح المتوقع', 'التقدّم', 'الحالة'].map(h => (
                  <th key={h} className="text-right font-medium px-4 py-3">{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.positions.map(p => (
                <tr key={p.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                  <td className="px-4 py-3 font-bold text-slate-700">{p.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-600">{p.buyer_name || '-'}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{fmt(p.invested)}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: '#059669' }}>{fmt(p.expected_profit)} <span className="text-[11px] text-slate-400">({p.rate}% × {p.months})</span></td>
                  <td className="px-4 py-3 text-slate-600">{p.inst_paid}/{p.inst_total}</td>
                  <td className="px-4 py-3">
                    {p.financing_mode === 'shariah'
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#ECFDF5', color: '#0F766E' }}>{t('🌙 متوافق مع الشريعة')}</span>
                      : <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{t('نشط')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
