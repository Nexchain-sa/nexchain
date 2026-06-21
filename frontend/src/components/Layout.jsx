import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, dashboardAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  LayoutDashboard, FileText, Trophy, Banknote, Receipt,
  Users, Bell, User, LogOut, Menu, X, Crown, ShieldCheck,
  Repeat, ChevronDown, Check, ShoppingCart, Store, TrendingUp, CreditCard, Workflow, Clock, Globe, FileSignature, Factory, Activity, Briefcase
} from 'lucide-react';

const switchRoleIcon = { buyer: ShoppingCart, supplier: Store, investor: TrendingUp, admin: ShieldCheck, owner: Crown };

const navItems = {
  buyer: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'طلبات الشراء' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/manufacturing',icon:Factory,         label:'التصنيع' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/installments', icon:CreditCard,       label:'الأقساط' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
    { to:'/agreements',   icon:FileSignature,    label:'العقود' },
  ],
  supplier: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'الفرص المتاحة' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/manufacturing',icon:Factory,         label:'التصنيع' },
    { to:'/invoices',     icon:Receipt,          label:'فواتيري' },
    { to:'/financing',    icon:Banknote,         label:'تمويل فواتيري' },
  ],
  investor: [
    { to:'/dashboard',  icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/financing',  icon:Banknote,        label:'فرص التمويل' },
    { to:'/portfolio',  icon:Briefcase,       label:'محفظتي' },
    { to:'/secondary',  icon:Repeat,          label:'السوق الثانوي' },
    { to:'/agreements', icon:FileSignature,   label:'العقود' },
    { to:'/impact',     icon:Activity,        label:'الأثر' },
  ],
  admin: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'الطلبات' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/manufacturing',icon:Factory,         label:'التصنيع' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
    { to:'/agreements',   icon:FileSignature,    label:'العقود' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/installments', icon:CreditCard,       label:'الأقساط' },
    { to:'/portfolio',    icon:Briefcase,        label:'محفظتي' },
    { to:'/secondary',    icon:Repeat,           label:'السوق الثانوي' },
    { to:'/impact',       icon:Activity,         label:'الأثر' },
    { to:'/admin',        icon:Users,            label:'إدارة المستخدمين' },
  ],
  owner: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/deals',        icon:Workflow,         label:'الصفقات' },
    { to:'/rfqs',         icon:FileText,        label:'الطلبات' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/manufacturing',icon:Factory,         label:'التصنيع' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
    { to:'/agreements',   icon:FileSignature,    label:'العقود' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/installments', icon:CreditCard,       label:'الأقساط' },
    { to:'/portfolio',    icon:Briefcase,        label:'محفظتي' },
    { to:'/secondary',    icon:Repeat,           label:'السوق الثانوي' },
    { to:'/impact',       icon:Activity,         label:'الأثر' },
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
  const { t, dir, lang, toggle } = useLang();
  const { currency, setCurrency, currencies } = useCurrency();
  const [open, setOpen] = useState(true);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState(null);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const loadNotifs = () => dashboardAPI.notifications().then(r => setNotifs(r.data.data || [])).catch(() => {});
  useEffect(() => { loadNotifs(); const id = setInterval(loadNotifs, 60000); return () => clearInterval(id); }, [user?.id]);
  const unread = notifs.filter(n => !n.is_read).length;
  const openNotifs = () => {
    setNotifOpen(o => !o);
    if (!notifOpen && unread > 0) dashboardAPI.markRead().then(() => setNotifs(ns => ns.map(n => ({ ...n, is_read: true })))).catch(() => {});
  };
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
      toast.success((lang==='ar'?'تم التبديل إلى وضع ':'Switched to ') + t(roleLabel[pwTarget]));
      setPwTarget(null);
      navigate('/dashboard');
    } catch {
      toast.error(t('كلمة المرور غير صحيحة'));
    } finally { setBusy(false); }
  };

  return (
    <div className="flex h-screen font-arabic overflow-hidden" style={{ background:'#F4F6FB' }} dir={dir}>

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
              {t(roleLabel[role])}
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
              {open && <span>{t(label)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-0.5" style={{ borderTop:'1px solid #312E81' }}>
          <NavLink to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
            <User size={18}/>{open && t('الملف الشخصي')}
          </NavLink>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all">
            <LogOut size={18}/>{open && t('تسجيل الخروج')}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex items-center px-6 gap-4 flex-shrink-0 bg-white"
          style={{ borderBottom:'1px solid #E5E7EF' }}>
          <h1 className="font-bold text-base flex-1 text-slate-700">
            {t('FLOWRIZ — منصة سلاسل الإمداد الذكية')}
          </h1>

          {/* Role switcher */}
          <div className="relative">
            <button onClick={() => setSwitchOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all hover:bg-indigo-50"
              style={{ borderColor:'#E5E7EF', color:'#4F46E5' }}>
              <Repeat size={15}/>
              <span>{lang==='ar'?'وضع':'Mode'}: {t(roleLabel[role])}</span>
              <ChevronDown size={14}/>
            </button>
            {switchOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSwitchOpen(false)}/>
                <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl border shadow-lg z-20 p-1.5"
                  style={{ borderColor:'#E5E7EF' }}>
                  <p className="text-xs text-slate-400 px-2.5 py-1.5">{t('تبديل الدور')}</p>
                  {availableRoles.map(r => {
                    const RI = switchRoleIcon[r] || ShoppingCart;
                    const active = r === role;
                    return (
                      <button key={r} onClick={() => chooseRole(r)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-slate-50 transition-all"
                        style={ active ? { color:'#4F46E5', fontWeight:700 } : { color:'#475569' } }>
                        <RI size={16}/>
                        <span className="flex-1 text-right">{t(roleLabel[r])}</span>
                        {active && <Check size={15}/>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <select value={currency} onChange={e=>setCurrency(e.target.value)} title="Currency"
            className="px-2 py-1.5 rounded-lg text-sm font-bold border bg-white cursor-pointer" style={{ borderColor:'#E5E7EF', color:'#475569' }}>
            {currencies.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={toggle} title="Language"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-bold border transition-all hover:bg-slate-50"
            style={{ borderColor:'#E5E7EF', color:'#475569' }}>
            <Globe size={15}/>{lang === 'ar' ? 'EN' : 'ع'}
          </button>
          <div className="relative">
            <button onClick={openNotifs} className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <Bell size={20}/>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)}/>
                <div className="absolute mt-1 w-80 bg-white rounded-xl border shadow-lg z-20 overflow-hidden"
                  style={{ borderColor:'#E5E7EF', [dir==='rtl'?'left':'right']: 0 }}>
                  <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor:'#F1F5F9' }}>
                    <span className="font-bold text-sm text-slate-700">{t('الإشعارات')}</span>
                    {notifs.length > 0 && <span className="text-xs text-slate-400">{notifs.length}</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-8">{t('لا توجد إشعارات')}</p>
                    ) : notifs.map(n => (
                      <button key={n.id}
                        onClick={() => { setNotifOpen(false); if (n.link) navigate(n.link); }}
                        className="w-full text-right px-4 py-3 border-b hover:bg-slate-50 transition-all block" style={{ borderColor:'#F4F6FB' }}>
                        <p className="text-sm font-bold text-slate-700">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString(lang==='ar'?'ar':'en')}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
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
              <span>{t('حسابك قيد المراجعة من إدارة المنصة. بعض الإجراءات قد تكون محدودة حتى الاعتماد.')}</span>
            </div>
          )}
          {user?.review_status === 'rejected' && (
            <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background:'#FEE2E2', color:'#991B1B' }}>
              <X size={18}/>
              <span>{t('تم رفض مستنداتك. يرجى مراجعة إدارة المنصة أو إعادة رفع المستندات.')}</span>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* Role-switch password confirmation */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'rgba(15,12,40,0.55)' }} onClick={() => !busy && setPwTarget(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Repeat size={18} style={{ color:'#4F46E5' }}/>
              <h3 className="font-bold text-lg text-slate-800">{t('تأكيد تبديل الدور')}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {lang==='ar'
                ? <>للانتقال إلى وضع «<span className="font-bold" style={{ color:'#4F46E5' }}>{t(roleLabel[pwTarget])}</span>» أدخل كلمة مرور حسابك للتأكيد.</>
                : <>To switch to «<span className="font-bold" style={{ color:'#4F46E5' }}>{t(roleLabel[pwTarget])}</span>» enter your account password to confirm.</>}
            </p>
            <input type="password" value={pw} autoFocus
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && pw && !busy && confirmSwitch()}
              placeholder={t('كلمة المرور')}
              className="w-full border rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2"
              style={{ borderColor:'#E5E7EF' }}/>
            <div className="flex gap-2">
              <button onClick={confirmSwitch} disabled={busy || !pw}
                className="flex-1 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 hover:opacity-90 transition-all"
                style={{ background:'#4F46E5' }}>
                {busy ? t('جارٍ التأكيد...') : t('تأكيد التبديل')}
              </button>
              <button onClick={() => setPwTarget(null)} disabled={busy}
                className="px-4 py-2.5 rounded-xl border font-bold text-slate-600 hover:bg-slate-50 transition-all"
                style={{ borderColor:'#E5E7EF' }}>
                {t('إلغاء')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
