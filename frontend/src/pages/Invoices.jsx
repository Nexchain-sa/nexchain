import React, { useState, useEffect } from 'react';
import { invoiceAPI, financingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Receipt, Plus, Banknote, Building2, User, Landmark, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';

const FINANCING_TYPES = [
  {
    id: 'company',
    icon: Building2,
    label: 'شركة تمويل',
    desc: 'تمويل عبر شركات التمويل المرخصة والمعتمدة',
    color: '#4F46E5',
    bg: '#EEF2FF',
    note: '🏦 سيتم عرض طلبك على شركات التمويل المعتمدة وسيصلك أفضل عرض خلال 24 ساعة.',
  },
  {
    id: 'individual',
    icon: User,
    label: 'مستثمر فردي',
    desc: 'تمويل مباشر من مستثمرين أفراد بأفضل الأسعار',
    color: '#0D9488',
    bg: '#F0FDFA',
    note: '👤 سيتم نشر فرصة الاستثمار للمستثمرين الأفراد في المنصة وستختار أفضل عرض.',
  },
  {
    id: 'fund',
    icon: Landmark,
    label: 'صندوق المنصة',
    desc: 'تمويل فوري من صندوق FLOWRIZ بموافقة خلال 48 ساعة',
    color: '#059669',
    bg: '#ECFDF5',
    note: '🏛️ سيُراجع فريق FLOWRIZ طلبك ويُوفّر التمويل من الصندوق خلال 48 ساعة.',
  },
];

const statusMap = {
  pending:             ['معلّقة',      '#D97706'],
  approved:            ['معتمدة',      '#059669'],
  financing_requested: ['طلب تمويل',   '#0D9488'],
  financed:            ['ممولة',       '#4F46E5'],
  paid:                ['مدفوعة',      '#059669'],
  overdue:             ['متأخرة',      '#ef4444'],
};

const inp = "w-full bg-[#F4F6FB] border border-[#EEF2FF] rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] text-sm";

export function Invoices() {
  const { user } = useAuth();
  const [invs, setInvs]           = useState([]);
  const [loading, setL]           = useState(true);
  const [showForm, setShow]       = useState(false);
  const [form, setForm]           = useState({ buyer_id:'', supplier_id:'', amount:'', due_date:'', notes:'' });
  const [sub, setSub]             = useState(false);
  const [finModal, setFinModal]   = useState(null);
  const [finType, setFinType]     = useState(null);
  const [finAmount, setFinAmount] = useState('');
  const [finSub, setFinSub]       = useState(false);
  const [finSuccess, setFinSuccess] = useState(false);

  const load = () =>
    invoiceAPI.list()
      .then(r => { setInvs(r.data.data || []); setL(false); })
      .catch(() => setL(false));

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await invoiceAPI.create(form);
      toast.success(t('تم إنشاء الفاتورة!')); setShow(false); load();
    } catch(err) { toast.error(err.response?.data?.message || t('خطأ')); }
    finally { setSub(false); }
  };

  const openFin = (inv) => {
    setFinModal(inv);
    setFinType(null);
    setFinAmount(inv.amount);
    setFinSuccess(false);
  };

  const submitFin = async () => {
    if (!finType) return toast.error(t('اختر جهة التمويل'));
    setFinSub(true);
    try {
      await financingAPI.request({
        invoice_id:       finModal.id,
        requested_amount: finAmount,
        financing_type:   finType,
      });
      setFinSuccess(true);
      load();
      toast.success(t('تم تقديم طلب التمويل بنجاح!'));
    } catch(err) { toast.error(err.response?.data?.message || t('خطأ في الطلب')); }
    finally { setFinSub(false); }
  };

  const { t, dir, lang } = useLang();
  return (
    <div className="font-arabic space-y-5" dir={dir}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Receipt size={20} className="text-[#0D9488]"/> الفواتير
        </h1>
        {(user?.role === 'buyer' || user?.role === 'supplier') && (
          <button onClick={() => setShow(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4F46E5] text-slate-800 text-sm font-bold hover:opacity-90 !text-white">
            <Plus size={15}/> فاتورة جديدة
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={create} className="bg-white border border-[#F0FDFA] rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-slate-800">{t('إنشاء فاتورة جديدة')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">{t('المبلغ (SAR) *')}</label>
              <input required type="number" className={inp} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}/>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">{t('تاريخ الاستحقاق *')}</label>
              <input required type="date" className={inp} value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}/>
            </div>
          </div>
          <textarea className={inp} rows={2} placeholder={t('ملاحظات...')} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/>
          <button type="submit" disabled={sub}
            className="px-6 py-2.5 rounded-xl bg-[#4F46E5] text-slate-800 font-bold text-sm hover:opacity-90 disabled:opacity-50 !text-white">
            {sub ? '...' : t('إنشاء الفاتورة')}
          </button>
        </form>
      )}

      {/* Invoices table */}
      <div className="bg-white border border-[#EEF2FF] rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EEF2FF]">
              {['رقم الفاتورة','المشتري','المورد','المبلغ','الاستحقاق','الحالة','تمويل الفاتورة'].map(h => (
                <th key={h} className="text-right px-4 py-3 text-slate-500 text-xs font-bold">{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2FF]">
            {loading && <tr><td colSpan={7} className="text-center py-10 text-slate-500">{t('جارٍ التحميل...')}</td></tr>}
            {!loading && invs.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-500">{t('لا توجد فواتير')}</td></tr>}
            {invs.map(inv => {
              const [label, color] = statusMap[inv.status] || ['—','#90A4AE'];
              const canFinance = inv.status === 'pending' && (user?.role === 'buyer' || user?.role === 'supplier');
              return (
                <tr key={inv.id} className="hover:bg-[#F4F6FB] transition-colors">
                  <td className="px-4 py-3 text-[#4F46E5] font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-800 text-xs">{inv.buyer_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-800 text-xs">{inv.supplier_name || '—'}</td>
                  <td className="px-4 py-3 text-[#059669] font-bold">SAR {Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(inv.due_date).toLocaleDateString('ar-SA')}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ color, background: color + '20' }}>{label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {canFinance ? (
                      <button onClick={() => openFin(inv)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                        style={{ background: 'linear-gradient(to left,#059669,#4F46E5)', color:'#fff' }}>
                        <Banknote size={13}/> طلب تمويل
                      </button>
                    ) : inv.status === 'financing_requested' ? (
                      <span className="text-xs text-[#0D9488] font-bold">{t('🕐 قيد المراجعة')}</span>
                    ) : inv.status === 'financed' ? (
                      <span className="text-xs text-[#4F46E5] font-bold">{t('✅ ممولة')}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Financing Modal ── */}
      {finModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setFinModal(null)}>
          <div className="bg-white border border-[#EEF2FF] rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF2FF]">
              <div className="flex items-center gap-2">
                <Banknote size={20} className="text-[#059669]"/>
                <h3 className="font-bold text-slate-800 text-lg">{t('تمويل الفاتورة')}</h3>
              </div>
              <button onClick={() => setFinModal(null)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <X size={20}/>
              </button>
            </div>

            {!finSuccess ? (
              <div className="p-6 space-y-5">

                {/* Invoice info */}
                <div className="bg-[#F4F6FB] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">{t('رقم الفاتورة')}</p>
                    <p className="text-[#4F46E5] font-mono font-bold">{finModal.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('المبلغ الكلي')}</p>
                    <p className="text-[#059669] font-bold text-lg">SAR {Number(finModal.amount).toLocaleString()}</p>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">{t('المبلغ المطلوب تمويله (SAR)')}</label>
                  <input type="number" className={inp} value={finAmount}
                    max={finModal.amount} onChange={e => setFinAmount(e.target.value)}/>
                </div>

                {/* Type selection */}
                <div>
                  <p className="text-xs text-slate-500 mb-3 font-bold">{t('اختر جهة التمويل')}</p>
                  <div className="space-y-3">
                    {FINANCING_TYPES.map(({ id, icon: Icon, label, desc, color, bg }) => (
                      <button key={id} type="button" onClick={() => setFinType(id)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right"
                        style={{
                          background: finType === id ? bg : '#FFFFFF',
                          borderColor: finType === id ? color : '#E5E7EF',
                        }}>
                        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: bg }}>
                          <Icon size={22} style={{ color }}/>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-bold text-slate-800 text-sm">{t(label)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t(desc)}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: finType === id ? color : '#E5E7EF', background: finType === id ? color : 'transparent' }}>
                          {finType === id && <div className="w-2 h-2 rounded-full bg-white"/>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                {finType && (
                  <div className="bg-[#EEF2FF] border border-[#EEF2FF] rounded-xl p-3 text-xs text-slate-500">
                    {t(FINANCING_TYPES.find(ft => ft.id === finType)?.note)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={submitFin} disabled={finSub || !finType}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-800 hover:opacity-90 disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(to left,#059669,#4F46E5)' }}>
                    {finSub ? t('جارٍ الإرسال...') : t('📤 تقديم طلب التمويل')}
                  </button>
                  <button onClick={() => setFinModal(null)}
                    className="px-5 py-3 rounded-xl border border-[#E5E7EF] text-slate-500 hover:text-slate-800 text-sm transition-all">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto">
                  <CheckCircle size={36} className="text-[#059669]"/>
                </div>
                <h4 className="text-slate-800 font-bold text-xl">{t('تم تقديم الطلب بنجاح!')}</h4>
                <p className="text-slate-500 text-sm">
                  سيتم مراجعة طلب تمويل الفاتورة{' '}
                  <span className="text-[#4F46E5] font-mono">{finModal.invoice_number}</span>{' '}
                  والتواصل معك قريباً.
                </p>
                <button onClick={() => setFinModal(null)}
                  className="px-8 py-2.5 rounded-xl font-bold text-sm text-slate-800"
                  style={{ background: 'linear-gradient(to left,#059669,#4F46E5)' }}>
                  حسناً ✓
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
