import React, { useState, useEffect } from 'react';
import { secondaryAPI } from '../utils/api';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Repeat, TrendingUp, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Secondary() {
  const { t, dir } = useLang();
  const { fmt } = useCurrency();
  const [tab, setTab] = useState('market');
  const [listings, setListings] = useState([]);
  const [positions, setPositions] = useState([]);
  const [busy, setBusy] = useState(null);
  const [ask, setAsk] = useState({});

  const loadMarket = () => secondaryAPI.list().then(r => setListings(r.data.data || [])).catch(() => {});
  const loadPositions = () => secondaryAPI.myPositions().then(r => setPositions(r.data.data || [])).catch(() => {});
  useEffect(() => { loadMarket(); loadPositions(); }, []);

  const buy = async (id) => {
    setBusy(id);
    try { await secondaryAPI.buy(id); toast.success(t('تم شراء المركز وانتقاله إلى محفظتك')); loadMarket(); loadPositions(); }
    catch (e) { toast.error(e.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };
  const listForSale = async (bid_id) => {
    if (!ask[bid_id]) return toast.error(t('أدخل سعر البيع'));
    setBusy(bid_id);
    try { await secondaryAPI.create({ bid_id, ask_price: ask[bid_id] }); toast.success(t('تم إدراج المركز للبيع')); loadPositions(); loadMarket(); }
    catch (e) { toast.error(e.response?.data?.message || t('خطأ')); } finally { setBusy(null); }
  };

  const yieldPct = (outstanding, ask_price) => {
    const o = Number(outstanding) || 0, a = Number(ask_price) || 0;
    if (!a) return 0;
    return Math.round((o - a) / a * 100);
  };

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center gap-2">
        <Repeat size={22} style={{ color: '#4F46E5' }} />
        <h1 className="text-xl font-bold text-slate-800">{t('السوق الثانوي')}</h1>
        <span className="text-xs text-slate-400">{t('— تداول مراكز التمويل (سيولة)')}</span>
      </div>

      <div className="flex gap-1 bg-white p-1 rounded-xl w-fit border" style={{ borderColor: '#EEF2FF' }}>
        {[['market', '🛒 السوق'], ['mine', '📁 مراكزي']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === k ? 'bg-[#4F46E5] !text-white' : 'text-slate-500 hover:text-slate-800'}`}>{t(l)}</button>
        ))}
      </div>

      {tab === 'market' && (
        listings.length === 0
          ? <div className="bg-white rounded-2xl border py-14 text-center" style={{ borderColor: '#E5E7EF' }}><Tag size={36} className="mx-auto text-slate-300 mb-2" /><p className="text-slate-400">{t('لا توجد مراكز معروضة حاليًا.')}</p></div>
          : <div className="space-y-3">
              {listings.map(l => (
                <div key={l.id} className="bg-white rounded-2xl border p-5 flex items-center gap-4 flex-wrap" style={{ borderColor: '#E5E7EF' }}>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{l.invoice_number}</span>
                      <span className="text-xs text-slate-400">{l.buyer_name}</span>
                      {l.financing_mode === 'shariah' && <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: '#ECFDF5', color: '#0F766E' }}>{t('🌙 متوافق مع الشريعة')}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{t('البائع')}: {l.seller_name} · {t('الأقساط')}: {l.inst_paid}/{l.inst_total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-slate-400">{t('المتبقّي')}</p>
                    <p className="text-sm font-bold text-slate-700">{fmt(l.outstanding)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-slate-400">{t('سعر الطلب')}</p>
                    <p className="text-sm font-bold" style={{ color: '#4F46E5' }}>{fmt(l.ask_price)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-slate-400">{t('العائد المتوقع')}</p>
                    <p className="text-sm font-bold flex items-center gap-1" style={{ color: '#059669' }}><TrendingUp size={13} /> {yieldPct(l.outstanding, l.ask_price)}%</p>
                  </div>
                  <button onClick={() => buy(l.id)} disabled={busy === l.id || l.is_own}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90" style={{ background: l.is_own ? '#94A3B8' : '#4F46E5' }}>
                    {l.is_own ? t('مركزك') : (busy === l.id ? t('جارٍ...') : t('شراء'))}
                  </button>
                </div>
              ))}
            </div>
      )}

      {tab === 'mine' && (
        positions.length === 0
          ? <div className="bg-white rounded-2xl border py-14 text-center" style={{ borderColor: '#E5E7EF' }}><Tag size={36} className="mx-auto text-slate-300 mb-2" /><p className="text-slate-400">{t('لا توجد مراكز لديك. موّل صفقة لتظهر هنا.')}</p></div>
          : <div className="space-y-3">
              {positions.map(p => (
                <div key={p.bid_id} className="bg-white rounded-2xl border p-5 flex items-center gap-3 flex-wrap" style={{ borderColor: '#E5E7EF' }}>
                  <div className="flex-1 min-w-[160px]">
                    <span className="font-bold text-slate-800">{p.invoice_number}</span>
                    <span className="text-xs text-slate-400 mr-2">{p.buyer_name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{t('المستثمَر')}: {fmt(p.offered_amount)} · {t('المتبقّي')}: {fmt(p.outstanding)} · {p.inst_paid}/{p.inst_total}</p>
                  </div>
                  {p.listed
                    ? <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#FEF3C7', color: '#92400E' }}>{t('معروض للبيع')}</span>
                    : <div className="flex gap-2 items-center">
                        <input type="number" placeholder={t('سعر البيع')} value={ask[p.bid_id] || ''} onChange={e => setAsk({ ...ask, [p.bid_id]: e.target.value })}
                          className="w-32 rounded-xl px-3 py-2 text-sm border focus:outline-none" style={{ borderColor: '#E5E7EF' }} />
                        <button onClick={() => listForSale(p.bid_id)} disabled={busy === p.bid_id}
                          className="px-3 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: '#4F46E5' }}>{t('إدراج للبيع')}</button>
                      </div>}
                </div>
              ))}
            </div>
      )}
    </div>
  );
}
