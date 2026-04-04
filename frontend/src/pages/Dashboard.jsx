import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, rfqAPI, competitionAPI } from '../utils/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Trophy, Banknote, TrendingUp, Package, Users, Plus, ArrowLeft } from 'lucide-react';

const Card = ({ label, value, sub, color='cyan', icon:Icon }) => {
  const colors = {
    cyan:  'border-[#00D4FF33] text-[#00D4FF]',
    purple:'border-[#7B2FFF33] text-[#7B2FFF]',
    green: 'border-[#00C85333] text-[#00C853]',
    orange:'border-[#FF6B3533] text-[#FF6B35]',
  };
  return (
    <div className={`bg-[#0D1B5E] border ${colors[color].split(' ')[0]} rounded-2xl p-5 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-1 h-full rounded-l" style={{background: color==='cyan'?'#00D4FF':color==='purple'?'#7B2FFF':color==='green'?'#00C853':'#FF6B35'}}/>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#90A4AE] text-xs mb-1">{label}</p>
          <p className={`text-2xl font-bold ${colors[color].split(' ')[1]}`}>{value}</p>
          {sub && <p className="text-[#00C853] text-xs mt-1">{sub}</p>}
        </div>
        {Icon && <div className={`p-2 rounded-xl bg-[#0A0F2E] ${colors[color].split(' ')[1]}`}><Icon size={20}/></div>}
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
  {name:'عمولات',value:35,color:'#00D4FF'},
  {name:'اشتراكات',value:28,color:'#7B2FFF'},
  {name:'تمويل',value:25,color:'#00C853'},
  {name:'منافسات',value:12,color:'#FF6B35'},
];

const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div className="bg-[#0D1B5E] border border-[#00D4FF33] rounded-xl p-3 text-xs">
      <p className="text-[#90A4AE] mb-1">{label}</p>
      <p className="text-[#00D4FF] font-bold">SAR {payload[0].value.toLocaleString()}</p>
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

  const roleLabel = {buyer:'مشترٍ',supplier:'مورد',investor:'مستثمر',admin:'مدير النظام'};

  return (
    <div className="space-y-6 font-arabic" dir="rtl">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            مرحباً، {user?.company_name || user?.name} 👋
          </h1>
          <p className="text-[#90A4AE] text-sm mt-1">
            {roleLabel[user?.role]} — {new Date().toLocaleDateString('ar-SA', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
        </div>
        {user?.role === 'buyer' && (
          <Link to="/rfqs/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white text-sm font-bold hover:opacity-90 transition shadow-lg shadow-cyan-500/20">
            <Plus size={16}/> طلب شراء جديد
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      {user?.role === 'buyer' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي الطلبات" value={stats.rfqs||0} icon={FileText} color="cyan" sub="طلب شراء"/>
          <Card label="قيمة المشتريات" value={`SAR ${Number(stats.orders_value||0).toLocaleString()}`} icon={Package} color="green"/>
          <Card label="الفواتير" value={stats.invoices||0} icon={Banknote} color="purple" sub="فاتورة"/>
          <Card label="طلبات التمويل" value={stats.financing||0} icon={TrendingUp} color="orange"/>
        </div>
      )}
      {user?.role === 'supplier' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="عروض مقدّمة" value={stats.quotes||0} icon={FileText} color="cyan"/>
          <Card label="عروض فائزة" value={stats.won||0} icon={Trophy} color="green"/>
          <Card label="معدل الفوز" value={`${stats.win_rate||0}%`} icon={TrendingUp} color="purple"/>
          <Card label="إجمالي المبيعات" value={`SAR ${Number(stats.total_sales||0).toLocaleString()}`} icon={Package} color="orange"/>
        </div>
      )}
      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="إجمالي المستخدمين" value={stats.users||0} icon={Users} color="cyan"/>
          <Card label="طلبات الشراء" value={stats.rfqs||0} icon={FileText} color="purple"/>
          <Card label="المنافسات" value={stats.competitions||0} icon={Trophy} color="green"/>
          <Card label="طلبات تمويل" value={stats.financing_requests||0} icon={Banknote} color="orange"/>
        </div>
      )}
      {user?.role === 'investor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card label="فرص تمويل متاحة" value="12" icon={Banknote} color="cyan"/>
          <Card label="عائدي المتوقع" value="15.4%" icon={TrendingUp} color="green"/>
          <Card label="محفظتي الاستثمارية" value="SAR 0" icon={Package} color="purple"/>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">نمو الإيرادات الشهرية (SAR)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="m" tick={{fill:'#90A4AE',fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="rev" fill="url(#barGrad)" radius={[6,6,0,0]}/>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF"/>
                  <stop offset="100%" stopColor="#7B2FFF"/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">توزيع الإيرادات</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip formatter={(v)=>`${v}%`} contentStyle={{background:'#0D1B5E',border:'1px solid #00D4FF33',borderRadius:'8px',color:'#E8EAF6'}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d=>(
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:d.color}}/>
                <span className="text-[#90A4AE] flex-1">{d.name}</span>
                <span className="font-bold" style={{color:d.color}}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent RFQs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#00D4FF11]">
            <h3 className="font-bold text-white">آخر طلبات الشراء</h3>
            <Link to="/rfqs" className="text-[#00D4FF] text-xs flex items-center gap-1 hover:underline">
              عرض الكل <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y divide-[#00D4FF0a]">
            {rfqs.length === 0 && (
              <p className="text-[#90A4AE] text-sm text-center py-8">لا توجد طلبات بعد</p>
            )}
            {rfqs.map(r=>(
              <Link key={r.id} to={`/rfqs/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#0A0F2E] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#00D4FF15] flex items-center justify-center text-[#00D4FF] flex-shrink-0">
                  <FileText size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.title}</p>
                  <p className="text-xs text-[#90A4AE]">{r.rfq_number} · {r.quote_count||0} عروض</p>
                </div>
                <StatusBadge status={r.status}/>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#00D4FF11]">
            <h3 className="font-bold text-white">المنافسات المفتوحة</h3>
            <Link to="/competitions" className="text-[#7B2FFF] text-xs flex items-center gap-1 hover:underline">
              عرض الكل <ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="divide-y divide-[#00D4FF0a]">
            {comps.length === 0 && (
              <p className="text-[#90A4AE] text-sm text-center py-8">لا توجد منافسات مفتوحة</p>
            )}
            {comps.map(c=>(
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#0A0F2E] transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-[#7B2FFF15] flex items-center justify-center text-[#7B2FFF] flex-shrink-0">
                  <Trophy size={14}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  <p className="text-xs text-[#90A4AE]">{c.comp_number} · {c.bid_count||0} عروض</p>
                </div>
                <p className="text-[#00C853] text-xs font-bold flex-shrink-0">
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
    open:      ['مفتوح','#00D4FF','#00D4FF15'],
    closed:    ['مغلق','#90A4AE','#90A4AE15'],
    awarded:   ['مُرسى','#00C853','#00C85315'],
    cancelled: ['ملغى','#ef4444','#ef444415'],
    pending:   ['معلّق','#FF6B35','#FF6B3515'],
    submitted: ['مقدّم','#7B2FFF','#7B2FFF15'],
    financed:  ['ممول','#00C853','#00C85315'],
  };
  const [label,color,bg] = map[status] || ['—','#90A4AE','#90A4AE15'];
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
      style={{color,background:bg}}>{label}</span>
  );
}
