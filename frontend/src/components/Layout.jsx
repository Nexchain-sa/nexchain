import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Trophy, Banknote, Receipt,
  Users, Bell, User, LogOut, Menu, X, ChevronDown
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
    { to:'/admin',        icon:Users,            label:'إدارة المستخدمين' },
  ],
};

const roleLabel = { buyer:'مشترٍ', supplier:'مورد', investor:'مستثمر', admin:'مدير النظام' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const items = navItems[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-[#0A0F2E] text-[#E8EAF6] font-arabic overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <aside className={`${open ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0 bg-[#0D1B5E] border-l border-[#00D4FF22] flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-[#00D4FF22] h-16">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] flex items-center justify-center font-bold text-[#0A0F2E] text-lg flex-shrink-0">⬡</div>
          {open && <span className="text-[#00D4FF] font-bold text-xl tracking-wide">FLOWRIZ</span>}
          <button onClick={() => setOpen(!open)} className="mr-auto text-[#90A4AE] hover:text-white">
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>

        {/* User badge */}
        {open && (
          <div className="mx-3 my-3 p-3 rounded-xl bg-[#0A0F2E] border border-[#00D4FF22]">
            <p className="text-sm font-bold text-white truncate">{user?.company_name || user?.name}</p>
            <p className="text-xs text-[#00D4FF] mt-0.5">{roleLabel[user?.role]}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-[#00D4FF15] text-[#00D4FF] font-bold border border-[#00D4FF33]'
                  : 'text-[#90A4AE] hover:bg-[#ffffff0a] hover:text-white'
              }`
            }>
              <Icon size={18} className="flex-shrink-0"/>
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-[#00D4FF22] space-y-1">
          <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#90A4AE] hover:text-white hover:bg-[#ffffff0a] transition-all">
            <User size={18}/>{open && 'الملف الشخصي'}
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={18}/>{open && 'تسجيل الخروج'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-[#0D1B5E] border-b border-[#00D4FF22] flex items-center px-6 gap-4 flex-shrink-0">
          <h1 className="text-[#00D4FF] font-bold text-lg flex-1">منصة سلاسل الإمداد الذكية</h1>
          <button className="relative text-[#90A4AE] hover:text-white p-2 rounded-lg hover:bg-[#ffffff0a]">
            <Bell size={20}/>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00C853]"></span>
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] flex items-center justify-center font-bold text-[#0A0F2E] text-xs">
              {user?.name?.[0]}
            </div>
            <span className="text-[#90A4AE]">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
