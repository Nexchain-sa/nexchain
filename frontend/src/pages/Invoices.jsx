import React, { useState, useEffect } from 'react';
import { invoiceAPI, financingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Receipt, Plus, Banknote, Building2, User, Landmark, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FINANCING_TYPES = [
  {
    id: 'company',
    icon: Building2,
    label: 'شركة تمويل',
    desc: 'تمويل عبر شركات التمويل المرخصة والمعتمدة',
    color: '#00D4FF',
    bg: '#00D4FF15',
    note: '🏦 سيتم عرض طلبك على شركات التمويل المعتمدة وسيصلك أفضل عرض خلال 24 ساعة.',
  },
  {
    id: 'individual',
    icon: User,
    label: 'مستثمر فردي',
    desc: 'تمويل مباشر من مستثمرين أفراد بأفضل الأسعار',
    color: '#7B2FFF',
    bg: '#7B2FFF15',
    note: '👤 سيتم نشر فرصة الاستثمار للمستثمرين الأفراد في المنصة وستختار أفضل عرض.',
  },
  {
    id: 'fund',
    icon: Landmark,
    label: 'صندوق المنصة',
    desc: 'تمويل فوري من صندوق FLOWRIZ بموافقة خلال 48 ساعة',
    color: '#00C853',
    bg: '#00C85315',
    note: '🏛️ سيُراجع فريق FLOWRIZ طلبك ويُوفّر التمويل من الصندوق خلال 48 ساعة.',
  },
];

const statusMap = {
  pending:             ['معلّقة',      '#FF6B35'],
  approved:            ['معتمدة',      '#00C853'],
  financing_requested: ['طلب تمويل',   '#7B2FFF'],
  financed:            ['ممولة',       '#00D4FF'],
  paid:                ['مدفوعة',      '#00C853'],
  overdue:             ['متأخرة',      '#ef4444'],
};

const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] text-sm";

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
      toast.success('تم إنشاء الفاتورة!'); setShow(false); load();
    } catch(err) { toast.error(err.response?.data?.message || 'خطأ'); }
    finally { setSub(false); }
  };

  const openFin = (inv) => {
    setFinModal(inv);
    setFinType(null);
    setFinAmount(inv.amount);
    setFinSuccess(false);
  };

  const submitFin = async () => {
    if (!finType) return toast.error('اختر جهة التمويل');
    setFinSub(true);
    try {
      await financingAPI.request({
        invoice_id:       finModal.id,
        requested_amount: finAmount,
        financing_type:   finType,
      });
      setFinSuccess(true);
      load();
      toast.success('تم تقديم طلب التمويل بنجاح!');
    } catch(err) { toast.error(err.response?.data?.message || 'خطأ في الطلب'); }
    finally { setFinSub(false); }
  };

  return (
    <div className="font-arabic space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Receipt size={20} className="text-[#7B2FFF]"/> الفواتير
        </h1>
        {(user?.role === 'buyer' || user?.role === 'supplier') && (
          <button onClick={() => setShow(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-l from-[#7B2FFF] to-[#00D4FF] text-white text-sm font-bold hover:opacity-90">
            <Plus size={15}/> فاتورة جديدة
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={create} className="bg-[#0D1B5E] border border-[#7B2FFF33] rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-white">إنشاء فاتورة جديدة</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#90A4AE] mb-1.5 block">المبلغ (SAR) *</label>
              <input required type="number" className={inp} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}/>
            </div>
            <div>
              <label className="text-xs text-[#90A4AE] mb-1.5 block">تاريخ الاستحقاق *</label>
              <input required type="date" className={inp} value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}/>
            </div>
          </div>
          <textarea className={inp} rows={2} placeholder="ملاحظات..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/>
          <button type="submit" disabled={sub}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#7B2FFF] to-[#00D4FF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
            {sub ? '...' : 'إنشاء الفاتورة'}
          </button>
        </form>
      )}

      {/* Invoices table */}
      <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#00D4FF11]">
              {['رقم الفاتورة','المشتري','المورد','المبلغ','الاستحقاق','الحالة','تمويل الفاتورة'].map(h => (
                <th key={h} className="text-right px-4 py-3 text-[#90A4AE] text-xs font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00D4FF08]">
            {loading && <tr><td colSpan={7} className="text-center py-10 text-[#90A4AE]">جارٍ التحميل...</td></tr>}
            {!loading && invs.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-[#90A4AE]">لا توجد فواتير</td></tr>}
            {invs.map(inv => {
              const [label, color] = statusMap[inv.status] || ['—','#90A4AE'];
              const canFinance = inv.status === 'pending' && (user?.role === 'buyer' || user?.role === 'supplier');
              return (
                <tr key={inv.id} className="hover:bg-[#0A0F2E] transition-colors">
                  <td className="px-4 py-3 text-[#00D4FF] font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-white text-xs">{inv.buyer_name || '—'}</td>
                  <td className="px-4 py-3 text-white text-xs">{inv.supplier_name || '—'}</td>
                  <td className="px-4 py-3 text-[#00C853] font-bold">SAR {Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#90A4AE] text-xs">{new Date(inv.due_date).toLocaleDateString('ar-SA')}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ color, background: color + '20' }}>{label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {canFinance ? (
                      <button onClick={() => openFin(inv)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                        style={{ background: 'linear-gradient(to left,#00C853,#00D4FF)', color:'#fff' }}>
                        <Banknote size={13}/> طلب تمويل
                      </button>
                    ) : inv.status === 'financing_requested' ? (
                      <span className="text-xs text-[#7B2FFF] font-bold">🕐 قيد المراجعة</span>
                    ) : inv.status === 'financed' ? (
                      <span className="text-xs text-[#00D4FF] font-bold">✅ ممولة</span>
                    ) : (
                      <span className="text-xs text-[#455A64]">—</span>
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
          <div className="bg-[#0D1B5E] border border-[#00D4FF33] rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#00D4FF11]">
              <div className="flex items-center gap-2">
                <Banknote size={20} className="text-[#00C853]"/>
                <h3 className="font-bold text-white text-lg">تمويل الفاتورة</h3>
              </div>
              <button onClick={() => setFinModal(null)} className="text-[#90A4AE] hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>

            {!finSuccess ? (
              <div className="p-6 space-y-5">

                {/* Invoice info */}
                <div className="bg-[#0A0F2E] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#90A4AE]">رقم الفاتورة</p>
                    <p className="text-[#00D4FF] font-mono font-bold">{finModal.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#90A4AE]">المبلغ الكلي</p>
                    <p className="text-[#00C853] font-bold text-lg">SAR {Number(finModal.amount).toLocaleString()}</p>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-[#90A4AE] mb-1.5 block">المبلغ المطلوب تمويله (SAR)</label>
                  <input type="number" className={inp} value={finAmount}
                    max={finModal.amount} onChange={e => setFinAmount(e.target.value)}/>
                </div>

                {/* Type selection */}
                <div>
                  <p className="text-xs text-[#90A4AE] mb-3 font-bold">اختر جهة التمويل</p>
                  <div className="space-y-3">
                    {FINANCING_TYPES.map(({ id, icon: Icon, label, desc, color, bg }) => (
                      <button key={id} type="button" onClick={() => setFinType(id)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right"
                        style={{
                          background: finType === id ? bg : '#0A0F2E',
                          borderColor: finType === id ? color : '#ffffff11',
                        }}>
                        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: bg }}>
                          <Icon size={22} style={{ color }}/>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-bold text-white text-sm">{label}</p>
                          <p className="text-xs text-[#90A4AE] mt-0.5">{desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: finType === id ? color : '#ffffff22', background: finType === id ? color : 'transparent' }}>
                          {finType === id && <div className="w-2 h-2 rounded-full bg-white"/>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                {finType && (
                  <div className="bg-[#00D4FF08] border border-[#00D4FF22] rounded-xl p-3 text-xs text-[#90A4AE]">
                    {FINANCING_TYPES.find(t => t.id === finType)?.note}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={submitFin} disabled={finSub || !finType}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(to left,#00C853,#00D4FF)' }}>
                    {finSub ? 'جارٍ الإرسال...' : '📤 تقديم طلب التمويل'}
                  </button>
                  <button onClick={() => setFinModal(null)}
                    className="px-5 py-3 rounded-xl border border-[#ffffff15] text-[#90A4AE] hover:text-white text-sm transition-all">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#00C85320] flex items-center justify-center mx-auto">
                  <CheckCircle size={36} className="text-[#00C853]"/>
                </div>
                <h4 className="text-white font-bold text-xl">تم تقديم الطلب بنجاح!</h4>
                <p className="text-[#90A4AE] text-sm">
                  سيتم مراجعة طلب تمويل الفاتورة{' '}
                  <span className="text-[#00D4FF] font-mono">{finModal.invoice_number}</span>{' '}
                  والتواصل معك قريباً.
                </p>
                <button onClick={() => setFinModal(null)}
                  className="px-8 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(to left,#00C853,#00D4FF)' }}>
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
