// AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminPanel() {
  const [users, setUsers]   = useState([]);
  const [loading, setL]     = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => {
    adminAPI.users().then(r=>{ setUsers(r.data.data||[]); setL(false); }).catch(()=>setL(false));
  };
  useEffect(()=>{ load(); },[]);

  const approve = async (id, val) => {
    try {
      await adminAPI.approveUser(id, val);
      toast.success(val ? 'تم اعتماد المستخدم' : 'تم إلغاء الاعتماد');
      load();
    } catch { toast.error('خطأ'); }
  };

  const roleLabel = { buyer:'مشترٍ', supplier:'مورد', investor:'مستثمر', admin:'مدير' };
  const roleColor = { buyer:'#00D4FF', supplier:'#7B2FFF', investor:'#00C853', admin:'#FF6B35' };

  const filtered = filter==='all' ? users : users.filter(u=>
    filter==='pending' ? !u.is_approved : u.role===filter
  );

  return (
    <div className="font-arabic space-y-5" dir="rtl">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><Users size={20} className="text-[#FF6B35]"/> لوحة إدارة المستخدمين</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {l:'إجمالي المستخدمين', v:users.length, c:'#00D4FF'},
          {l:'بانتظار الاعتماد', v:users.filter(u=>!u.is_approved&&u.role!=='admin').length, c:'#FF6B35'},
          {l:'موردون', v:users.filter(u=>u.role==='supplier').length, c:'#7B2FFF'},
          {l:'مشترون', v:users.filter(u=>u.role==='buyer').length, c:'#00C853'},
        ].map(({l,v,c})=>(
          <div key={l} className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl p-4">
            <p className="text-2xl font-bold" style={{color:c}}>{v}</p>
            <p className="text-xs text-[#90A4AE] mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#0D1B5E] p-1 rounded-xl w-fit border border-[#00D4FF11]">
        {[['all','الكل'],['pending','بانتظار الاعتماد'],['buyer','المشترون'],['supplier','الموردون']].map(([t,l])=>(
          <button key={t} onClick={()=>setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter===t?'bg-[#FF6B35] text-white':'text-[#90A4AE] hover:text-white'}`}>{l}</button>
        ))}
      </div>

      <div className="bg-[#0D1B5E] border border-[#00D4FF22] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#00D4FF11]">
              {['الاسم','البريد الإلكتروني','الشركة','النوع','المدينة','الحالة','إجراءات'].map(h=>(
                <th key={h} className="text-right px-4 py-3 text-[#90A4AE] text-xs font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00D4FF08]">
            {loading && <tr><td colSpan={7} className="text-center py-10 text-[#90A4AE]">جارٍ التحميل...</td></tr>}
            {!loading && filtered.length===0 && <tr><td colSpan={7} className="text-center py-10 text-[#90A4AE]">لا يوجد مستخدمون</td></tr>}
            {filtered.map(u=>(
              <tr key={u.id} className="hover:bg-[#0A0F2E] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                <td className="px-4 py-3 text-[#90A4AE] text-xs">{u.email}</td>
                <td className="px-4 py-3 text-[#90A4AE] text-xs truncate max-w-[120px]">{u.company_name||'—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{color:roleColor[u.role],background:roleColor[u.role]+'20'}}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#90A4AE] text-xs">{u.city||'—'}</td>
                <td className="px-4 py-3">
                  {u.is_approved
                    ? <span className="text-xs text-[#00C853] font-bold">✓ معتمد</span>
                    : <span className="text-xs text-[#FF6B35] font-bold">⏳ معلّق</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {u.role!=='admin' && (
                    <div className="flex gap-2">
                      {!u.is_approved && (
                        <button onClick={()=>approve(u.id,true)} className="p-1.5 rounded-lg bg-[#00C85320] text-[#00C853] hover:bg-[#00C85340] transition-colors">
                          <CheckCircle size={14}/>
                        </button>
                      )}
                      {u.is_approved && (
                        <button onClick={()=>approve(u.id,false)} className="p-1.5 rounded-lg bg-[#ef444420] text-red-400 hover:bg-[#ef444440] transition-colors">
                          <XCircle size={14}/>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;
