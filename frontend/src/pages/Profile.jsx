import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name:user?.name||'', phone:user?.phone||'', city:user?.city||'', company_name:user?.company_name||'' });
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm:'' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('تم حفظ الملف الشخصي');
    } catch(err) { toast.error(err.response?.data?.message||'خطأ'); }
    finally { setSaving(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pwForm.new_password!==pwForm.confirm) return toast.error('كلمتا المرور غير متطابقتين');
    setSaving(true);
    try {
      await authAPI.changePassword({ current_password:pwForm.current_password, new_password:pwForm.new_password });
      toast.success('تم تغيير كلمة المرور');
      setPwForm({ current_password:'', new_password:'', confirm:'' });
    } catch(err) { toast.error(err.response?.data?.message||'خطأ'); }
    finally { setSaving(false); }
  };

  const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] text-sm";
  const lbl = "block text-xs text-[#90A4AE] mb-1.5 font-medium";
  const roleLabel = { buyer:'مشترٍ', supplier:'مورد', investor:'مستثمر', admin:'مدير النظام' };

  return (
    <div className="font-arabic max-w-lg space-y-5" dir="rtl">
      <h1 className="text-xl font-bold text-white">الملف الشخصي</h1>

      {/* Avatar card */}
      <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7B2FFF] flex items-center justify-center text-2xl font-bold text-[#0A0F2E] flex-shrink-0">
          {user?.name?.[0]}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{user?.name}</p>
          <p className="text-[#00D4FF] text-sm">{roleLabel[user?.role]}</p>
          <p className="text-[#90A4AE] text-xs mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D1B5E] p-1 rounded-xl w-fit border border-[#00D4FF11]">
        {[['profile',<User size={14}/>, 'البيانات'],['password',<Lock size={14}/>, 'كلمة المرور']].map(([t,icon,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===t?'bg-[#00D4FF] text-[#0A0F2E]':'text-[#90A4AE] hover:text-white'}`}>
            {icon}{l}
          </button>
        ))}
      </div>

      {tab==='profile' && (
        <form onSubmit={saveProfile} className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-5 space-y-4">
          <div><label className={lbl}>الاسم الكامل</label>
            <input className={inp} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className={lbl}>اسم الشركة / المؤسسة</label>
            <input className={inp} value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>رقم الجوال</label>
              <input className={inp} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div><label className={lbl}>المدينة</label>
              <input className={inp} value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg">
            <Save size={15}/>{saving?'جارٍ الحفظ...':'حفظ التغييرات'}
          </button>
        </form>
      )}

      {tab==='password' && (
        <form onSubmit={changePw} className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-5 space-y-4">
          <div><label className={lbl}>كلمة المرور الحالية</label>
            <input required type="password" className={inp} value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})}/></div>
          <div><label className={lbl}>كلمة المرور الجديدة</label>
            <input required type="password" className={inp} value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})}/></div>
          <div><label className={lbl}>تأكيد كلمة المرور الجديدة</label>
            <input required type="password" className={inp} value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})}/></div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg">
            <Lock size={15}/>{saving?'جارٍ التغيير...':'تغيير كلمة المرور'}
          </button>
        </form>
      )}
    </div>
  );
}
