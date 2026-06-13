// AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { Users, CheckCircle, XCircle, Crown, FileText, Eye, Building2, Mail, Phone, MapPin, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setL]     = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewUser, setReviewUser] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const openReview = (u) => { setReviewNote(''); setReviewUser(u); };

  const load = () => {
    adminAPI.users().then(r=>{ setUsers(r.data.data||[]); setL(false); }).catch(()=>setL(false));
  };
  useEffect(()=>{ load(); },[]);

  const approve = async (id, val, note='') => {
    try {
      const r = await adminAPI.approveUser(id, val, note);
      const emailed = r.data?.emailSent;
      toast.success((val ? 'تم اعتماد المستخدم' : 'تم رفض الحساب') + (emailed ? ' وإرسال إشعار بالبريد' : ''));
      load();
    } catch { toast.error('خطأ'); }
  };

  const roleLabel = { buyer:'مشترٍ', supplier:'مورد', investor:'مستثمر', admin:'مدير', owner:'مالك المنصة' };
  const roleColor = { buyer:'#4F46E5', supplier:'#059669', investor:'#D97706', admin:'#4F46E5', owner:'#7C3AED' };

  const reject = (id, note='') => approve(id, false, note);

  const filtered = filter==='all' ? users : users.filter(u=>
    filter==='pending' ? (u.review_status==='pending' || (!u.is_approved && u.review_status!=='rejected')) : u.role===filter
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
              {['الاسم','البريد الإلكتروني','الشركة','النوع','المستندات','الحالة','إجراءات'].map(h=>(
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
                onMouseEnter={e=>e.currentTarget.style.background='#F4F6FB'}
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
                <td className="px-4 py-3 text-xs">
                  {(u.documents && u.documents.length) ? (
                    <div className="flex flex-wrap gap-1">
                      {u.documents.map((d,i)=>(
                        <a key={i} href={d.url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:opacity-80"
                          style={{ background:'#EEF2FF', color:'#4F46E5' }}>
                          <FileText size={11}/> {d.label || `مستند ${i+1}`}
                        </a>
                      ))}
                    </div>
                  ) : <span style={{ color:'#CBD5E1' }}>—</span>}
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const rs = u.review_status || (u.is_approved ? 'approved' : 'pending');
                    if (rs==='approved') return <span className="text-xs font-bold" style={{ color:'#059669' }}>✓ معتمد</span>;
                    if (rs==='rejected') return <span className="text-xs font-bold" style={{ color:'#DC2626' }}>✕ مرفوض</span>;
                    return <span className="text-xs font-bold" style={{ color:'#D97706' }}>⏳ قيد المراجعة</span>;
                  })()}
                </td>
                <td className="px-4 py-3">
                  {u.role!=='admin' && u.role!=='owner' && (
                    <div className="flex gap-2">
                      <button onClick={()=>openReview(u)} title="اطّلاع ومراجعة"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold hover:opacity-80"
                        style={{ background:'#EEF2FF', color:'#4F46E5' }}>
                        <Eye size={13}/> اطّلاع
                      </button>
                      {!u.is_approved && (
                        <button onClick={()=>approve(u.id,true)} title="اعتماد"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold hover:opacity-80"
                          style={{ background:'#ECFDF5', color:'#059669' }}>
                          <CheckCircle size={13}/> قبول
                        </button>
                      )}
                      {u.review_status!=='rejected' && (
                        <button onClick={()=>reject(u.id)} title="رفض"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold hover:opacity-80"
                          style={{ background:'#FEE2E2', color:'#DC2626' }}>
                          <XCircle size={13}/> رفض
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

      {reviewUser && (() => {
        const u = reviewUser;
        const docs = u.documents || [];
        const isImg = (url) => /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || /\/image\/upload\//.test(url);
        const downloadUrl = (url) => url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
        const Info = ({ icon:Icon, label, value }) => (
          <div className="flex items-center gap-2 text-sm">
            <Icon size={15} className="text-slate-400 flex-shrink-0"/>
            <span className="text-slate-400 w-28 flex-shrink-0">{label}</span>
            <span className="text-slate-700 font-medium break-all">{value || '—'}</span>
          </div>
        );
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl" onClick={()=>setReviewUser(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b" style={{borderColor:'#E5E7EF'}}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{background:roleColor[u.role]||'#4F46E5'}}>{u.name?.[0]}</div>
                  <div>
                    <p className="font-bold text-slate-800">{u.company_name || u.name}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{color:roleColor[u.role],background:(roleColor[u.role]||'#4F46E5')+'20'}}>{roleLabel[u.role]||u.role}</span>
                  </div>
                </div>
                <button onClick={()=>setReviewUser(null)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Info icon={Users} label="الاسم" value={u.name}/>
                  <Info icon={Mail} label="البريد الإلكتروني" value={u.email}/>
                  <Info icon={Phone} label="الجوال" value={u.phone}/>
                  <Info icon={Building2} label="الشركة" value={u.company_name}/>
                  <Info icon={MapPin} label="المدينة" value={u.city}/>
                  <Info icon={Calendar} label="تاريخ التسجيل" value={u.created_at ? new Date(u.created_at).toLocaleDateString('ar-EG') : ''}/>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">المستندات الرسمية ({docs.length})</p>
                  {docs.length===0
                    ? <p className="text-xs text-slate-400 bg-amber-50 rounded-lg p-3">لا توجد مستندات مرفوعة لهذا الحساب.</p>
                    : <div className="grid sm:grid-cols-2 gap-2">
                        {docs.map((d,i)=>(
                          <div key={i} className="flex items-center gap-2 border rounded-xl p-2" style={{borderColor:'#E5E7EF'}}>
                            {isImg(d.url)
                              ? <img src={d.url} alt={d.label||d.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                              : <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'#EEF2FF'}}><FileText size={18} style={{color:'#4F46E5'}}/></div>}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-700 truncate">{d.label || `مستند ${i+1}`}</p>
                              <p className="text-[11px] text-slate-400 truncate">{d.name || ''}</p>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <a href={d.url} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-2 py-0.5 rounded text-center" style={{background:'#EEF2FF',color:'#4F46E5'}}>عرض</a>
                              <a href={downloadUrl(d.url)} download className="text-[11px] font-bold px-2 py-0.5 rounded text-center" style={{background:'#ECFDF5',color:'#059669'}}>تحميل</a>
                            </div>
                          </div>
                        ))}
                      </div>}
                </div>
              </div>

              {u.role!=='admin' && u.role!=='owner' && (
                <div className="border-t" style={{borderColor:'#E5E7EF'}}>
                  <div className="px-5 pt-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">ملاحظات للعميل (تُرسل إلى بريده عند القبول/الرفض)</label>
                    <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} rows={2}
                      placeholder="مثال: يرجى تحديث السجل التجاري المرفق لأنه منتهي الصلاحية..."
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none" style={{borderColor:'#E5E7EF'}}/>
                  </div>
                  <div className="flex gap-3 p-5">
                    <button onClick={()=>{approve(u.id,true,reviewNote); setReviewUser(null);}}
                      className="flex-1 py-2.5 rounded-xl text-white font-bold hover:opacity-90 flex items-center justify-center gap-2" style={{background:'#059669'}}>
                      <CheckCircle size={16}/> قبول الحساب
                    </button>
                    <button onClick={()=>{reject(u.id,reviewNote); setReviewUser(null);}}
                      className="flex-1 py-2.5 rounded-xl text-white font-bold hover:opacity-90 flex items-center justify-center gap-2" style={{background:'#DC2626'}}>
                      <XCircle size={16}/> رفض الحساب
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AdminPanel;
