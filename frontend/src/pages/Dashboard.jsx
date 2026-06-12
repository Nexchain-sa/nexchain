import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, rfqAPI, competitionAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Trophy, Banknote, TrendingUp, Package, Users, Plus, ArrowLeft } from 'lucide-react';

const Card = ({ label, value, sub, color='blue', icon:Icon }) => {
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
          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color: p.text }}>{value}</p>
          {sub && <p className="text-xs mt-1 text-emerald-600 font-medium">{sub}</p>}
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

const revenueData = [
  {m:'يناير',rev:125000},{m:'فبراير',rev:180000},{m:'مارس',rev:220000},
  {m:'أبريل',rev:195000},{m:'مايو',rev:310000},{m:'يونيو',rev:285000},
  {m:'يوليو',rev:390000},
];
const pieData = [
  {name:'عمولات',  value:35, color:'#4F46E5'},
  {name:'اشتراكات',value:28, color:'#0D9488'},
  {name:'تمويل',   value:25, color:'#059669'},
  {name:'منافسات', value:12, color:'#D97706'},
];

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
  const [stats, setStats] = useState(null);
  const [rfqs,  setRfqs]  = useState([]);
  const [comps, setComps] = useState([]);

  useEffect(() => {
    dashboardAPI.stats().then(r => setStats(r.data.data)).catch(()=>{});
    rfqAPI.list({limit:5}).then(r => setRfqs(r.data.data || [])).catch(()=>{});
    competitionAPI.list({limit:4}).then(r => setComps(r.data.data || [])).catch(()=>{});
  }, []);

  const roleLabel = {
    buyer:'مشترٍ', supplier:'مورد', investor:'مستثمر',
    admin:'مدير النظام', owner:'مالك المنصة',
  };

  return (
    <div className="space-y-6 font-arabic" dir="rtl">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            مرحباً، {user?.company_name || user?.name}
          </h1>
          <p className="text-sm mt-1 text-slate-500">
            {roleLabel[user?.role]} — {new Date().toLocaleDateString('ar-SA', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
        </div>
        {user?.role === 'buyer' && (
          <Link to="/rfqs/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition"
            style={{ background:'#4F46E5' }}>
            <Plus size={16}/> طلب شراء جديد
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      {user?.role === 'buyer' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي الطلبات"  value={stats.rfqs||0}        icon={FileText}   color="sky"    sub="طلب شراء"/>
          <Card label="قيمة المشتريات"  value={`SAR ${Number(stats.orders_value||0).toLocaleString()}`} icon={Package} color="green"/>
          <Card label="الفواتير"         value={stats.invoices||0}    icon={Banknote}   color="blue"  sub="فاتورة"/>
          <Card label="طلبات التمويل"    value={stats.financing||0}   icon={TrendingUp} color="amber"/>
        </div>
      )}
      {user?.role === 'supplier' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="عروض مقدّمة"     value={stats.quotes||0}      icon={FileText}   color="sky"/>
          <Card label="عروض فائزة"      value={stats.won||0}          icon={Trophy}     color="green"/>
          <Card label="معدل الفوز"       value={`${stats.win_rate||0}%`} icon={TrendingUp} color="blue"/>
          <Card label="إجمالي المبيعات" value={`SAR ${Number(stats.total_sales||0).toLocaleString()}`} icon={Package} color="amber"/>
        </div>
      )}
      {(user?.role === 'admin' || user?.role === 'owner') && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي المستخدمين" value={stats.users||0}               icon={Users}     color="sky"/>
          <Card label="طلبات الشراء"       value={stats.rfqs||0}                icon={FileText}  color="blue"/>
          <Card label="المنافسات"           value={stats.competitions||0}        icon={Trophy}    color="green"/>
          <Card label="طلبات تمويل"        value={stats.financing_requests||0}  icon={Banknote}  color="amber"/>
        </div>
      )}
      {user?.role === 'investor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card label="فرص تمويل متاحة"   value="12"      icon={Banknote}   color="sky"/>
          <Card label="عائدي المتوقع"      value="15.4%"   icon={TrendingUp} color="green"/>
          <Card label="محفظتي الاستثمارية" value="SAR 0"  icon={Package}    color="blue"/>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">نمو الإيرادات الشهرية (SAR)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="m" tick={{fill:'#94A3B8',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="rev" fill="#4F46E5" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">توزيع الإيرادات</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip formatter={(v)=>`${v}%`}
                contentStyle={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#1E293B'}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d=>(
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:d.color}}/>
                <span className="flex-1 text-slate-500">{d.name}</span>
                <span className="font-bold" style={{color:d.color}}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent RFQs & Competitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">آخر طلبات الشراء</h3>
            <Link to="/rfqs" className="text-xs flex items-center gap-1 text-indigo-600 hover:underline">
              عرض الكل <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {rfqs.length === 0 && (
              <p className="text-sm text-center py-8 text-slate-400">لا توجد طلبات بعد</p>
            )}
            {rfqs.map(r=>(
              <Link key={r.id} to={`/rfqs/${r.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <FileText size={14} className="text-indigo-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.rfq_number} · {r.quote_count||0} عروض</p>
                </div>
                <StatusBadge status={r.status}/>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">المنافسات المفتوحة</h3>
            <Link to="/competitions" className="text-xs flex items-center gap-1 text-indigo-600 hover:underline">
              عرض الكل <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {comps.length === 0 && (
              <p className="text-sm text-center py-8 text-slate-400">لا توجد منافسات مفتوحة</p>
            )}
            {comps.map(c=>(
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50">
                  <Trophy size={14} className="text-amber-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.comp_number} · {c.bid_count||0} عروض</p>
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
      style={{color, background:bg}}>{label}</span>
  );
}
