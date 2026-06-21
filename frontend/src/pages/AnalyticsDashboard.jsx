import React, { useState, useEffect, useMemo } from 'react';
import { analyticsAPI } from '../utils/api';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart,
} from 'recharts';
import {
  BarChart3, TrendingUp, Factory, Banknote, Users, ShieldCheck, AlertTriangle, Star, RefreshCw, Calendar,
} from 'lucide-react';

const fmtDate = (d) => d.toISOString().slice(0, 10);
const PRESETS = [['7', '٧ أيام'], ['30', '٣٠ يوم'], ['90', '٩٠ يوم'], ['365', 'سنة'], ['custom', 'مخصّص']];
const PIE = ['#4F46E5', '#059669', '#D97706', '#7C3AED', '#0D9488', '#DC2626'];
const STATUS_LABEL = { pending_match: 'بانتظار عروض', in_production: 'قيد الإنتاج', completed: 'مكتمل', cancelled: 'ملغى' };

export default function AnalyticsDashboard() {
  const { t, dir } = useLang();
  const { fmt } = useCurrency();
  const [preset, setPreset] = useState('90');
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(fmtDate(new Date(Date.now() - 90 * 864e5)));
  const [to, setTo] = useState(fmtDate(today));
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  const choosePreset = (p) => {
    setPreset(p);
    if (p !== 'custom') {
      const days = Number(p);
      setFrom(fmtDate(new Date(Date.now() - days * 864e5)));
      setTo(fmtDate(new Date()));
    }
  };

  const fetchData = () => {
    setLoading(true);
    analyticsAPI.dashboard({ from, to }).then(r => { setD(r.data.data); setLoading(false); }).catch(() => { setD(null); setLoading(false); });
  };
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [from, to]);

  const k = d?.kpi || {};
  const tip = { contentStyle: { borderRadius: 12, border: '1px solid #E5E7EF', fontSize: 12, fontFamily: 'inherit' }, formatter: (v) => fmt(v) };

  const Stat = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#E5E7EF' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: color + '15' }}><Icon size={16} style={{ color }} /></div>
        <span className="text-[11px] font-medium text-slate-500">{t(label)}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );

  const orderStatusData = (d?.order_status || []).map(x => ({ name: t(STATUS_LABEL[x.status] || x.status), value: x.n }));
  const modeData = (d?.financing_modes || []).map(x => ({ name: t(x.mode === 'shariah' ? '🌙 متوافق' : 'تقليدي'), value: x.v }));
  const catData = (d?.categories || []).map(x => ({ name: x.category, value: x.v }));

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} style={{ color: '#4F46E5' }} />
          <h1 className="text-xl font-bold text-slate-800">{t('لوحة التحليلات')}</h1>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border hover:bg-slate-50" style={{ borderColor: '#E5E7EF', color: '#475569' }}>
          <RefreshCw size={14} /> {t('تحديث')}
        </button>
      </div>

      {/* فلتر احترافي */}
      <div className="bg-white rounded-2xl border p-3 flex items-center gap-2 flex-wrap" style={{ borderColor: '#E5E7EF' }}>
        <Calendar size={16} className="text-slate-400" />
        {PRESETS.map(([p, label]) => (
          <button key={p} onClick={() => choosePreset(p)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={preset === p ? { background: '#4F46E5', color: '#fff' } : { background: '#F1F5F9', color: '#475569' }}>
            {t(label)}
          </button>
        ))}
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} className="rounded-lg px-2 py-1.5 text-xs border" style={{ borderColor: '#E5E7EF' }} />
            <span className="text-slate-400 text-xs">→</span>
            <input type="date" value={to} min={from} max={fmtDate(today)} onChange={e => setTo(e.target.value)} className="rounded-lg px-2 py-1.5 text-xs border" style={{ borderColor: '#E5E7EF' }} />
          </div>
        )}
        <span className="text-[11px] text-slate-400 mr-auto">{from} → {to}</span>
      </div>

      {loading ? <p className="text-center text-slate-400 py-12">{t('جارٍ التحميل...')}</p> : !d ? <p className="text-center text-slate-400 py-12">{t('لا توجد بيانات')}</p> : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Stat icon={TrendingUp} label="إجمالي التداول GMV" value={fmt(k.gmv)} color="#4F46E5" />
            <Stat icon={Banknote} label="التمويل المموَّل" value={fmt(k.financed_total)} color="#059669" sub={`${k.financings_n || 0} ${t('صفقة')} · ${k.smes || 0} ${t('منشأة')}`} />
            <Stat icon={Factory} label="قيمة التصنيع" value={fmt(k.mfg_value)} color="#7C3AED" sub={`${k.mfg_orders || 0} ${t('أمر')} · ${t('مُفرَج')} ${fmt(k.mfg_released)}`} />
            <Stat icon={Users} label="مستخدمون جدد" value={k.new_users || 0} color="#0D9488" sub={`${k.new_buyers || 0} ${t('مشترٍ')} · ${k.new_suppliers || 0} ${t('مورد')}`} />
            <Stat icon={ShieldCheck} label="معدل السداد" value={`${k.repayment_rate || 0}%`} color="#059669" />
            <Stat icon={ShieldCheck} label="اجتياز الجودة" value={`${k.qa_pass_rate || 0}%`} color="#4F46E5" />
            <Stat icon={AlertTriangle} label="نزاعات مفتوحة" value={k.disputes_open || 0} color="#DC2626" sub={`${k.disputes_resolved || 0} ${t('محسوم')}`} />
            <Stat icon={Star} label="متوسط التقييم" value={`${k.avg_rating || 0} ★`} color="#D97706" sub={`${k.reviews_n || 0} ${t('مراجعة')}`} />
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E5E7EF' }}>
            <h2 className="font-bold text-slate-700 mb-3 text-sm">{t('الاتجاه الشهري')}</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={d.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} reversed={dir === 'rtl'} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={48} orientation={dir === 'rtl' ? 'right' : 'left'} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar name={t('الفواتير')} dataKey="invoices" fill="#4F46E5" radius={[5, 5, 0, 0]} barSize={18} />
                <Bar name={t('التصنيع')} dataKey="manufacturing" fill="#7C3AED" radius={[5, 5, 0, 0]} barSize={18} />
                <Line name={t('التمويل')} dataKey="financing" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E5E7EF' }}>
              <h2 className="font-bold text-slate-700 mb-2 text-sm">{t('أوامر التصنيع حسب الحالة')}</h2>
              {orderStatusData.length === 0 ? <p className="text-center text-slate-300 py-12 text-sm">{t('لا بيانات')}</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderStatusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {orderStatusData.map((e, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tip.contentStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E5E7EF' }}>
              <h2 className="font-bold text-slate-700 mb-2 text-sm">{t('التمويل حسب النوع')}</h2>
              {modeData.length === 0 ? <p className="text-center text-slate-300 py-12 text-sm">{t('لا بيانات')}</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={modeData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {modeData.map((e, i) => <Cell key={i} fill={[ '#0D9488', '#4F46E5'][i % 2]} />)}
                    </Pie>
                    <Tooltip contentStyle={tip.contentStyle} formatter={tip.formatter} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E5E7EF' }}>
              <h2 className="font-bold text-slate-700 mb-2 text-sm">{t('التصنيع حسب الفئة')}</h2>
              {catData.length === 0 ? <p className="text-center text-slate-300 py-12 text-sm">{t('لا بيانات')}</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={catData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={80} orientation={dir === 'rtl' ? 'right' : 'left'} />
                    <Tooltip {...tip} cursor={{ fill: '#F8FAFC' }} />
                    <Bar dataKey="value" fill="#7C3AED" radius={[0, 5, 5, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top factories */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EF' }}>
            <h2 className="font-bold text-slate-700 px-4 py-3 text-sm border-b" style={{ borderColor: '#F1F5F9' }}>{t('أفضل المصانع')}</h2>
            {(d.top_factories || []).length === 0 ? <p className="text-center text-slate-300 py-10 text-sm">{t('لا بيانات')}</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 text-xs" style={{ background: '#F8FAFC' }}>
                  {['المصنع', 'الأوامر', 'القيمة', 'المُفرَج', 'التقييم'].map(h => <th key={h} className="text-right font-medium px-4 py-2.5">{t(h)}</th>)}
                </tr></thead>
                <tbody>
                  {d.top_factories.map((f, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                      <td className="px-4 py-2.5 font-bold text-slate-700">{f.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{f.orders}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">{fmt(f.value)}</td>
                      <td className="px-4 py-2.5" style={{ color: '#059669' }}>{fmt(f.released)}</td>
                      <td className="px-4 py-2.5" style={{ color: '#D97706' }}>{f.rating} ★ <span className="text-[11px] text-slate-400">({f.reviews})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
