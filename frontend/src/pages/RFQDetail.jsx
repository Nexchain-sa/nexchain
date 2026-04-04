import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfqAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './Dashboard';
import { Star, Clock, DollarSign, Package, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RFQDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfq,    setRfq]    = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setL]     = useState(true);
  const [showQuoteForm, setShowQF] = useState(false);
  const [quoteForm, setQF]  = useState({ unit_price:'', total_price:'', delivery_days:'', validity_days:'30', payment_terms:'30 يوم', notes:'' });
  const [submitting, setSub] = useState(false);
  const [awarding, setAward] = useState(null);

  const load = () => {
    Promise.all([rfqAPI.get(id), rfqAPI.getQuotes(id)])
      .then(([r,q]) => { setRfq(r.data.data); setQuotes(q.data.data||[]); })
      .catch(() => toast.error('خطأ في تحميل الطلب'))
      .finally(() => setL(false));
  };

  useEffect(() => { load(); }, [id]);

  const submitQuote = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await rfqAPI.submitQuote(id, quoteForm);
      toast.success('تم تقديم عرضك بنجاح!');
      setShowQF(false); load();
    } catch(err) { toast.error(err.response?.data?.message || 'خطأ'); }
    finally { setSub(false); }
  };

  const award = async (quoteId) => {
    if (!window.confirm('هل أنت متأكد من ترسية هذا العطاء؟')) return;
    setAward(quoteId);
    try {
      await rfqAPI.award(id, quoteId);
      toast.success('تم ترسية العطاء وإنشاء أمر الشراء!');
      load();
    } catch(err) { toast.error(err.response?.data?.message || 'خطأ'); }
    finally { setAward(null); }
  };

  const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] text-sm";

  if (loading) return <div className="text-center py-20 text-[#90A4AE] font-arabic">جارٍ التحميل...</div>;
  if (!rfq)    return <div className="text-center py-20 text-red-400 font-arabic">الطلب غير موجود</div>;

  return (
    <div className="font-arabic space-y-6 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#00D4FF] font-mono text-sm bg-[#00D4FF15] px-3 py-1 rounded-lg">{rfq.rfq_number}</span>
            <StatusBadge status={rfq.status}/>
          </div>
          <h1 className="text-xl font-bold text-white">{rfq.title}</h1>
          <p className="text-[#90A4AE] text-sm mt-1">{rfq.buyer_company}</p>
        </div>
        {user?.role === 'supplier' && rfq.status === 'open' && (
          <button onClick={() => setShowQF(!showQuoteForm)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white text-sm font-bold hover:opacity-90 shadow-lg flex-shrink-0">
            {showQuoteForm ? 'إلغاء' : '📤 تقديم عرض'}
          </button>
        )}
      </div>

      {/* RFQ details */}
      <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-5">
        <h2 className="font-bold text-white mb-4">تفاصيل الطلب</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            {icon:Package, label:'الكمية', value:rfq.quantity||'غير محدد'},
            {icon:DollarSign, label:'الميزانية', value: rfq.budget_max ? `SAR ${Number(rfq.budget_max).toLocaleString()}` : 'مفتوحة'},
            {icon:Clock, label:'تاريخ الإغلاق', value:new Date(rfq.closing_date).toLocaleDateString('ar-SA')},
            {icon:Star, label:'الفئة', value:rfq.category_name||'—'},
          ].map(({icon:Icon,label,value})=>(
            <div key={label} className="bg-[#0A0F2E] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} className="text-[#00D4FF]"/>
                <span className="text-xs text-[#90A4AE]">{label}</span>
              </div>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
        {rfq.description && <p className="text-[#90A4AE] text-sm leading-relaxed">{rfq.description}</p>}
      </div>

      {/* Quote submission form */}
      {showQuoteForm && (
        <div className="bg-[#0D1B5E] border border-[#7B2FFF44] rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4">تقديم عرض سعر</h2>
          <form onSubmit={submitQuote} className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-[#90A4AE] mb-1.5 block">سعر الوحدة (SAR) *</label>
              <input required type="number" className={inp} value={quoteForm.unit_price} onChange={e=>setQF({...quoteForm,unit_price:e.target.value,total_price:e.target.value})}/></div>
            <div><label className="text-xs text-[#90A4AE] mb-1.5 block">إجمالي العرض (SAR) *</label>
              <input required type="number" className={inp} value={quoteForm.total_price} onChange={e=>setQF({...quoteForm,total_price:e.target.value})}/></div>
            <div><label className="text-xs text-[#90A4AE] mb-1.5 block">مدة التسليم (أيام)</label>
              <input type="number" className={inp} value={quoteForm.delivery_days} onChange={e=>setQF({...quoteForm,delivery_days:e.target.value})}/></div>
            <div><label className="text-xs text-[#90A4AE] mb-1.5 block">شروط الدفع</label>
              <select className={inp} value={quoteForm.payment_terms} onChange={e=>setQF({...quoteForm,payment_terms:e.target.value})}>
                <option>30 يوم</option><option>60 يوم</option><option>90 يوم</option><option>فوري</option>
              </select>
            </div>
            <div className="col-span-2"><label className="text-xs text-[#90A4AE] mb-1.5 block">ملاحظات</label>
              <textarea className={inp} rows={3} value={quoteForm.notes} onChange={e=>setQF({...quoteForm,notes:e.target.value})}/></div>
            <div className="col-span-2">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg">
                {submitting ? 'جارٍ الإرسال...' : '✅ تقديم العرض'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quotes list */}
      <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#00D4FF11] flex items-center justify-between">
          <h2 className="font-bold text-white">العروض المستلمة</h2>
          <span className="text-[#00C853] text-sm font-bold">{quotes.length} عرض</span>
        </div>
        {quotes.length === 0
          ? <p className="text-center py-10 text-[#90A4AE] text-sm">لا توجد عروض بعد</p>
          : (
            <div className="divide-y divide-[#00D4FF08]">
              {quotes.map((q, i) => (
                <div key={q.id} className={`flex items-center gap-4 px-5 py-4 ${i===0?'bg-[#00C85308]':''}`}>
                  {i===0 && <span className="text-[#00C853] text-xs font-bold bg-[#00C85320] px-2 py-1 rounded-lg flex-shrink-0">⭐ الأفضل</span>}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{q.supplier_company}</p>
                    <p className="text-xs text-[#90A4AE]">تسليم: {q.delivery_days||'—'} يوم · {q.payment_terms||'—'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[#00C853] font-bold">SAR {Number(q.total_price).toLocaleString()}</p>
                    <p className="text-xs text-[#90A4AE]">صلاحية {q.validity_days} يوم</p>
                  </div>
                  <StatusBadge status={q.status}/>
                  {user?.role==='buyer' && rfq.status==='open' && (
                    <button onClick={()=>award(q.id)} disabled={awarding===q.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00C85320] text-[#00C853] text-xs font-bold hover:bg-[#00C85340] transition-colors disabled:opacity-50">
                      <CheckCircle size={13}/>
                      {awarding===q.id ? '...' : 'ترسية'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
