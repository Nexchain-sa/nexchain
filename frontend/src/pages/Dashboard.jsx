import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { dashboardAPI, rfqAPI, competitionAPI, analyticsAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Trophy, Banknote, TrendingUp, Package, Users, Plus, ArrowLeft, Factory, AlertTriangle, Briefcase } from 'lucide-react';

const Card = ({ label, value, sub, color='blue', icon:Icon }) => {
  const { t } = useLang();
  const palette = {
    blue:   { border:'#E0E7FF', icon:'#EEF2FF', text:'#4F46E5', dot:'#4F46E5' },
    green:  { border:'#D1FAE5', icon:'#ECFDF5', text:'#059669', dot:'#059669' },
    amber:  { border:'#FEF3C7', icon:'#FFFBEB', text:'#D97706', dot:'#D97706' },
    purple: { border:'#EDE9FE', icon:'#F5F3FF', text:'#7C3AED', dot:'#7C3AED' },
    sky:    { border:'#CCFBF1', icon:'#F0FDFA', text:'#0D9488', dot:'#0D9488' },
  };
  const p = palette[color] || palette.blue;
  return (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: p.border }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{t(label)}</p>
          <p className="text-2xl font-bold" style={{ color: p.text }}>{value}</p>
          {sub && <p className="text-xs mt-1 text-emerald-600 font-medium">{t(sub)}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl" style={{ background: p.icon }}>
            <Icon size={20} style={{ color: p.text }}/>
          </div>
        )}
      </div>
    </div>
  );
};

const PIE_COLORS = ['#4F46E5', '#0D9488', '#059669', '#D97706', '#7C3AED', '#DC2626'];

const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 text-xs border border-slate-200 shadow-sm">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-bold text-indigo-700">SAR {payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, dir, lang } = useLang();
  const { fmt } = useCurrency();
  const [stats, setStats] = useState(null);
  const [rfqs,  setRfqs]  = useState([]);
  const [comps, setComps] = useState([]);
  const [ana,   setAna]   = useState(null);
  const isMgmt = user?.role === 'admin' || user?.role === 'owner';

  useEffect(() => {
    dashboardAPI.stats().then(r => setStats(r.data.data)).catch(()=>{});
    rfqAPI.list({limit:5}).then(r => setRfqs(r.data.data || [])).catch(()=>{});
    competitionAPI.list({limit:4}).then(r => setComps(r.data.data || [])).catch(()=>{});
    if (isMgmt) analyticsAPI.dashboard().then(r => setAna(r.data.data)).catch(()=>{});
  }, [isMgmt]);

  const revenueData = (ana?.monthly || []).map(m => ({ m: m.label, rev: (m.invoices || 0) + (m.manufacturing || 0) }));
  const pieData = (ana?.financing_modes || []).map((x, i) => ({ name: x.mode === 'shariah' ? '🌙 متوافق' : 'تقليدي', value: x.v, color: PIE_COLORS[i % PIE_COLORS.length] }));

  const roleLabel = {
    buyer:'مشترٍ', supplier:'مورد', investor:'مستثمر',
    admin:'مدير النظام', owner:'مالك المنصة',
  };

  return (
    <div className="space-y-6 font-arabic" dir={dir}>
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t('مرحباً،')} {user?.company_name || user?.name}
          </h1>
          <p className="text-sm mt-1 text-slate-500">
            {t(roleLabel[user?.role])} — {new Date().toLocaleDateString(lang==='ar'?'ar-SA':'en-US', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
        </div>
        {user?.role === 'buyer' && (
          <Link to="/rfqs/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition"
            style={{ background:'#4F46E5' }}>
            <Plus size={16}/> {t('طلب شراء جديد')}
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      {user?.role === 'buyer' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي الطلبات"  value={stats.rfqs||0}        icon={FileText}   color="sky"    sub="طلب شراء"/>
          <Card label="قيمة المشتريات"  value={fmt(stats.orders_value||0)} icon={Package} color="green"/>
          <Card label="أوامر التصنيع"    value={stats.mfg_orders||0}  icon={Factory}    color="purple"/>
          <Card label="طلبات التمويل"    value={stats.financing||0}   icon={TrendingUp} color="amber"/>
          {stats.open_disputes > 0 && <Card label="نزاعات مفتوحة" value={stats.open_disputes} icon={AlertTriangle} color="amber"/>}
        </div>
      )}
      {user?.role === 'supplier' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="عروض مقدّمة"     value={stats.quotes||0}      icon={FileText}   color="sky"/>
          <Card label="معدل الفوز"       value={`${stats.win_rate||0}%`} icon={TrendingUp} color="green"/>
          <Card label="أوامر التصنيع"    value={stats.factory_orders||0} icon={Factory} color="purple"/>
          <Card label="مبالغ مُفرَجة"    value={fmt(stats.released||0)} icon={Banknote}  color="amber"/>
          <Card label="طلبات مفتوحة للعروض" value={stats.open_market||0} icon={Trophy} color="blue"/>
          <Card label="تقييمي"           value={`${stats.rating||0} ★`} icon={Package} color="green" sub={`${stats.rating_count||0} مراجعة`}/>
        </div>
      )}
      {(user?.role === 'admin' || user?.role === 'owner') && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي المستخدمين" value={stats.users||0}               icon={Users}     color="sky" sub={stats.pending_approvals?`${stats.pending_approvals} بانتظار الاعتماد`:undefined}/>
          <Card label="إجمالي التداول GMV" value={fmt(stats.gmv||0)}           icon={TrendingUp} color="green"/>
          <Card label="أوامر التصنيع"       value={stats.mfg_orders||0}          icon={Factory}   color="purple"/>
          <Card label="حجم التمويل"         value={fmt(stats.financing_volume||0)} icon={Banknote} color="amber"/>
          {stats.disputes_open > 0 && <Card label="نزاعات مفتوحة" value={stats.disputes_open} icon={AlertTriangle} color="amber"/>}
        </div>
      )}
      {user?.role === 'investor' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="مراكز نشطة"        value={stats.positions||0}   icon={Briefcase}  color="sky"/>
          <Card label="إجمالي المستثمَر"   value={fmt(stats.invested||0)} icon={Banknote} color="blue"/>
          <Card label="المحقَّق (مُحصّل)"   value={fmt(stats.realized||0)} icon={TrendingUp} color="green"/>
          <Card label="معروض للبيع"        value={stats.listed||0}      icon={Package}    color="amber"/>
        </div>
      )}

      {/* Charts row — management only (real analytics) */}
      {isMgmt && revenueData.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">{t('الاتجاه الشهري — الفواتير والتصنيع')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="m" tick={{fill:'#94A3B8',fontSize:11}} axisLine={false} tickLine={false} reversed={dir==='rtl'}/>
              <YAxis hide/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="rev" fill="#4F46E5" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">{t('التمويل حسب النوع')}</h3>
          {pieData.length === 0 ? <p className="text-center text-slate-300 py-12 text-sm">{t('لا بيانات')}</p> : (<>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip formatter={(v)=>fmt(v)}
                contentStyle={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#1E293B'}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d=>(
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:d.color}}/>
                <span className="flex-1 text-slate-500">{t(d.name)}</span>
                <span className="font-bold" style={{color:d.color}}>{fmt(d.value)}</span>
              </div>
            ))}
          </div></>)}
        </div>
      </div>
      )}

      {/* Recent RFQs & Competitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">{t('آخر طلبات الشراء')}</h3>
            <Link to="/rfqs" className="text-xs flex items-center gap-1 text-indigo-600 hover:underline">
              {t('عرض الكل')} <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {rfqs.length === 0 && (
              <p className="text-sm text-center py-8 text-slate-400">{t('لا توجد طلبات بعد')}</p>
            )}
            {rfqs.map(r=>(
              <Link key={r.id} to={`/rfqs/${r.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <FileText size={14} className="text-indigo-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.rfq_number} · {r.quote_count||0} {t('عروض')}</p>
                </div>
                <StatusBadge status={r.status}/>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">{t('المنافسات المفتوحة')}</h3>
            <Link to="/competitions" className="text-xs flex items-center gap-1 text-indigo-600 hover:underline">
              {t('عرض الكل')} <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {comps.length === 0 && (
              <p className="text-sm text-center py-8 text-slate-400">{t('لا توجد منافسات مفتوحة')}</p>
            )}
            {comps.map(c=>(
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50">
                  <Trophy size={14} className="text-amber-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.comp_number} · {c.bid_count||0} {t('عروض')}</p>
                </div>
                <p className="text-xs font-bold flex-shrink-0 text-emerald-600">
                  {c.budget ? `SAR ${Number(c.budget).toLocaleString()}` : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({status}) {
  const { t } = useLang();
  const map = {
    open:      ['مفتوح', '#0D9488', '#CCFBF1'],
    closed:    ['مغلق',  '#64748B', '#F1F5F9'],
    awarded:   ['مُرسى', '#059669', '#ECFDF5'],
    cancelled: ['ملغى',  '#DC2626', '#FEF2F2'],
    pending:   ['معلّق', '#D97706', '#FEF3C7'],
    submitted: ['مقدّم', '#4F46E5', '#EEF2FF'],
    financed:  ['ممول',  '#059669', '#ECFDF5'],
  };
  const [label,color,bg] = map[status] || ['—','#64748B','#F1F5F9'];
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
      style={{color, background:bg}}>{t(label)}</span>
  );
}
