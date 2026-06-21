import React, { useState, useEffect } from 'react';
import { walletAPI } from '../utils/api';
import { useLang } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, TrendingUp, Hash, Download, Printer } from 'lucide-react';
import { downloadCSV, tableHTML, printReport } from '../utils/exporters';

const CAT = {
  investment: { label: 'استثمار', color: '#4F46E5' },
  return:     { label: 'عائد', color: '#059669' },
  financing:  { label: 'تمويل', color: '#0D9488' },
  repayment:  { label: 'سداد', color: '#D97706' },
  escrow:     { label: 'ضمان تصنيع', color: '#7C3AED' },
  release:    { label: 'إفراج دفعة', color: '#059669' },
  secondary:  { label: 'سوق ثانوي', color: '#BE123C' },
};

export default function Wallet() {
  const { t, dir } = useLang();
  const { fmt } = useCurrency();
  const [d, setD] = useState(null);

  useEffect(() => { walletAPI.ledger().then(r => setD(r.data.data)).catch(() => setD({ transactions: [], summary: {} })); }, []);

  const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#E5E7EF' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl" style={{ background: color + '15' }}><Icon size={18} style={{ color }} /></div>
        <span className="text-xs font-medium text-slate-500">{t(label)}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );

  if (!d) return <p className="text-center text-slate-400 py-12 font-arabic" dir={dir}>{t('جارٍ التحميل...')}</p>;
  const s = d.summary || {};

  const headers = [t('التاريخ'), t('الوصف'), t('النوع'), t('الاتجاه'), t('المبلغ')];
  const rows = (d.transactions || []).map(x => [
    x.date ? new Date(x.date).toLocaleDateString('en-CA') : '',
    x.label, t((CAT[x.category] || {}).label || x.category),
    x.dir === 'in' ? t('داخل') : t('خارج'), x.amount,
  ]);
  const exportCSV = () => downloadCSV('flowriz-wallet.csv', headers, rows);
  const exportPDF = () => printReport({ title: t('المحفظة المالية'), subtitle: `${t('الصافي')}: ${fmt(s.net)} · ${s.count || 0} ${t('عدد الحركات')}`, dir, sections: [{ html: tableHTML(headers, rows) }] });

  return (
    <div className="font-arabic space-y-5" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <WalletIcon size={22} style={{ color: '#4F46E5' }} />
          <h1 className="text-xl font-bold text-slate-800">{t('المحفظة المالية')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={!rows.length} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border disabled:opacity-50 hover:bg-slate-50" style={{ borderColor: '#E5E7EF', color: '#475569' }}><Download size={14} /> CSV</button>
          <button onClick={exportPDF} disabled={!rows.length} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border disabled:opacity-50 hover:bg-slate-50" style={{ borderColor: '#E5E7EF', color: '#475569' }}><Printer size={14} /> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={ArrowDownLeft} label="إجمالي الداخل" value={fmt(s.total_in)} color="#059669" />
        <Stat icon={ArrowUpRight} label="إجمالي الخارج" value={fmt(s.total_out)} color="#DC2626" />
        <Stat icon={TrendingUp} label="الصافي" value={fmt(s.net)} color={(s.net || 0) >= 0 ? '#059669' : '#DC2626'} />
        <Stat icon={Hash} label="عدد الحركات" value={s.count || 0} color="#4F46E5" />
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EF' }}>
        {(!d.transactions || d.transactions.length === 0) ? (
          <div className="text-center py-14">
            <WalletIcon size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400">{t('لا توجد حركات مالية بعد.')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs" style={{ background: '#F8FAFC' }}>
                {['التاريخ', 'الوصف', 'النوع', 'المبلغ'].map(h => (
                  <th key={h} className="text-right font-medium px-4 py-3">{t(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.transactions.map((x, i) => {
                const c = CAT[x.category] || { label: x.category, color: '#64748B' };
                const isIn = x.dir === 'in';
                return (
                  <tr key={i} className="border-t" style={{ borderColor: '#F1F5F9' }}>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{x.date ? new Date(x.date).toLocaleDateString(dir === 'rtl' ? 'ar' : 'en') : '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{x.label}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: c.color + '15', color: c.color }}>{t(c.label)}</span>
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: isIn ? '#059669' : '#DC2626' }}>
                      <span className="inline-flex items-center gap-1">
                        {isIn ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                        {isIn ? '+' : '−'} {fmt(x.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
