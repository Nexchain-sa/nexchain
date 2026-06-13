import React, { useState, useEffect } from 'react';
import { dealAPI } from '../utils/api';
import { Workflow, Check, FileText, Banknote, Landmark, CreditCard, CheckCircle2 } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const STAGES = [
  { key: 'created',   label: 'إنشاء الصفقة', icon: FileText },
  { key: 'financing', label: 'طلب التمويل',  icon: Banknote },
  { key: 'funded',    label: 'تمويل',         icon: Landmark },
  { key: 'paying',    label: 'أقساط جارية',   icon: CreditCard },
  { key: 'done',      label: 'مكتملة',        icon: CheckCircle2 },
];

function stageIndex(d) {
  const paidAll = d.inst_total > 0 && d.inst_paid >= d.inst_total;
  if (paidAll) return 4;                                            // مكتملة
  if (d.inst_total > 0) return 3;                                   // أقساط جارية
  if (d.status === 'financed' || d.financing_status === 'funded') return 2; // ممولة
  if (d.status === 'financing_requested' || d.financing_status === 'open') return 1; // طلب تمويل
  return 0;                                                          // أنشئت
}

const isCancelled = (d) => ['cancelled'].includes(d.status);
const money = (v) => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

export default function Deals() {
  const { t, dir } = useLang();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealAPI.list().then(r => { setDeals(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center gap-2">
        <Workflow size={22} style={{ color: '#4F46E5' }} />
        <h1 className="text-xl font-bold text-slate-800">{t('الصفقات')}</h1>
        <span className="text-xs text-slate-400">{t('— تتبّع مراحل كل صفقة')}</span>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-12">{t('جارٍ التحميل...')}</p>
      ) : deals.length === 0 ? (
        <div className="bg-white rounded-2xl border py-14 text-center" style={{ borderColor: '#E5E7EF' }}>
          <Workflow size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-400">{t('لا توجد صفقات بعد. تبدأ الصفقة بإنشاء فاتورة ثم طلب تمويلها.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map(d => {
            const active = stageIndex(d);
            const cancelled = isCancelled(d);
            return (
              <div key={d.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EF' }}>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{d.invoice_number}</span>
                      <span className="text-xs text-slate-400">{d.buyer_name || '-'} ← {d.supplier_name || '-'}</span>
                    </div>
                    <p className="text-lg font-bold mt-0.5" style={{ color: '#4F46E5' }}>{money(d.amount)} <span className="text-xs text-slate-400">{t('ر.س')}</span></p>
                  </div>
                  {cancelled
                    ? <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#FEE2E2', color: '#DC2626' }}>{t('ملغاة')}</span>
                    : <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{t(STAGES[active].label)}</span>}
                  {d.inst_total > 0 && (
                    <span className="text-xs text-slate-500">{t('الأقساط:')} {d.inst_paid}/{d.inst_total} {t('مدفوعة')}</span>
                  )}
                  {Number(d.earnest_amount) > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background:'#FEF3C7', color:'#92400E' }}>{t('مبلغ جدية:')} {money(d.earnest_amount)} {t('ر.س')}</span>
                  )}
                </div>

                {/* Stepper */}
                <div className="flex items-center">
                  {STAGES.map((st, i) => {
                    const done = !cancelled && i < active;
                    const current = !cancelled && i === active;
                    const Icon = st.icon;
                    const color = done ? '#059669' : current ? '#4F46E5' : '#CBD5E1';
                    return (
                      <React.Fragment key={st.key}>
                        <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 56 }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: done ? '#ECFDF5' : current ? '#EEF2FF' : '#F1F5F9', color }}>
                            {done ? <Check size={16} /> : <Icon size={16} />}
                          </div>
                          <span className="text-[11px] font-bold text-center" style={{ color: current || done ? '#1E293B' : '#94A3B8' }}>{t(st.label)}</span>
                        </div>
                        {i < STAGES.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 rounded-full" style={{ background: i < active && !cancelled ? '#059669' : '#E5E7EF' }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {d.inst_total > 0 && (
                  <div className="mt-4 bg-[#F4F6FB] rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((d.inst_paid / d.inst_total) * 100)}%`, background: '#059669' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
