import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, FileText, Trophy, Banknote, Receipt,
  Users, Bell, User, LogOut, Menu, X, Crown, ShieldCheck,
  Repeat, ChevronDown, Check, ShoppingCart, Store, TrendingUp, CreditCard, Workflow, Clock
} from 'lucide-react';

const switchRoleIcon = { buyer: ShoppingCart, supplier: Store, investor: TrendingUp, admin: ShieldCheck, owner: Crown };

const navItems = {
  buyer: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'طلبات الشراء' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/installments', icon:CreditCard,       label:'الأقساط' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
  ],
  supplier: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'الفرص المتاحة' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/invoices',     icon:Receipt,          label:'فواتيري' },
    { to:'/financing',    icon:Banknote,         label:'تمويل فواتيري' },
  ],
  investor: [
    { to:'/dashboard',  icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/financing',  icon:Banknote,        label:'فرص التمويل' },
  ],
  admin: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'الطلبات' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/installments', icon:CreditCard,       label:'الأقساط' },
    { to:'/admin',        icon:Users,            label:'إدارة المستخدمين' },
  ],
  owner: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'الطلبات' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/installments', icon:CreditCard,       label:'الأقساط' },
    { to:'/admin',        icon:ShieldCheck,      label:'إدارة المنصة' },
  ],
};

const roleLabel = {
  buyer:    'مشترٍ',
  supplier: 'مورد',
  investor: 'مستثمر',
  admin:    'مدير النظام',
  owner:    'مالك المنصة',
};

const roleBadgeStyle = {
  buyer:    { bg:'#EEF2FF', color:'#4F46E5' },
  supplier: { bg:'#CCFBF1', color:'#0F766E' },
  investor: { bg:'#FFFBEB', color:'#D97706' },
  admin:    { bg:'#F5F3FF', color:'#7C3AED' },
  owner:    { bg:'#FFF1F2', color:'#BE123C' },
};

export default function Layout() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const role  = user?.role || 'buyer';
  const baseRole = user?.baseRole || role;
  const items = navItems[role] || navItems.buyer;
  const badge = roleBadgeStyle[role] || roleBadgeStyle.buyer;
  const isOwner = role === 'owner' || role === 'admin';

  const opRoles = ['buyer', 'supplier', 'investor'];
  const availableRoles = (baseRole === 'admin' || baseRole === 'owner') ? [...opRoles, baseRole] : opRoles;

  const handleLogout = () => { logout(); navigate('/login'); };

  const chooseRole = (r) => { setSwitchOpen(false); if (r === role) return; setPw(''); setPwTarget(r); };
  const confirmSwitch = async () => {
    setBusy(true);
    try {
      await authAPI.login({ email: user.email, password: pw });
      switchRole(pwTarget);
      toast.success(`تم التبديل إلى وضع ${roleLabel[pwTarget]}`);
      setPwTarget(null);
      navigate('/dashboard');
    } catch {
      toast.error('كلمة المرور غير صحيحة');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-screen font-arabic overflow-hidden" style={{ background:'#F4F6FB' }} dir="rtl">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`${open ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0 flex flex-col`}
        style={{ background:'#1E1B4B', borderLeft:'1px solid #312E81' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 h-16" style={{ borderBottom:'1px solid #312E81' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background:'#4F46E5', color:'#FFFFFF' }}>
            ⬡
          </div>
          {open && (
            <span className="font-bold text-xl tracking-widest text-white">FLOWRIZ</span>
          )}
          <button onClick={() => setOpen(!open)} className="mr-auto text-slate-400 hover:text-white transition-colors">
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>

        {/* User badge */}
        {open && (
          <div className="mx-3 my-3 p-3 rounded-xl" style={{ background:'#312E81' }}>
            <div className="flex items-center gap-2 mb-1">
              {isOwner && <Crown size={12} style={{ color:'#F59E0B' }}/>}
              <p className="text-sm font-bold text-white truncate">{user?.company_name || user?.name}</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ background: badge.bg, color: badge.color }}>
              {roleLabel[role]}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'font-bold text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`
              }
              style={({ isActive }) => isActive ? { background:'#4F46E5' } : {}}>
              <Icon size={18} className="flex-shrink-0"/>
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-0.5" style={{ borderTop:'1px solid #312E81' }}>
          <NavLink to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
            <User size={18}/>{open && 'الملف الشخصي'}
          </NavLink>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all">
            <LogOut size={18}/>{open && 'تسجيل الخروج'}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex items-center px-6 gap-4 flex-shrink-0 bg-white"
          style={{ borderBottom:'1px solid #E5E7EF' }}>
          <h1 className="font-bold text-base flex-1 text-slate-700">
            FLOWRIZ — منصة سلاسل الإمداد الذكية
          </h1>

          {/* Role switcher */}
          <div className="relative">
            <button onClick={() => setSwitchOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all hover:bg-indigo-50"
              style={{ borderColor:'#E5E7EF', color:'#4F46E5' }}>
              <Repeat size={15}/>
              <span>وضع: {roleLabel[role]}</span>
              <ChevronDown size={14}/>
            </button>
            {switchOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSwitchOpen(false)}/>
                <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl border shadow-lg z-20 p-1.5"
                  style={{ borderColor:'#E5E7EF' }}>
                  <p className="text-xs text-slate-400 px-2.5 py-1.5">تبديل الدور</p>
                  {availableRoles.map(r => {
                    const RI = switchRoleIcon[r] || ShoppingCart;
                    const active = r === role;
                    return (
                      <button key={r} onClick={() => chooseRole(r)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-slate-50 transition-all"
                        style={ active ? { color:'#4F46E5', fontWeight:700 } : { color:'#475569' } }>
                        <RI size={16}/>
                        <span className="flex-1 text-right">{roleLabel[r]}</span>
                        {active && <Check size={15}/>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <Bell size={20}/>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600"/>
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
              style={{ background:'#4F46E5' }}>
              {user?.name?.[0]}
            </div>
            <span className="text-slate-600">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background:'#F4F6FB' }}>
          {user?.review_status === 'pending' && (
            <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background:'#FEF3C7', color:'#92400E' }}>
              <Clock size={18}/>
              <span>حسابك قيد المراجعة من إدارة المنصة. بعض الإجراءات قد تكون محدودة حتى الاعتماد.</span>
            </div>
          )}
          {user?.review_status === 'rejected' && (
            <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background:'#FEE2E2', color:'#991B1B' }}>
              <X size={18}/>
              <span>تم رفض مستنداتك. يرجى مراجعة إدارة المنصة أو إعادة رفع المستندات.</span>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* Role-switch password confirmation */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(15,12,40,0.55)' }} onClick={() => !busy && setPwTarget(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Repeat size={18} style={{ color:'#4F46E5' }}/>
              <h3 className="font-bold text-lg text-slate-800">تأكيد تبديل الدور</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              للانتقال إلى وضع «<span className="font-bold" style={{ color:'#4F46E5' }}>{roleLabel[pwTarget]}</span>» أدخل كلمة مرور حسابك للتأكيد.
            </p>
            <input type="password" value={pw} autoFocus
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && pw && !busy && confirmSwitch()}
              placeholder="كلمة المرور"
              className="w-full border rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2"
              style={{ borderColor:'#E5E7EF' }}/>
            <div className="flex gap-2">
              <button onClick={confirmSwitch} disabled={busy || !pw}
                className="flex-1 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 hover:opacity-90 transition-all"
                style={{ background:'#4F46E5' }}>
                {busy ? 'جارٍ التأكيد...' : 'تأكيد التبديل'}
              </button>
              <button onClick={() => setPwTarget(null)} disabled={busy}
                className="px-4 py-2.5 rounded-xl border font-bold text-slate-600 hover:bg-slate-50 transition-all"
                style={{ borderColor:'#E5E7EF' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
