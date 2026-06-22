import React, { useState, useEffect } from 'react';
import { accountAPI } from '../utils/api';
import { useLang } from '../context/LanguageContext';
import { Users, Plus, Trash2, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const PERMS = [
  ['manage_users', 'إدارة المستخدمين والصلاحيات'],
  ['rfqs', 'طلبات الشراء'],
  ['invoices', 'الفواتير'],
  ['financing', 'التمويل'],
  ['manufacturing', 'التصنيع'],
  ['installments', 'الأقساط والمدفوعات'],
];

export default function AccountUsers() {
  const { t, dir } = useLang();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', permissions: [] });

  const load = () => accountAPI.members().then(r => { setMembers(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const togglePerm = (list, key, on) => on ? [...new Set([...list, key])] : list.filter(p => p !== key);

  const add = async (e) => {
    e.preventDefault(); setBusy('add');
    try { await accountAPI.addMember(form); toast.success(t('تمت إضافة المستخدم')); setShowAdd(false); setForm({ name: '', email: '', password: '', permissions: [] }); load(); }
    catch (err) { toast.error(err.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };
  const setPerm = async (m, key, on) => {
    const permissions = togglePerm(m.permissions || [], key, on);
    setMembers(ms => ms.map(x => x.id === m.id ? { ...x, permissions } : x));
    try { await accountAPI.updateMember(m.id, { permissions }); } catch { toast.error(t('خطأ')); load(); }
  };
  const toggleActive = async (m) => {
    setBusy(m.id);
    try { await accountAPI.updateMember(m.id, { is_active: !m.is_active }); toast.success(t('تم التحديث')); load(); }
    catch { toast.error(t('خطأ')); } finally { setBusy(null); }
  };
  const remove = async (m) => {
    if (!window.confirm(t('حذف هذا المستخدم نهائيًّا؟'))) return;
    setBusy(m.id);
    try { await accountAPI.removeMember(m.id); toast.success(t('تم حذف المستخدم')); load(); }
    catch { toast.error(t('خطأ')); } finally { setBusy(null); }
  };

  const inp = "w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none";

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users size={22} style={{ color: '#4F46E5' }} />
          <h1 className="text-xl font-bold text-slate-800">{t('المستخدمون والصلاحيات')}</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#4F46E5' }}><Plus size={15} /> {t('إضافة مستخدم')}</button>
      </div>
      <p className="text-xs text-slate-400 -mt-2">{t('أضف أعضاء فريقك تحت حسابك وحدّد ما يستطيع كلٌّ منهم الوصول إليه.')}</p>

      {loading ? <p className="text-center text-slate-400 py-12">{t('جارٍ التحميل...')}</p>
        : members.length === 0 ? (
          <div className="bg-white rounded-2xl border py-14 text-center" style={{ borderColor: '#E5E7EF' }}>
            <Users size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400">{t('لا يوجد مستخدمون بعد. أضف أول عضو لفريقك.')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#E5E7EF' }}>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ background: m.is_active ? '#4F46E5' : '#94A3B8' }}>{(m.name || '?')[0]}</div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-bold text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={m.is_active ? { background: '#ECFDF5', color: '#059669' } : { background: '#F1F5F9', color: '#64748B' }}>{m.is_active ? t('نشط') : t('موقوف')}</span>
                  <button onClick={() => toggleActive(m)} disabled={busy === m.id} className="text-xs font-bold px-3 py-1.5 rounded-lg border" style={{ borderColor: '#E5E7EF', color: '#475569' }}>{m.is_active ? t('إيقاف') : t('تفعيل')}</button>
                  <button onClick={() => remove(m)} disabled={busy === m.id} className="p-1.5 rounded-lg" style={{ background: '#FEE2E2', color: '#DC2626' }}><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center gap-2 mb-1.5"><ShieldCheck size={14} style={{ color: '#7C3AED' }} /><span className="text-xs font-bold text-slate-600">{t('الصلاحيات')}</span></div>
                <div className="flex flex-wrap gap-2">
                  {PERMS.map(([key, label]) => {
                    const on = (m.permissions || []).includes(key);
                    return (
                      <button key={key} onClick={() => setPerm(m, key, !on)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all"
                        style={on ? { background: '#EEF2FF', borderColor: '#4F46E5', color: '#4F46E5' } : { background: '#fff', borderColor: '#E5E7EF', color: '#94A3B8' }}>
                        {on && <Check size={12} />}{t(label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={dir} onClick={() => setShowAdd(false)}>
          <form onSubmit={add} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-lg text-slate-800">{t('إضافة مستخدم')}</h3>
            <input required placeholder={t('الاسم')} className={inp} style={{ borderColor: '#E5E7EF' }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input required type="email" placeholder={t('البريد الإلكتروني')} className={inp} style={{ borderColor: '#E5E7EF' }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input required type="password" placeholder={t('كلمة المرور (6 أحرف على الأقل)')} className={inp} style={{ borderColor: '#E5E7EF' }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">{t('الصلاحيات')}</p>
              <div className="flex flex-wrap gap-2">
                {PERMS.map(([key, label]) => {
                  const on = form.permissions.includes(key);
                  return (
                    <button type="button" key={key} onClick={() => setForm({ ...form, permissions: togglePerm(form.permissions, key, !on) })}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border"
                      style={on ? { background: '#EEF2FF', borderColor: '#4F46E5', color: '#4F46E5' } : { background: '#fff', borderColor: '#E5E7EF', color: '#94A3B8' }}>
                      {on && <Check size={12} />}{t(label)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={busy === 'add'} className="flex-1 py-2.5 rounded-xl text-white font-bold" style={{ background: '#4F46E5' }}>{busy === 'add' ? t('جارٍ...') : t('إضافة')}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border text-slate-600" style={{ borderColor: '#E5E7EF' }}>{t('إلغاء')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
