import React, { useState, useEffect } from 'react';
import { mfgAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Factory, Plus, CheckCircle, XCircle, ChevronDown, Sparkles, Banknote, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGE_STATUS = {
  pending:     { label: 'بانتظار',       color: '#64748B', bg: '#F1F5F9' },
  in_progress: { label: 'قيد التنفيذ',   color: '#4F46E5', bg: '#EEF2FF' },
  qa_review:   { label: 'بانتظار الفحص', color: '#D97706', bg: '#FEF3C7' },
  passed:      { label: 'مجتاز',         color: '#059669', bg: '#ECFDF5' },
  failed:      { label: 'مرفوض',         color: '#DC2626', bg: '#FEE2E2' },
};
const ORDER_STATUS = {
  pending_match: { label: 'بانتظار إسناد مصنع', color: '#D97706', bg: '#FEF3C7' },
  in_production: { label: 'قيد الإنتاج',        color: '#4F46E5', bg: '#EEF2FF' },
  completed:     { label: 'مكتمل',              color: '#059669', bg: '#ECFDF5' },
  cancelled:     { label: 'ملغى',               color: '#DC2626', bg: '#FEE2E2' },
};

const CATEGORIES = [['apparel','ملابس'],['textile','نسيج منزلي'],['packaging','تغليف'],['promotional','منتجات ترويجية'],['furniture','أثاث وتشطيب']];
const COMPLEXITIES = [['simple','بسيط'],['medium','متوسط'],['complex','معقّد']];

export default function Manufacturing() {
  const { user } = useAuth();
  const { t, dir } = useLang();
  const { fmt } = useCurrency();
  const role = user?.role;
  const isBuyer = role === 'buyer';
  const isFactory = role === 'supplier';
  const isAdmin = ['admin', 'owner'].includes(role);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [stages, setStages] = useState([]);
  const [busy, setBusy] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ product: '', specs: '', quantity: '', total_amount: '', category: 'apparel', complexity: 'simple', factory_id: '' });
  const [est, setEst] = useState(null);
  const [sugg, setSugg] = useState({});
  const [factories, setFactories] = useState([]);
  const [matchSel, setMatchSel] = useState({});
  const [offers, setOffers] = useState({});
  const [offerForm, setOfferForm] = useState({});
  const [facFilter, setFacFilter] = useState('all');

  const load = () => mfgAPI.list().then(r => { setOrders(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); if (isAdmin || isBuyer) mfgAPI.factories().then(r => setFactories(r.data.data || [])).catch(() => {}); }, []);
  useEffect(() => { if (!showCreate) return; mfgAPI.estimate({ category: form.category, complexity: form.complexity, quantity: form.quantity }).then(r => setEst(r.data.data)).catch(() => {}); }, [showCreate, form.category, form.complexity, form.quantity]);

  const loadOffers = async (oid) => { try { const r = await mfgAPI.offers(oid); setOffers(x => ({ ...x, [oid]: r.data.data || [] })); } catch {} };
  const openOrder = async (o) => {
    if (expanded === o.id) { setExpanded(null); return; }
    setExpanded(o.id);
    const r = await mfgAPI.stages(o.id); setStages(r.data.data || []);
    if ((isBuyer || isAdmin) && o.status === 'pending_match') loadOffers(o.id);
  };
  const reloadStages = async (oid) => { const r = await mfgAPI.stages(oid); setStages(r.data.data || []); load(); };

  const submitOffer = async (oid) => {
    const f = offerForm[oid] || {};
    if (!f.offered_price) return toast.error(t('أدخل السعر'));
    setBusy('offer' + oid);
    try { await mfgAPI.submitOffer(oid, { offered_price: f.offered_price, lead_days: f.lead_days, note: f.note }); toast.success(t('تم إرسال العرض')); setOfferForm(x => ({ ...x, [oid]: {} })); load(); }
    catch (e) { toast.error(e.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };
  const acceptOffer = async (offerId, oid) => {
    setBusy(offerId);
    try { const r = await mfgAPI.acceptOffer(offerId); toast.success(r.data.message); setExpanded(null); load(); }
    catch (e) { toast.error(e.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };
  const financeOrder = async (oid) => {
    setBusy('fin' + oid);
    try { const r = await mfgAPI.finance(oid); toast.success(r.data.message); load(); }
    catch (e) { toast.error(e.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };

  const create = async (e) => {
    e.preventDefault(); setBusy('create');
    try { await mfgAPI.create(form); toast.success(t('تم إنشاء أمر التصنيع')); setShowCreate(false); setForm({ product: '', specs: '', quantity: '', total_amount: '', category: 'apparel', complexity: 'simple', factory_id: '' }); load(); }
    catch (err) { toast.error(err.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };
  const match = async (oid) => {
    if (!matchSel[oid]) return toast.error(t('اختر مصنعًا'));
    setBusy(oid);
    try { await mfgAPI.match(oid, { factory_id: matchSel[oid] }); toast.success(t('تم إسناد المصنع')); load(); }
    catch { toast.error(t('خطأ')); } finally { setBusy(null); }
  };
  const loadSugg = async (oid) => { try { const r = await mfgAPI.suggest(oid); setSugg(x => ({ ...x, [oid]: r.data.data || [] })); } catch { toast.error(t('خطأ')); } };
  const matchTo = async (oid, fid) => { setBusy(oid); try { await mfgAPI.match(oid, { factory_id: fid }); toast.success(t('تم إسناد المصنع')); load(); } catch { toast.error(t('خطأ')); } finally { setBusy(null); } };
  const receive = async (sid, oid) => { setBusy(sid); try { const r = await mfgAPI.receive(sid); toast.success(r.data.message); reloadStages(oid); } catch (e) { toast.error(e.response?.data?.message || t('خطأ')); } finally { setBusy(null); } };
  const progress = async (sid, status, oid) => { setBusy(sid); try { await mfgAPI.progress(sid, { status }); reloadStages(oid); } catch { toast.error(t('خطأ')); } finally { setBusy(null); } };
  const qa = async (sid, pass, oid) => { setBusy(sid); try { const r = await mfgAPI.qa(sid, { pass }); toast.success(r.data.message); reloadStages(oid); } catch { toast.error(t('خطأ')); } finally { setBusy(null); } };

  const inp = "w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none";

  const facCounts = {
    open: orders.filter(o => o.status === 'pending_match').length,
    mine: orders.filter(o => o.my_offer).length,
    prod: orders.filter(o => o.status === 'in_production').length,
    done: orders.filter(o => o.status === 'completed').length,
  };
  const shown = isFactory ? orders.filter(o =>
    facFilter === 'open' ? o.status === 'pending_match'
      : facFilter === 'mine' ? !!o.my_offer
        : facFilter === 'prod' ? ['in_production', 'completed'].includes(o.status)
          : true) : orders;

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Factory size={22} style={{ color: '#4F46E5' }} /> {t('التصنيع')}</h1>
        {isBuyer && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#4F46E5' }}><Plus size={15} /> {t('أمر تصنيع جديد')}</button>}
      </div>

      {isFactory && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['all', t('الكل'), orders.length, '#4F46E5'],
            ['open', t('مفتوحة للعروض'), facCounts.open, '#D97706'],
            ['mine', t('عروضي المقدّمة'), facCounts.mine, '#7C3AED'],
            ['prod', t('قيد الإنتاج/مكتملة'), facCounts.prod + facCounts.done, '#059669'],
          ].map(([k, label, val, color]) => (
            <button key={k} onClick={() => setFacFilter(k)} className="bg-white rounded-2xl p-4 border text-right transition-all" style={{ borderColor: facFilter === k ? color : '#E5E7EF', boxShadow: facFilter === k ? `0 0 0 1px ${color}` : 'none' }}>
              <p className="text-2xl font-bold" style={{ color }}>{val}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </button>
          ))}
        </div>
      )}

      {loading ? <p className="text-center text-slate-400 py-12">{t('جارٍ التحميل...')}</p>
        : shown.length === 0 ? (
          <div className="bg-white rounded-2xl border py-14 text-center" style={{ borderColor: '#E5E7EF' }}>
            <Factory size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400">{t('لا توجد أوامر تصنيع بعد.')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(o => {
              const os = ORDER_STATUS[o.status] || ORDER_STATUS.pending_match;
              const held = Number(o.escrow_funded || o.total_amount) - Number(o.released_amount || 0);
              return (
                <div key={o.id} className="bg-white rounded-2xl border" style={{ borderColor: '#E5E7EF' }}>
                  <div className="p-4 flex items-center gap-3 flex-wrap cursor-pointer" onClick={() => openOrder(o)}>
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{o.order_number}</span>
                        <span className="text-xs text-slate-400">{o.product}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{o.customer_name || '-'} {o.factory_name ? `← ${o.factory_name}` : ''}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: os.bg, color: os.color }}>{t(os.label)}</span>
                    <div className="text-left">
                      {o.status === 'pending_match' ? (
                        <p className="text-sm font-bold" style={{ color: '#D97706' }}>{o.offer_count || 0} {t('عرض')}</p>
                      ) : (
                        <>
                          <p className="text-sm font-bold" style={{ color: '#059669' }}>{t('مُفرَج')}: {fmt(o.released_amount)}</p>
                          <p className="text-[11px] text-slate-400">🛡️ {t('مضمون في الضمان')}: {fmt(held)} · {o.stage_done}/{o.stage_total}</p>
                        </>
                      )}
                    </div>
                    <ChevronDown size={16} className="text-slate-400" style={{ transform: expanded === o.id ? 'rotate(180deg)' : 'none' }} />
                  </div>

                  {expanded === o.id && (
                    <div className="border-t p-4 space-y-2" style={{ borderColor: '#F1F5F9' }}>
                      {/* تمويل أمر التصنيع */}
                      {(isBuyer || isAdmin) && o.status !== 'pending_match' && (
                        o.financing_request_id
                          ? <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: '#059669' }}><CheckCircle size={13} /> {t('تم تقديم طلب تمويل لهذا الأمر')}</span>
                          : <button onClick={() => financeOrder(o.id)} disabled={busy === 'fin' + o.id} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#FEF3C7', color: '#92400E' }}><Banknote size={13} /> {t('طلب تمويل هذا الأمر')}</button>
                      )}

                      {/* عرض المصنع (سوق التصنيع) */}
                      {isFactory && o.status === 'pending_match' && (
                        <div className="bg-[#F8FAFC] rounded-xl p-3 space-y-2">
                          <p className="text-xs font-bold text-slate-600">{o.my_offer ? t('عرضك الحالي (يمكنك تحديثه)') : t('قدّم عرضك لهذا الطلب')}</p>
                          {o.my_offer && <p className="text-[11px] text-slate-500">{t('السعر')}: {fmt(o.my_offer.offered_price)} · {t('مهلة')}: {o.my_offer.lead_days || '-'} {t('يوم')} · <span style={{ color: o.my_offer.status === 'accepted' ? '#059669' : o.my_offer.status === 'rejected' ? '#DC2626' : '#4F46E5' }}>{t(o.my_offer.status === 'accepted' ? 'مقبول' : o.my_offer.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة')}</span></p>}
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder={t('سعرك للطلب')} className={inp} style={{ borderColor: '#E5E7EF' }} value={offerForm[o.id]?.offered_price || ''} onChange={e => setOfferForm(x => ({ ...x, [o.id]: { ...x[o.id], offered_price: e.target.value } }))} />
                            <input type="number" placeholder={t('مهلة التنفيذ (يوم)')} className={inp} style={{ borderColor: '#E5E7EF' }} value={offerForm[o.id]?.lead_days || ''} onChange={e => setOfferForm(x => ({ ...x, [o.id]: { ...x[o.id], lead_days: e.target.value } }))} />
                          </div>
                          <input placeholder={t('ملاحظة (اختياري)')} className={inp} style={{ borderColor: '#E5E7EF' }} value={offerForm[o.id]?.note || ''} onChange={e => setOfferForm(x => ({ ...x, [o.id]: { ...x[o.id], note: e.target.value } }))} />
                          <button onClick={() => submitOffer(o.id)} disabled={busy === 'offer' + o.id} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#4F46E5' }}><Send size={14} /> {o.my_offer ? t('تحديث العرض') : t('إرسال العرض')}</button>
                        </div>
                      )}

                      {/* عروض المصانع للمشتري/الأونر */}
                      {(isBuyer || isAdmin) && o.status === 'pending_match' && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600">{t('عروض المصانع')} ({(offers[o.id] || []).length})</p>
                          {(offers[o.id] || []).length === 0 && <p className="text-xs text-slate-400">{t('لا توجد عروض بعد — الطلب معروض على جميع المصانع.')}</p>}
                          {(offers[o.id] || []).map((of, idx) => (
                            <div key={of.id} className="flex items-center gap-2 border rounded-xl p-2 text-xs" style={{ borderColor: idx === 0 ? '#059669' : '#E5E7EF', background: idx === 0 ? '#ECFDF5' : '#FFFFFF' }}>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-700 truncate">{of.factory_name || of.factory_person} {idx === 0 && <span style={{ color: '#059669' }}>· {t('الأقل سعرًا')}</span>}</p>
                                <p className="text-[11px] text-slate-400">{t('السعر')}: {fmt(of.offered_price)} · {t('مهلة')}: {of.lead_days || '-'} {t('يوم')} · ★ {Number(of.factory_rating)}</p>
                                {of.note && <p className="text-[11px] text-slate-400 truncate">{of.note}</p>}
                              </div>
                              <button onClick={() => acceptOffer(of.id, o.id)} disabled={busy === of.id} className="px-3 py-1.5 rounded-lg text-white font-bold flex-shrink-0" style={{ background: '#059669' }}>{t('قبول')}</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {isAdmin && o.status === 'pending_match' && (
                       <div className="space-y-2">
                        <button onClick={()=>loadSugg(o.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{background:'#EEF2FF',color:'#4F46E5'}}><Sparkles size={13}/> {t('🤖 اقتراح ذكي للمصنع')}</button>
                        {(sugg[o.id]||[]).map((f,idx)=>(
                          <div key={f.id} className="flex items-center gap-2 border rounded-xl p-2 text-xs" style={{borderColor: idx===0?'#4F46E5':'#E5E7EF', background: idx===0?'#F5F3FF':'#FFFFFF'}}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0" style={{background:'#EEF2FF',color:'#4F46E5'}}>{f.score}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-700 truncate">{f.name} {idx===0 && <span style={{color:'#4F46E5'}}>★</span>}</p>
                              <p className="text-[11px] text-slate-400 truncate">{f.reasons.join(' · ')}</p>
                            </div>
                            <button onClick={()=>matchTo(o.id, f.id)} disabled={busy===o.id} className="px-3 py-1.5 rounded-lg text-white font-bold flex-shrink-0" style={{background:'#4F46E5'}}>{t('إسناد')}</button>
                          </div>
                        ))}
                        <div className="flex gap-2 items-center bg-[#F8FAFC] rounded-xl p-2">
                          <select value={matchSel[o.id] || ''} onChange={e => setMatchSel({ ...matchSel, [o.id]: e.target.value })} className={inp} style={{ borderColor: '#E5E7EF' }}>
                            <option value="">{t('اختر مصنعًا')}</option>
                            {factories.map(f => <option key={f.id} value={f.id}>{f.company_name || f.name}</option>)}
                          </select>
                          <button onClick={() => match(o.id)} disabled={busy === o.id} className="px-4 py-2.5 rounded-xl text-white text-sm font-bold flex-shrink-0" style={{ background: '#4F46E5' }}>{t('إسناد المصنع')}</button>
                        </div>
                       </div>
                      )}
                      {stages.map(s => {
                        const ss = STAGE_STATUS[s.status] || STAGE_STATUS.pending;
                        const isReceipt = (s.name || '').indexOf('التسليم') !== -1;
                        return (
                          <div key={s.id} className="flex items-center gap-3 border rounded-xl p-3" style={{ borderColor: '#E5E7EF' }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: ss.bg, color: ss.color }}>{s.seq}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-700">{t(s.name)} <span className="text-xs text-slate-400">· {Number(s.payment_pct)}%</span></p>
                              {s.qa_note && <p className="text-[11px] text-red-500">{s.qa_note}</p>}
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: ss.bg, color: ss.color }}>{t(ss.label)}</span>
                            {isFactory && o.status === 'in_production' && s.status === 'pending' && <button onClick={() => progress(s.id, 'in_progress', o.id)} disabled={busy === s.id} className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{t('بدء')}</button>}
                            {isFactory && s.status === 'in_progress' && <button onClick={() => progress(s.id, 'qa_review', o.id)} disabled={busy === s.id} className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: '#FEF3C7', color: '#92400E' }}>{t('تم الإنجاز (للفحص)')}</button>}
                            {(isBuyer || isAdmin) && isReceipt && s.status === 'qa_review' && <button onClick={() => receive(s.id, o.id)} disabled={busy === s.id} className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: '#ECFDF5', color: '#059669' }}><CheckCircle size={12}/> {t('تأكيد الاستلام السليم')}</button>}
                            {isAdmin && !isReceipt && s.status === 'qa_review' && (
                              <div className="flex gap-1">
                                <button onClick={() => qa(s.id, true, o.id)} disabled={busy === s.id} className="text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: '#ECFDF5', color: '#059669' }}><CheckCircle size={12} /> {t('اعتماد')}</button>
                                <button onClick={() => qa(s.id, false, o.id)} disabled={busy === s.id} className="text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: '#FEE2E2', color: '#DC2626' }}><XCircle size={12} /> {t('رفض')}</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={dir} onClick={() => setShowCreate(false)}>
          <form onSubmit={create} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-lg text-slate-800">{t('أمر تصنيع جديد')}</h3>
            <input required placeholder={t('المنتج')} className={inp} style={{ borderColor: '#E5E7EF' }} value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className={inp} style={{ borderColor: '#E5E7EF' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(([k,l]) => <option key={k} value={k}>{t(l)}</option>)}
              </select>
              <select className={inp} style={{ borderColor: '#E5E7EF' }} value={form.complexity} onChange={e => setForm({ ...form, complexity: e.target.value })}>
                {COMPLEXITIES.map(([k,l]) => <option key={k} value={k}>{t(l)}</option>)}
              </select>
            </div>
            <textarea placeholder={t('المواصفات')} rows={2} className={inp} style={{ borderColor: '#E5E7EF' }} value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t('الكمية')} className={inp} style={{ borderColor: '#E5E7EF' }} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              <input type="number" placeholder={t('اتركه فارغًا لاستخدام السعر التقديري')} className={inp} style={{ borderColor: '#E5E7EF' }} value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} />
            </div>
            <select className={inp} style={{ borderColor: '#E5E7EF' }} value={form.factory_id} onChange={e => setForm({ ...form, factory_id: e.target.value })}>
              <option value="">{t('اتركه فارغًا لعرض الطلب على المصانع لتقديم عروضها')}</option>
              {factories.map(fc => <option key={fc.id} value={fc.id}>{fc.company_name || fc.name}</option>)}
            </select>
            <p className="text-[11px] text-slate-400 -mt-1">{t('عند تركه فارغًا، يظهر الطلب لكل المصانع لتنافس بعروضها ثم تختار الأنسب.')}</p>
            {est && (
              <div className="rounded-xl p-3 text-xs" style={{ background:'#EEF2FF', color:'#3730A3' }}>
                <div className="flex items-center gap-1 font-bold mb-1"><Sparkles size={13}/> {t('السعر المعياري التقديري')}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>{t('الإجمالي')}: <b>{fmt(est.total)}</b></span>
                  <span>{t('سعر الوحدة')}: {fmt(est.unit_cost)}</span>
                  <span>{t('مهلة')}: {est.lead_days} {t('يوم')}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={busy === 'create'} className="flex-1 py-2.5 rounded-xl text-white font-bold" style={{ background: '#4F46E5' }}>{busy === 'create' ? t('جارٍ...') : t('إنشاء الأمر')}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl border text-slate-600" style={{ borderColor: '#E5E7EF' }}>{t('إلغاء')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
