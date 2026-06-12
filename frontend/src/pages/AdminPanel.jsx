// AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { Users, CheckCircle, XCircle, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export function AdminPanel() {
  const { user: currentUser } = useAuth();
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

  const roleLabel = { buyer:'مشترٍ', supplier:'مورد', investor:'مستثمر', admin:'مدير', owner:'مالك المنصة' };
  const roleColor = { buyer:'#4F46E5', supplier:'#059669', investor:'#D97706', admin:'#4F46E5', owner:'#7C3AED' };

  const filtered = filter==='all' ? users : users.filter(u=>
    filter==='pending' ? !u.is_approved : u.role===filter
  );

  const isOwner = currentUser?.role === 'owner';

  return (
    <div className="font-arabic space-y-5" dir="rtl">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        {isOwner
          ? <Crown size={20} style={{ color:'#7C3AED' }}/>
          : <Users size={20} style={{ color:'#4F46E5' }}/>
        }
        {isOwner ? 'لوحة مالك المنصة' : 'لوحة إدارة المستخدمين'}
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {l:'إجمالي المستخدمين', v:users.length,                                            c:'#4F46E5'},
          {l:'بانتظار الاعتماد',  v:users.filter(u=>!u.is_approved&&u.role!=='admin'&&u.role!=='owner').length, c:'#D97706'},
          {l:'موردون',             v:users.filter(u=>u.role==='supplier').length,              c:'#059669'},
          {l:'مشترون',            v:users.filter(u=>u.role==='buyer').length,                 c:'#4F46E5'},
        ].map(({l,v,c})=>(
          <div key={l} className="rounded-2xl p-4"
            style={{ background:'#FFFFFF', border:`1px solid ${c}33` }}>
            <p className="text-2xl font-bold" style={{color:c}}>{v}</p>
            <p className="text-xs mt-0.5" style={{ color:'#8892B0' }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background:'#FFFFFF', border:'1px solid #EEF2FF' }}>
        {[['all','الكل'],['pending','بانتظار الاعتماد'],['buyer','المشترون'],['supplier','الموردون']].map(([t,l])=>(
          <button key={t} onClick={()=>setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all`}
            style={filter===t
              ? { background:'linear-gradient(to left,#4F46E5,#4F46E5)', color:'#fff' }
              : { color:'#8892B0' }
            }
            onMouseEnter={e=>{ if(filter!==t) e.currentTarget.style.color='#4F46E5'; }}
            onMouseLeave={e=>{ if(filter!==t) e.currentTarget.style.color='#8892B0'; }}>
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background:'#FFFFFF', border:'1px solid #EEF2FF' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom:'1px solid #EEF2FF' }}>
              {['الاسم','البريد الإلكتروني','الشركة','النوع','المدينة','الحالة','إجراءات'].map(h=>(
                <th key={h} className="text-right px-4 py-3 text-xs font-semibold"
                  style={{ color:'#8892B0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center py-10" style={{ color:'#8892B0' }}>جارٍ التحميل...</td></tr>
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={7} className="text-center py-10" style={{ color:'#8892B0' }}>لا يوجد مستخدمون</td></tr>
            )}
            {filtered.map(u=>(
              <tr key={u.id} className="transition-colors"
                style={{ borderTop:'1px solid #EEF2FF' }}
                onMouseEnter={e=>e.currentTarget.style.background='#1E293B'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td className="px-4 py-3 text-slate-800 font-medium flex items-center gap-2">
                  {u.role==='owner' && <Crown size={12} style={{ color:'#7C3AED' }}/>}
                  {u.name}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>{u.email}</td>
                <td className="px-4 py-3 text-xs truncate max-w-[120px]" style={{ color:'#8892B0' }}>{u.company_name||'—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ color:roleColor[u.role]||'#8892B0', background:(roleColor[u.role]||'#8892B0')+'20' }}>
                    {roleLabel[u.role]||u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color:'#8892B0' }}>{u.city||'—'}</td>
                <td className="px-4 py-3">
                  {u.is_approved
                    ? <span className="text-xs font-bold" style={{ color:'#059669' }}>✓ معتمد</span>
                    : <span className="text-xs font-bold" style={{ color:'#D97706' }}>⏳ معلّق</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {u.role!=='admin' && u.role!=='owner' && (
                    <div className="flex gap-2">
                      {!u.is_approved && (
                        <button onClick={()=>approve(u.id,true)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background:'#ECFDF5', color:'#059669' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#ECFDF5'}
                          onMouseLeave={e=>e.currentTarget.style.background='#ECFDF5'}>
                          <CheckCircle size={14}/>
                        </button>
                      )}
                      {u.is_approved && (
                        <button onClick={()=>approve(u.id,false)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ background:'#ef444420', color:'#ef4444' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#ef444440'}
                          onMouseLeave={e=>e.currentTarget.style.background='#ef444420'}>
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
