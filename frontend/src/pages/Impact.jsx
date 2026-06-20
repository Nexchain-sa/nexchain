import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../utils/api';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Banknote, Building2, Users, Factory, ShieldCheck, Moon, TrendingUp } from 'lucide-react';

export default function Impact() {
  const { t, dir, lang } = useLang();
  const { fmt } = useCurrency();
  const [d, setD] = useState(null);

  useEffect(() => { analyticsAPI.impact().then(r => setD(r.data.data)).catch(() => {}); }, []);

  const Hero = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E5E7EF' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl" style={{ background: color + '15' }}><Icon size={18} style={{ color }} /></div>
        <span className="text-xs font-medium text-slate-500">{t(label)}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );

  const Rate = ({ label, pct, color, sub }) => (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E5E7EF' }}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{t(label)}</span>
        <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="bg-[#F4F6FB] rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );

  if (!d) return <p className="text-center text-slate-400 py-12 font-arabic" dir={dir}>{t('جارٍ التحميل...')}</p>;

  const monthly = (d.monthly || []).map(m => ({ m: m.m, v: Math.round(m.v) }));

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center gap-2">
        <Activity size={22} style={{ color: '#4F46E5' }} />
        <h1 className="text-xl font-bold text-slate-800">{t('لوحة الأثر')}</h1>
        <span className="text-xs text-slate-400">{t('— مؤشرات حيّة للمستثمرين')}</span>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Hero icon={TrendingUp} label="إجمالي حجم المعاملات" value={fmt(d.gmv)} color="#4F46E5" />
        <Hero icon={Banknote} label="إجمالي التمويل المُموّل" value={fmt(d.financed_total)} color="#059669" />
        <Hero icon={Building2} label="منشآت مموّلة" value={d.smes_financed} color="#0D9488" />
        <Hero icon={Users} label="وظائف مدعومة" value={d.jobs_supported.toLocaleString()} color="#D97706" />
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Rate label="معدل السداد" pct={d.repayment_rate} color="#059669" sub={`${d.installments_paid}/${d.installments_total}`} />
        <Rate label="معدل اجتياز الجودة" pct={d.qa_pass_rate} color="#4F46E5" />
        <Rate label="التمويل المتوافق مع الشريعة" pct={d.shariah_pct} color="#0F766E" />
        <Hero icon={Factory} label="مصانع نشطة" value={d.factories_active} color="#7C3AED" />
      </div>

      {/* Monthly volume chart */}
      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E5E7EF' }}>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={16} style={{ color: '#4F46E5' }} /> {t('حجم المعاملات الشهري')}</h3>
        {monthly.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">{t('لا توجد بيانات بعد')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barSize={28}>
              <XAxis dataKey="m" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="v" fill="#4F46E5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Secondary breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Hero icon={ShieldCheck} label="تمويلات نشطة" value={d.active_financings} color="#4F46E5" />
        <Hero icon={Factory} label="أوامر تصنيع" value={d.mfg_orders} color="#0D9488" />
        <Hero icon={Banknote} label="مدفوعات مُفرَجة (تصنيع)" value={fmt(d.mfg_released)} color="#059669" />
        <Hero icon={Building2} label="موردون معتمدون" value={d.suppliers_enabled} color="#D97706" />
      </div>

      <div className="bg-[#EEF2FF] rounded-2xl p-4 text-xs flex items-center gap-2" style={{ color: '#3730A3' }}>
        <Moon size={14} /> {t('كل المؤشرات محسوبة آنيًا من بيانات المنصة الفعلية — جاهزة لعروض المستثمرين.')}
      </div>
    </div>
  );
}
