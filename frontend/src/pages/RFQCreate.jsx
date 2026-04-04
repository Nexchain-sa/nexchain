// RFQCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfqAPI, categoriesAPI } from '../utils/api';
import toast from 'react-hot-toast';

export function RFQCreate() {
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [loading, setL] = useState(false);
  const [form, setForm] = useState({
    title:'', description:'', category_id:'', quantity:'', unit:'',
    budget_min:'', budget_max:'', delivery_date:'', closing_date:''
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => { categoriesAPI.list().then(r=>setCats(r.data.data||[])).catch(()=>{}); },[]);

  const handle = async (e) => {
    e.preventDefault(); setL(true);
    try {
      const res = await rfqAPI.create(form);
      toast.success('تم نشر الطلب بنجاح!');
      navigate(`/rfqs/${res.data.data.id}`);
    } catch(err) {
      toast.error(err.response?.data?.message || 'خطأ في نشر الطلب');
    } finally { setL(false); }
  };

  const inp = "w-full bg-[#0A0F2E] border border-[#00D4FF22] rounded-xl px-4 py-2.5 text-white placeholder-[#455A64] focus:outline-none focus:border-[#00D4FF] text-sm transition-colors";
  const lbl = "block text-xs text-[#90A4AE] mb-1.5 font-medium";

  return (
    <div className="font-arabic max-w-2xl" dir="rtl">
      <h1 className="text-xl font-bold text-white mb-6">📝 طلب عرض سعر جديد (RFQ)</h1>
      <form onSubmit={handle} className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-6 space-y-4">
        <div>
          <label className={lbl}>عنوان الطلب *</label>
          <input required className={inp} placeholder="مثال: توريد 50 جهاز حاسب آلي..." value={form.title} onChange={e=>set('title',e.target.value)}/>
        </div>
        <div>
          <label className={lbl}>الوصف التفصيلي</label>
          <textarea className={inp} rows={4} placeholder="المواصفات والمتطلبات..." value={form.description} onChange={e=>set('description',e.target.value)}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>الفئة</label>
            <select className={inp} value={form.category_id} onChange={e=>set('category_id',e.target.value)}>
              <option value="">اختر الفئة...</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>الكمية</label>
            <input className={inp} placeholder="مثال: 50" value={form.quantity} onChange={e=>set('quantity',e.target.value)}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>الميزانية الدنيا (SAR)</label>
            <input type="number" className={inp} placeholder="0" value={form.budget_min} onChange={e=>set('budget_min',e.target.value)}/>
          </div>
          <div>
            <label className={lbl}>الميزانية القصوى (SAR)</label>
            <input type="number" className={inp} placeholder="0" value={form.budget_max} onChange={e=>set('budget_max',e.target.value)}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>تاريخ التسليم المطلوب</label>
            <input type="date" className={inp} value={form.delivery_date} onChange={e=>set('delivery_date',e.target.value)}/>
          </div>
          <div>
            <label className={lbl}>تاريخ إغلاق الطلب *</label>
            <input required type="datetime-local" className={inp} value={form.closing_date} onChange={e=>set('closing_date',e.target.value)}/>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-l from-[#00D4FF] to-[#7B2FFF] text-white font-bold hover:opacity-90 disabled:opacity-50 shadow-lg">
            {loading ? 'جارٍ النشر...' : '🚀 نشر الطلب'}
          </button>
          <button type="button" onClick={()=>navigate(-1)}
            className="px-6 py-3 rounded-xl border border-[#00D4FF33] text-[#90A4AE] hover:text-white hover:border-[#00D4FF] transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

export default RFQCreate;
