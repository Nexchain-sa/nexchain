import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Trophy, Banknote, Receipt,
  Users, Bell, User, LogOut, Menu, X, Crown, ShieldCheck
} from 'lucide-react';

const navItems = {
  buyer: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/rfqs',         icon:FileText,        label:'طلبات الشراء' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
  ],
  supplier: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
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
    { to:'/rfqs',         icon:FileText,        label:'الطلبات' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
    { to:'/admin',        icon:Users,            label:'إدارة المستخدمين' },
  ],
  owner: [
    { to:'/dashboard',    icon:LayoutDashboard, label:'لوحة التحكم' },
    { to:'/rfqs',         icon:FileText,        label:'الطلبات' },
    { to:'/competitions', icon:Trophy,           label:'المنافسات' },
    { to:'/financing',    icon:Banknote,         label:'التمويل' },
    { to:'/invoices',     icon:Receipt,          label:'الفواتير' },
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
  buyer:    { bg:'#EFF6FF', color:'#1D4ED8' },
  supplier: { bg:'#ECFDF5', color:'#059669' },
  investor: { bg:'#FFFBEB', color:'#D97706' },
  admin:    { bg:'#F5F3FF', color:'#7C3AED' },
  owner:    { bg:'#FFF1F2', color:'#BE123C' },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const role  = user?.role || 'buyer';
  const items = navItems[role] || navItems.buyer;
  const badge = roleBadgeStyle[role] || roleBadgeStyle.buyer;
  const isOwner = role === 'owner' || role === 'admin';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen font-arabic overflow-hidden" style={{ background:'#F1F5F9' }} dir="rtl">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`${open ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0 flex flex-col`}
        style={{ background:'#0F172A', borderLeft:'1px solid #1E293B' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 h-16" style={{ borderBottom:'1px solid #1E293B' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background:'#1D4ED8', color:'#FFFFFF' }}>
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
          <div className="mx-3 my-3 p-3 rounded-xl" style={{ background:'#1E293B' }}>
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
              style={({ isActive }) => isActive ? { background:'#1D4ED8' } : {}}>
              <Icon size={18} className="flex-shrink-0"/>
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-0.5" style={{ borderTop:'1px solid #1E293B' }}>
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
          style={{ borderBottom:'1px solid #E2E8F0' }}>
          <h1 className="font-bold text-base flex-1 text-slate-700">
            FLOWRIZ — منصة سلاسل الإمداد الذكية
          </h1>
          <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <Bell size={20}/>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"/>
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
              style={{ background:'#1D4ED8' }}>
              {user?.name?.[0]}
            </div>
            <span className="text-slate-600">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background:'#F1F5F9' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
