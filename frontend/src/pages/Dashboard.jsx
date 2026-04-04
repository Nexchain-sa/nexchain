import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, rfqAPI, competitionAPI } from '../utils/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Trophy, Banknote, TrendingUp, Package, Users, Plus, ArrowLeft } from 'lucide-react';

const Card = ({ label, value, sub, color='violet', icon:Icon }) => {
  const palette = {
    violet:  { border:'#6C63FF33', text:'#6C63FF', bar:'#6C63FF' },
    cyan:    { border:'#00F5FF33', text:'#00F5FF', bar:'#00F5FF' },
    magenta: { border:'#FF6BFF33', text:'#FF6BFF', bar:'#FF6BFF' },
    emerald: { border:'#00E5A033', text:'#00E5A0', bar:'#00E5A0' },
    gold:    { border:'#FFB80033', text:'#FFB800', bar:'#FFB800' },
  };
  const p = palette[color] || palette.violet;
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: '#0E0F1E', border: `1px solid ${p.border}` }}>
      <div className="absolute top-0 right-0 w-1 h-full rounded-l" style={{ background: p.bar }}/>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: '#8892B0' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: p.text }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: '#00E5A0' }}>{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-xl" style={{ background: '#13142A', color: p.text }}>
            <Icon size={20}/>
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
  {name:'عمولات',  value:35, color:'#6C63FF'},
  {name:'اشتراكات',value:28, color:'#00F5FF'},
  {name:'تمويل',   value:25, color:'#00E5A0'},
  {name:'منافسات', value:12, color:'#FFB800'},
];

const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs"
      style={{ background:'#0E0F1E', border:'1px solid #6C63FF33' }}>
      <p style={{ color:'#8892B0' }} className="mb-1">{label}</p>
      <p className="font-bold" style={{ color:'#00F5FF' }}>SAR {payload[0].value.toLocaleString()}</p>
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
          <h1 className="text-2xl font-bold text-white">
            مرحباً، {user?.company_name || user?.name} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color:'#8892B0' }}>
            {roleLabel[user?.role]} — {new Date().toLocaleDateString('ar-SA', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
        </div>
        {user?.role === 'buyer' && (
          <Link to="/rfqs/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition"
            style={{ background:'linear-gradient(to left, #6C63FF, #00F5FF)', boxShadow:'0 0 20px #6C63FF33' }}>
            <Plus size={16}/> طلب شراء جديد
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      {user?.role === 'buyer' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي الطلبات"  value={stats.rfqs||0}        icon={FileText}   color="cyan"    sub="طلب شراء"/>
          <Card label="قيمة المشتريات"  value={`SAR ${Number(stats.orders_value||0).toLocaleString()}`} icon={Package} color="emerald"/>
          <Card label="الفواتير"         value={stats.invoices||0}    icon={Banknote}   color="violet"  sub="فاتورة"/>
          <Card label="طلبات التمويل"    value={stats.financing||0}   icon={TrendingUp} color="gold"/>
        </div>
      )}
      {user?.role === 'supplier' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="عروض مقدّمة"     value={stats.quotes||0}      icon={FileText}   color="cyan"/>
          <Card label="عروض فائزة"      value={stats.won||0}          icon={Trophy}     color="emerald"/>
          <Card label="معدل الفوز"       value={`${stats.win_rate||0}%`} icon={TrendingUp} color="violet"/>
          <Card label="إجمالي المبيعات" value={`SAR ${Number(stats.total_sales||0).toLocaleString()}`} icon={Package} color="gold"/>
        </div>
      )}
      {(user?.role === 'admin' || user?.role === 'owner') && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي المستخدمين" value={stats.users||0}               icon={Users}     color="cyan"/>
          <Card label="طلبات الشراء"       value={stats.rfqs||0}                icon={FileText}  color="violet"/>
          <Card label="المنافسات"           value={stats.competitions||0}        icon={Trophy}    color="emerald"/>
          <Card label="طلبات تمويل"        value={stats.financing_requests||0}  icon={Banknote}  color="gold"/>
        </div>
      )}
      {user?.role === 'investor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card label="فرص تمويل متاحة"   value="12"      icon={Banknote}   color="cyan"/>
          <Card label="عائدي المتوقع"      value="15.4%"   icon={TrendingUp} color="emerald"/>
          <Card label="محفظتي الاستثمارية" value="SAR 0"  icon={Package}    color="violet"/>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background:'#0E0F1E', border:'1px solid #6C63FF22' }}>
          <h3 className="font-bold text-white mb-4">نمو الإيرادات الشهرية (SAR)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="m" tick={{fill:'#8892B0',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="rev" fill="url(#barGrad)" radius={[6,6,0,0]}/>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF"/>
                  <stop offset="100%" stopColor="#00F5FF"/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl p-5"
          style={{ background:'#0E0F1E', border:'1px solid #6C63FF22' }}>
          <h3 className="font-bold text-white mb-4">توزيع الإيرادات</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip formatter={(v)=>`${v}%`}
                contentStyle={{background:'#0E0F1E',border:'1px solid #6C63FF33',borderRadius:'8px',color:'#E8EAF6'}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d=>(
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:d.color}}/>
                <span className="flex-1" style={{color:'#8892B0'}}>{d.name}</span>
                <span className="font-bold" style={{color:d.color}}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent RFQs & Competitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl overflow-hidden"
          style={{ background:'#0E0F1E', border:'1px solid #6C63FF22' }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom:'1px solid #6C63FF11' }}>
            <h3 className="font-bold text-white">آخر طلبات الشراء</h3>
            <Link to="/rfqs" className="text-xs flex items-center gap-1 hover:underline"
              style={{ color:'#6C63FF' }}>
              عرض الكل <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor:'#6C63FF0a' }}>
            {rfqs.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color:'#8892B0' }}>لا توجد طلبات بعد</p>
            )}
            {rfqs.map(r=>(
              <Link key={r.id} to={`/rfqs/${r.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors"
                style={{ borderColor:'#6C63FF0a' }}
                onMouseEnter={e=>e.currentTarget.style.background='#13142A'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background:'#6C63FF15', color:'#6C63FF' }}>
                  <FileText size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.title}</p>
                  <p className="text-xs" style={{ color:'#8892B0' }}>{r.rfq_number} · {r.quote_count||0} عروض</p>
                </div>
                <StatusBadge status={r.status}/>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background:'#0E0F1E', border:'1px solid #6C63FF22' }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom:'1px solid #6C63FF11' }}>
            <h3 className="font-bold text-white">المنافسات المفتوحة</h3>
            <Link to="/competitions" className="text-xs flex items-center gap-1 hover:underline"
              style={{ color:'#FF6BFF' }}>
              عرض الكل <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor:'#6C63FF0a' }}>
            {comps.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color:'#8892B0' }}>لا توجد منافسات مفتوحة</p>
            )}
            {comps.map(c=>(
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer"
                onMouseEnter={e=>e.currentTarget.style.background='#13142A'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background:'#FF6BFF15', color:'#FF6BFF' }}>
                  <Trophy size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  <p className="text-xs" style={{ color:'#8892B0' }}>{c.comp_number} · {c.bid_count||0} عروض</p>
                </div>
                <p className="text-xs font-bold flex-shrink-0" style={{ color:'#00E5A0' }}>
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
    open:      ['مفتوح', '#00F5FF', '#00F5FF15'],
    closed:    ['مغلق',  '#8892B0', '#8892B015'],
    awarded:   ['مُرسى', '#00E5A0', '#00E5A015'],
    cancelled: ['ملغى',  '#ef4444', '#ef444415'],
    pending:   ['معلّق', '#FFB800', '#FFB80015'],
    submitted: ['مقدّم', '#6C63FF', '#6C63FF15'],
    financed:  ['ممول',  '#00E5A0', '#00E5A015'],
  };
  const [label,color,bg] = map[status] || ['—','#8892B0','#8892B015'];
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
      style={{color, background:bg}}>{label}</span>
  );
}
