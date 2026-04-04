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

const roleColor = {
  buyer:    '#00F5FF',
  supplier: '#00E5A0',
  investor: '#FFB800',
  admin:    '#6C63FF',
  owner:    '#FF6BFF',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const role  = user?.role || 'buyer';
  const items = navItems[role] || navItems.buyer;
  const color = roleColor[role] || '#6C63FF';
  const isOwner = role === 'owner' || role === 'admin';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen text-[#E8EAF6] font-arabic overflow-hidden"
      style={{ background: '#07080F' }} dir="rtl">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`${open ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0 flex flex-col relative`}
        style={{
          background: 'linear-gradient(180deg, #0E0F1E 0%, #07080F 100%)',
          borderLeft: '1px solid #6C63FF22',
        }}>

        {/* Glow line top */}
        <div className="absolute top-0 right-0 w-px h-full opacity-60"
          style={{ background: 'linear-gradient(180deg, #6C63FF, #00F5FF44, transparent)' }}/>

        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b h-16"
          style={{ borderColor: '#6C63FF22' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #00F5FF)', color: '#07080F' }}>
            ⬡
          </div>
          {open && (
            <span className="font-bold text-xl tracking-widest"
              style={{ background: 'linear-gradient(to left, #6C63FF, #00F5FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              FLOWRIZ
            </span>
          )}
          <button onClick={() => setOpen(!open)} className="mr-auto transition-colors"
            style={{ color: '#8892B0' }}
            onMouseEnter={e => e.currentTarget.style.color='#E8EAF6'}
            onMouseLeave={e => e.currentTarget.style.color='#8892B0'}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>

        {/* User badge */}
        {open && (
          <div className="mx-3 my-3 p-3 rounded-xl border"
            style={{ background: '#13142A', borderColor: color + '33' }}>
            <div className="flex items-center gap-2 mb-1">
              {isOwner && <Crown size={12} style={{ color: '#FF6BFF' }}/>}
              <p className="text-sm font-bold text-white truncate">{user?.company_name || user?.name}</p>
            </div>
            <p className="text-xs font-bold" style={{ color }}>{roleLabel[role]}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive ? 'font-bold' : ''
              }`
            }
            style={({ isActive }) => isActive ? {
              background: color + '15',
              color: color,
              border: '1px solid ' + color + '44',
            } : {
              color: '#8892B0',
            }}
            onMouseEnter={e => { if(!e.currentTarget.classList.contains('active')) e.currentTarget.style.color='#E8EAF6'; }}
            onMouseLeave={e => { if(!e.currentTarget.style.background) e.currentTarget.style.color='#8892B0'; }}
            >
              <Icon size={18} className="flex-shrink-0"/>
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t space-y-1" style={{ borderColor: '#6C63FF22' }}>
          <NavLink to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: '#8892B0' }}
            onMouseEnter={e => e.currentTarget.style.color='#E8EAF6'}
            onMouseLeave={e => e.currentTarget.style.color='#8892B0'}>
            <User size={18}/>{open && 'الملف الشخصي'}
          </NavLink>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: '#ff6b6b' }}
            onMouseEnter={e => { e.currentTarget.style.background='#ff6b6b15'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
            <LogOut size={18}/>{open && 'تسجيل الخروج'}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex items-center px-6 gap-4 flex-shrink-0"
          style={{ background: '#0E0F1E', borderBottom: '1px solid #6C63FF22' }}>
          <h1 className="font-bold text-lg flex-1"
            style={{ background: 'linear-gradient(to left,#6C63FF,#00F5FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            FLOWRIZ — منصة سلاسل الإمداد الذكية
          </h1>
          <button className="relative p-2 rounded-lg transition-all"
            style={{ color: '#8892B0' }}
            onMouseEnter={e => { e.currentTarget.style.color='#E8EAF6'; e.currentTarget.style.background='#ffffff0a'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#8892B0'; e.currentTarget.style.background='transparent'; }}>
            <Bell size={20}/>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: '#00E5A0' }}/>
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
              style={{ background: `linear-gradient(135deg, ${color}, #6C63FF)`, color: '#07080F' }}>
              {user?.name?.[0]}
            </div>
            <span style={{ color: '#8892B0' }}>{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6"
          style={{ background: 'radial-gradient(ellipse at top right, #6C63FF06 0%, transparent 60%), #07080F' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
