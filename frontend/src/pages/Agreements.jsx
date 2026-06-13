import React, { useState, useEffect } from 'react';
import { financingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { uploadToCloudinary } from '../config/cloudinary';
import { FileSignature, FileText, Upload, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Agreements() {
  const { user } = useAuth();
  const { t, dir } = useLang();
  const isBuyer = user?.role === 'buyer';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState({});
  const [busy, setBusy] = useState(null);

  const load = () => financingAPI.agreements().then(r => { setRows(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const dl = (url) => url ? (url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url) : '#';

  const upSigned = async (id, which, file) => {
    setBusy(id + which);
    try {
      const u = await uploadToCloudinary(file);
      setSigning(s => ({ ...s, [id]: { ...(s[id] || {}), [which]: u } }));
      toast.success(t('تم رفع المستند'));
    } catch (e) { toast.error(e.message || t('فشل الرفع')); } finally { setBusy(null); }
  };
  const submitSign = async (id) => {
    const sg = signing[id] || {};
    if (!sg.contract || !sg.promissory) return toast.error(t('يجب رفع العقد والسند موقّعين'));
    setBusy(id + 'sign');
    try {
      await financingAPI.signAgreement(id, { signed_contract: sg.contract, signed_promissory: sg.promissory });
      toast.success(t('تم توقيع المستندات وإرفاقها للممول')); load();
    } catch (e) { toast.error(e.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };

  const DocRow = ({ label, url, name }) => (
    <div className="flex items-center gap-2 border rounded-xl p-2 text-xs" style={{ borderColor: '#E5E7EF' }}>
      <FileText size={16} style={{ color: '#4F46E5' }} />
      <span className="flex-1 font-bold text-slate-700 truncate">{t(label)}<span className="text-slate-400 font-normal"> · {name || ''}</span></span>
      {url
        ? <>
            <a href={url} target="_blank" rel="noreferrer" className="px-2 py-0.5 rounded font-bold" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{t('عرض')}</a>
            <a href={dl(url)} download className="px-2 py-0.5 rounded font-bold" style={{ background: '#ECFDF5', color: '#059669' }}>{t('تحميل')}</a>
          </>
        : <span className="text-slate-300">—</span>}
    </div>
  );

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center gap-2">
        <FileSignature size={22} style={{ color: '#4F46E5' }} />
        <h1 className="text-xl font-bold text-slate-800">{t('العقود والسندات')}</h1>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-12">{t('جارٍ التحميل...')}</p>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border py-14 text-center" style={{ borderColor: '#E5E7EF' }}>
          <FileSignature size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-400">{t('لا توجد عقود بعد. تُنشأ عند تمويل الممول للفاتورة.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(a => {
            const sg = signing[a.id] || {};
            const signed = !!a.signed_at;
            return (
              <div key={a.id} className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: '#E5E7EF' }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-slate-800">{a.invoice_number}</span>
                    <span className="text-xs text-slate-400 mr-2">{a.buyer_name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#4F46E5' }}>{Number(a.requested_amount || 0).toLocaleString()} {t('ر.س')}</span>
                  {signed
                    ? <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: '#ECFDF5', color: '#059669' }}>{t('موقّع')}</span>
                    : <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: '#FEF3C7', color: '#92400E' }}>{t('بانتظار توقيع المشتري')}</span>}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1.5">{t('مستندات الممول')}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <DocRow label="العقد" url={a.contract_url} name={a.contract_name} />
                    <DocRow label="سند لأمر" url={a.promissory_url} name={a.promissory_name} />
                  </div>
                </div>

                {signed ? (
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1.5">{t('النسخ الموقّعة من المشتري')}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <DocRow label="العقد" url={a.signed_contract_url} name={a.signed_contract_name} />
                      <DocRow label="سند لأمر" url={a.signed_promissory_url} name={a.signed_promissory_name} />
                    </div>
                  </div>
                ) : isBuyer ? (
                  <div className="border-t pt-3" style={{ borderColor: '#F1F5F9' }}>
                    <p className="text-xs font-bold text-slate-500 mb-1.5">{t('ارفع النسخ الموقّعة')}</p>
                    <div className="grid sm:grid-cols-2 gap-2 mb-2">
                      {[['contract', 'العقد'], ['promissory', 'سند لأمر']].map(([k, lbl]) => (
                        <label key={k} className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs cursor-pointer border-2 border-dashed"
                          style={{ borderColor: sg[k] ? '#059669' : '#C7CBE8', color: sg[k] ? '#059669' : '#4F46E5', background: '#F8FAFC' }}>
                          {sg[k] ? <Check size={14} /> : <Upload size={14} />}
                          <span className="truncate">{busy === a.id + k ? t('جارٍ...') : (sg[k] ? sg[k].name : t(lbl))}</span>
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => e.target.files[0] && upSigned(a.id, k, e.target.files[0])} />
                        </label>
                      ))}
                    </div>
                    <button onClick={() => submitSign(a.id)} disabled={busy === a.id + 'sign'}
                      className="w-full py-2.5 rounded-xl text-white font-bold disabled:opacity-50 hover:opacity-90" style={{ background: '#4F46E5' }}>
                      {busy === a.id + 'sign' ? t('جارٍ...') : t('تأكيد التوقيع وإرفاق للممول')}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">{t('بانتظار توقيع المشتري')}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
