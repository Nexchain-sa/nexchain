import React, { useState, useEffect } from 'react';
import { installmentAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CreditCard, CheckCircle, Clock, AlertTriangle, Wallet, Upload, FileText, X, Download, Printer } from 'lucide-react';
import { uploadToCloudinary } from '../config/cloudinary';
import { downloadCSV, tableHTML, printReport } from '../utils/exporters';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const STATUS = {
  due:            { label: 'مستحق',          color: '#4F46E5', bg: '#EEF2FF', icon: Clock },
  pending_review: { label: 'قيد المراجعة',   color: '#D97706', bg: '#FEF3C7', icon: Clock },
  paid:           { label: 'مدفوع',          color: '#059669', bg: '#ECFDF5', icon: CheckCircle },
  overdue:        { label: 'متأخر',          color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle },
};

const money = (v) => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtDate = (d, lang='ar') => d ? new Date(d).toLocaleDateString(lang==='ar'?'ar-EG':'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

export default function Installments() {
  const { user } = useAuth();
  const { t, dir, lang } = useLang();
  const { fmt } = useCurrency();
  const isAdmin = ['admin', 'owner'].includes(user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () =>
    installmentAPI.list()
      .then(r => { setRows(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const [payModal, setPayModal] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [uploadingR, setUploadingR] = useState(false);

  const openPay = (r) => { setReceipt(null); setPayModal(r); };
  const uploadReceipt = async (file) => {
    setUploadingR(true);
    try { setReceipt(await uploadToCloudinary(file)); toast.success(t('تم رفع الإيصال')); }
    catch (e) { toast.error(e.message || t('فشل الرفع')); }
    finally { setUploadingR(false); }
  };
  const submitPay = async () => {
    setBusy(payModal.id);
    try {
      await installmentAPI.pay(payModal.id, { receipt });
      toast.success(t('تم إرسال السداد للمراجعة'));
      setPayModal(null); setReceipt(null); load();
    } catch (e) { toast.error(e.response?.data?.message || t('تعذّر تسجيل السداد')); }
    finally { setBusy(null); }
  };
  const confirm = async (id) => {
    setBusy(id);
    try { await installmentAPI.confirm(id); toast.success(t('تم اعتماد السداد')); load(); }
    catch (e) { toast.error(e.response?.data?.message || t('خطأ')); }
    finally { setBusy(null); }
  };
  const settleEarly = async (reqId) => {
    if (!window.confirm(t('سداد كل أقساط هذه الصفقة دفعةً واحدة مع الإعفاء من الغرامات؟'))) return;
    setBusy('settle' + reqId);
    try { const r = await installmentAPI.settleEarly(reqId, {}); toast.success(r.data.message); load(); }
    catch (e) { toast.error(e.response?.data?.message || t('خطأ')); }
    finally { setBusy(null); }
  };

  const totalDue   = rows.filter(r => ['due', 'overdue', 'pending_review'].includes(r.status))
                         .reduce((s, r) => s + Number(r.amount) + Number(r.late_fee || 0), 0);
  const paidCount  = rows.filter(r => r.status === 'paid').length;
  const overdue    = rows.filter(r => r.status === 'overdue').length;
  const lateFees   = rows.reduce((s, r) => s + Number(r.late_fee || 0), 0);

  const Stat = ({ label, value, color, icon: Icon, suffix }) => (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E5E7EF' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{t(label)}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}<span className="text-sm font-medium text-slate-400">{suffix?t(suffix.trim()):suffix}</span></p>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: color + '15' }}><Icon size={20} style={{ color }} /></div>
      </div>
    </div>
  );

  const exHeaders = [t('القسط'), ...(isAdmin ? [t('المدين')] : []), t('تاريخ الاستحقاق'), t('المبلغ'), t('الغرامة'), t('الحالة')];
  const exRows = rows.map(r => [
    `#${r.seq}`, ...(isAdmin ? [r.company_name || r.payer_name || '-'] : []),
    r.due_date ? new Date(r.due_date).toLocaleDateString('en-CA') : '',
    Number(r.amount) + Number(r.late_fee || 0), Number(r.late_fee || 0),
    t((STATUS[r.status] || STATUS.due).label),
  ]);
  const exportCSV = () => downloadCSV('flowriz-installments.csv', exHeaders, exRows);
  const exportPDF = () => printReport({ title: t('الأقساط'), subtitle: `${t('إجمالي المستحق')}: ${fmt(totalDue)} · ${paidCount} ${t('أقساط مدفوعة')}`, dir, sections: [{ html: tableHTML(exHeaders, exRows) }] });

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CreditCard size={22} style={{ color: '#4F46E5' }} />
          <h1 className="text-xl font-bold text-slate-800">{t('الأقساط')}</h1>
          {isAdmin && <span className="text-xs text-slate-400">{t('— عرض جميع الأقساط واعتماد المدفوعات')}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={!rows.length} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border disabled:opacity-50 hover:bg-slate-50" style={{ borderColor: '#E5E7EF', color: '#475569' }}><Download size={14} /> CSV</button>
          <button onClick={exportPDF} disabled={!rows.length} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border disabled:opacity-50 hover:bg-slate-50" style={{ borderColor: '#E5E7EF', color: '#475569' }}><Printer size={14} /> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="إجمالي المستحق" value={fmt(totalDue)} color="#4F46E5" icon={Wallet} />
        <Stat label="أقساط مدفوعة"  value={paidCount}        color="#059669" icon={CheckCircle} />
        <Stat label="أقساط متأخرة"  value={overdue}          color="#DC2626" icon={AlertTriangle} />
        <Stat label="إجمالي الغرامات" value={fmt(lateFees)} color="#D97706" icon={Clock} />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EF' }}>
        {loading ? (
          <p className="text-center text-slate-400 py-12">{t('جارٍ التحميل...')}</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-14">
            <CreditCard size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400">{t('لا توجد أقساط بعد. تُنشأ تلقائيًا عند قبول عرض تمويل.')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs" style={{ background: '#F8FAFC' }}>
                <th className="text-right font-medium px-4 py-3">{t('القسط')}</th>
                {isAdmin && <th className="text-right font-medium px-4 py-3">{t('المدين')}</th>}
                <th className="text-right font-medium px-4 py-3">{t('تاريخ الاستحقاق')}</th>
                <th className="text-right font-medium px-4 py-3">{t('المبلغ')}</th>
                <th className="text-right font-medium px-4 py-3">{t('الغرامة')}</th>
                <th className="text-right font-medium px-4 py-3">{t('الحالة')}</th>
                <th className="text-right font-medium px-4 py-3">{t('الإجراء')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const st = STATUS[r.status] || STATUS.due;
                const SIcon = st.icon;
                const total = Number(r.amount) + Number(r.late_fee || 0);
                return (
                  <tr key={r.id} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                    <td className="px-4 py-3 font-bold text-slate-700">{t('قسط')} #{r.seq}</td>
                    {isAdmin && <td className="px-4 py-3 text-slate-600">{r.company_name || r.payer_name || '-'}</td>}
                    <td className="px-4 py-3 text-slate-600">{fmtDate(r.due_date, lang)}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{fmt(total)}</td>
                    <td className="px-4 py-3">{Number(r.late_fee) > 0 ? <span className="text-red-600 font-bold">{money(r.late_fee)}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: st.bg, color: st.color }}>
                        <SIcon size={12} /> {t(st.label)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!isAdmin && (r.status === 'due' || r.status === 'overdue') && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openPay(r)} disabled={busy === r.id}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                            style={{ background: '#4F46E5' }}>
                            {busy === r.id ? '...' : t('تأكيد السداد')}
                          </button>
                          {r.financing_request_id && (
                            <button onClick={() => settleEarly(r.financing_request_id)} disabled={busy === 'settle' + r.financing_request_id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold border hover:bg-emerald-50 disabled:opacity-50"
                              style={{ borderColor: '#A7F3D0', color: '#059669' }}>
                              {t('سداد مبكر')}
                            </button>
                          )}
                        </div>
                      )}
                      {!isAdmin && r.status === 'pending_review' && <span className="text-xs text-amber-600">{t('بانتظار المراجعة')}</span>}
                      {isAdmin && r.status === 'pending_review' && (
                        <div className="flex items-center gap-2">
                          {r.receipt_url && <a href={r.receipt_url} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color:'#4F46E5' }}>{t('الإيصال')}</a>}
                          <button onClick={() => confirm(r.id)} disabled={busy === r.id}
                            className="px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                            style={{ background: '#059669' }}>
                            {busy === r.id ? '...' : t('اعتماد السداد')}
                          </button>
                        </div>
                      )}
                      {(r.status === 'paid') && <span className="text-xs text-emerald-600">{t('مكتمل')}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {payModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>!busy && setPayModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" dir={dir} onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-lg text-slate-800 mb-1">{t('تأكيد سداد القسط')} #{payModal.seq}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('المبلغ:')} {money(Number(payModal.amount)+Number(payModal.late_fee||0))} {t('ر.س')} — {t('حوّل بنكيًا وارفع صورة الإيصال.')}</p>
            <label className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm cursor-pointer border-2 border-dashed mb-3"
              style={{ borderColor:'#C7CBE8', color:'#4F46E5', background:'#F8FAFC' }}>
              <Upload size={16}/>
              <span>{uploadingR ? t('جارٍ الرفع...') : (receipt ? t('تغيير الإيصال') : t('رفع إيصال التحويل (اختياري)'))}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploadingR}
                onChange={e=>e.target.files.length && uploadReceipt(e.target.files[0])}/>
            </label>
            {receipt && (
              <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 mb-3" style={{ background:'#ECFDF5' }}>
                <FileText size={14} style={{color:'#059669'}}/>
                <a href={receipt.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-slate-700 hover:underline">{receipt.name}</a>
                <button onClick={()=>setReceipt(null)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={submitPay} disabled={busy===payModal.id || uploadingR}
                className="flex-1 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background:'#4F46E5' }}>
                {busy===payModal.id ? t('جارٍ الإرسال...') : t('إرسال للمراجعة')}
              </button>
              <button onClick={()=>setPayModal(null)} disabled={busy===payModal.id}
                className="px-4 py-2.5 rounded-xl border font-bold text-slate-600" style={{ borderColor:'#E5E7EF' }}>{t('إلغاء')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
