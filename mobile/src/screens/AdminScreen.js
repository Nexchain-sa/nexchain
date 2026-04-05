import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { adminAPI, dashboardAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C, roleColors, roleLabels } from '../theme/colors';
import { Card, EmptyState, StatusBadge, InfoRow } from '../components';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { key:'overview',  label:'نظرة عامة', icon:'📊' },
  { key:'users',     label:'المستخدمون', icon:'👥' },
  { key:'pending',   label:'قيد الاعتماد', icon:'⏳' },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.85}
      style={{
        flex:1, backgroundColor:C.bgCard, borderRadius:16, padding:14, minWidth:140,
        borderWidth:1, borderColor: color+'33',
        shadowColor:color, shadowOpacity:0.1, shadowRadius:8, elevation:3,
      }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
        <View style={{ backgroundColor:color+'20', borderRadius:10, padding:8 }}>
          <Text style={{ fontSize:18 }}>{icon}</Text>
        </View>
        <View style={{ flex:1, marginRight:10 }}>
          <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
            fontFamily:'Tajawal', marginBottom:4 }}>{label}</Text>
          <Text style={{ color, fontSize:22, fontWeight:'900', textAlign:'right',
            fontFamily:'Tajawal' }}>{value}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ u, onApprove, onRevoke }) {
  const rc = roleColors[u.role] || C.textMuted;
  const isProtected = u.role === 'owner' || u.role === 'admin';

  return (
    <View style={{
      backgroundColor:C.bgCard, borderRadius:16, padding:14, marginBottom:12,
      borderWidth:1, borderColor: u.is_approved ? C.borderGreen : C.borderGold,
    }}>
      {/* Header */}
      <View style={{ flexDirection:'row', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:10 }}>
        <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
          {!isProtected && !u.is_approved && (
            <TouchableOpacity onPress={() => onApprove(u)}
              style={{
                backgroundColor:C.green+'20', borderRadius:10, paddingHorizontal:12,
                paddingVertical:7, borderWidth:1, borderColor:C.green+'55',
                flexDirection:'row', alignItems:'center', gap:4,
              }}>
              <Text style={{ color:C.green, fontWeight:'800', fontSize:12, fontFamily:'Tajawal' }}>
                اعتماد ✓
              </Text>
            </TouchableOpacity>
          )}
          {!isProtected && u.is_approved && (
            <TouchableOpacity onPress={() => onRevoke(u)}
              style={{
                backgroundColor:'#EF444420', borderRadius:10, paddingHorizontal:12,
                paddingVertical:7, borderWidth:1, borderColor:'#EF444444',
              }}>
              <Text style={{ color:C.red, fontWeight:'700', fontSize:12, fontFamily:'Tajawal' }}>
                إلغاء ✗
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex:1, alignItems:'flex-end' }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:3 }}>
            {u.role==='owner' && <Text style={{ fontSize:14 }}>👑</Text>}
            {u.role==='admin' && <Text style={{ fontSize:14 }}>🛡️</Text>}
            <Text style={{ color:C.white, fontSize:15, fontWeight:'700', fontFamily:'Tajawal' }}>
              {u.name}
            </Text>
          </View>
          <Text style={{ color:C.textMuted, fontSize:12, fontFamily:'Tajawal' }}>{u.email}</Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
        paddingTop:10, borderTopWidth:1, borderTopColor:C.borderCard }}>
        <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
          <View style={{
            backgroundColor: u.is_approved ? C.green+'20' : C.gold+'20',
            borderRadius:8, paddingHorizontal:8, paddingVertical:3,
            borderWidth:1, borderColor: u.is_approved ? C.green+'44' : C.gold+'44',
          }}>
            <Text style={{ color: u.is_approved ? C.green : C.gold,
              fontSize:11, fontWeight:'700', fontFamily:'Tajawal' }}>
              {u.is_approved ? '● معتمد' : '○ معلّق'}
            </Text>
          </View>
          {u.city && (
            <Text style={{ color:C.textMuted, fontSize:11, fontFamily:'Tajawal' }}>
              📍{u.city}
            </Text>
          )}
        </View>
        <View style={{
          backgroundColor:rc+'20', borderRadius:8,
          paddingHorizontal:10, paddingVertical:3, borderWidth:1, borderColor:rc+'44',
        }}>
          <Text style={{ color:rc, fontSize:11, fontWeight:'700', fontFamily:'Tajawal' }}>
            {roleLabels[u.role] || u.role}
          </Text>
        </View>
      </View>

      {u.company_name && (
        <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
          fontFamily:'Tajawal', marginTop:6 }}>🏢 {u.company_name}</Text>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminScreen() {
  const { user: me } = useAuth();
  const [activeTab, setTab] = useState('overview');
  const [users, setUsers]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setL]     = useState(true);
  const [refresh, setRef]   = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRF] = useState('all');

  const load = useCallback(async () => {
    try {
      const [u, s] = await Promise.allSettled([adminAPI.users(), dashboardAPI.stats()]);
      if (u.status==='fulfilled') setUsers(u.value.data.data || []);
      if (s.status==='fulfilled') setStats(s.value.data.data);
    } catch {}
    setL(false); setRef(false);
  }, []);

  useEffect(() => { load(); }, []);

  const confirmApprove = (u) => {
    Alert.alert('اعتماد المستخدم', `هل تريد اعتماد ${u.name}؟`, [
      { text:'إلغاء', style:'cancel' },
      { text:'✅ اعتماد', onPress: async () => {
        try { await adminAPI.approveUser(u.id, true); load(); } catch { Alert.alert('خطأ','تعذّر التنفيذ'); }
      }},
    ]);
  };

  const confirmRevoke = (u) => {
    Alert.alert('إلغاء الاعتماد', `هل تريد إلغاء اعتماد ${u.name}؟`, [
      { text:'إلغاء', style:'cancel' },
      { text:'❌ إلغاء الاعتماد', style:'destructive', onPress: async () => {
        try { await adminAPI.approveUser(u.id, false); load(); } catch { Alert.alert('خطأ','تعذّر التنفيذ'); }
      }},
    ]);
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchRole   = roleFilter==='all' || u.role===roleFilter;
    const matchSearch = !search ||
      u.name.includes(search) || u.email.includes(search) ||
      (u.company_name||'').includes(search);
    return matchRole && matchSearch;
  });

  const pending = users.filter(u => !u.is_approved && u.role!=='admin' && u.role!=='owner');

  const ROLE_FILTERS = [
    { v:'all',      l:'الكل' },
    { v:'buyer',    l:'المشترون' },
    { v:'supplier', l:'الموردون' },
    { v:'investor', l:'المستثمرون' },
  ];

  const isOwner = me?.role === 'owner';

  return (
    <View style={{ flex:1, backgroundColor:C.bgDeep }}>

      {/* ── Tab Bar ──────────────────────────────────────── */}
      <View style={{
        backgroundColor:C.bgCard, flexDirection:'row',
        borderBottomWidth:1, borderBottomColor:C.borderCard,
      }}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          const hasBadge = t.key==='pending' && pending.length > 0;
          return (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
              style={{ flex:1, alignItems:'center', paddingVertical:12,
                borderBottomWidth:2,
                borderBottomColor: active ? C.green : 'transparent' }}>
              <Text style={{ fontSize:16 }}>{t.icon}</Text>
              <Text style={{ color: active ? C.green : C.textMuted,
                fontSize:11, fontWeight: active?'800':'400',
                fontFamily:'Tajawal', marginTop:2 }}>{t.label}</Text>
              {hasBadge && (
                <View style={{
                  position:'absolute', top:6, left:'55%',
                  backgroundColor:C.red, borderRadius:8, minWidth:16, height:16,
                  justifyContent:'center', alignItems:'center', paddingHorizontal:4,
                }}>
                  <Text style={{ color:'#fff', fontSize:9, fontWeight:'800' }}>
                    {pending.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding:16 }}
        refreshControl={<RefreshControl refreshing={refresh}
          onRefresh={()=>{ setRef(true); load(); }} tintColor={C.green}/>}>

        {/* ── Overview Tab ──────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            <Text style={{ color:C.white, fontSize:22, fontWeight:'900',
              textAlign:'right', fontFamily:'Tajawal', marginBottom:4 }}>
              {isOwner ? '👑 لوحة مالك المنصة' : '🛡️ لوحة التحكم'}
            </Text>
            <Text style={{ color:C.textMuted, fontSize:13, textAlign:'right',
              fontFamily:'Tajawal', marginBottom:18 }}>
              {new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </Text>

            {/* Stats Grid */}
            <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
              <StatCard label="المستخدمون"   value={users.length}          icon="👥" color={C.green}
                onPress={()=>setTab('users')}/>
              <StatCard label="قيد الاعتماد" value={pending.length}         icon="⏳" color={C.gold}
                onPress={()=>setTab('pending')}/>
            </View>
            <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
              <StatCard label="الموردون"    value={users.filter(u=>u.role==='supplier').length} icon="📦" color={C.green}/>
              <StatCard label="المشترون"    value={users.filter(u=>u.role==='buyer').length}    icon="🛒" color={C.gold}/>
            </View>
            <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
              <StatCard label="المستثمرون"  value={users.filter(u=>u.role==='investor').length} icon="💰" color={C.green}/>
              <StatCard label="طلبات الشراء" value={stats?.rfqs||0} icon="📋" color={C.gold}/>
            </View>
            <View style={{ flexDirection:'row', gap:10, marginBottom:20 }}>
              <StatCard label="المنافسات"   value={stats?.competitions||0} icon="🏆" color={C.green}/>
              <StatCard label="طلبات تمويل" value={stats?.financing_requests||0} icon="🏦" color={C.gold}/>
            </View>

            {/* Pending Users Quick View */}
            {pending.length > 0 && (
              <Card accent="gold" style={{ marginBottom:16 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between',
                  alignItems:'center', marginBottom:12 }}>
                  <TouchableOpacity onPress={() => setTab('pending')}>
                    <Text style={{ color:C.gold, fontSize:12, fontFamily:'Tajawal', fontWeight:'700' }}>
                      عرض الكل ←
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ color:C.white, fontSize:16, fontWeight:'700', fontFamily:'Tajawal' }}>
                    ⏳ بانتظار الاعتماد ({pending.length})
                  </Text>
                </View>
                {pending.slice(0,3).map(u => (
                  <View key={u.id} style={{ flexDirection:'row', justifyContent:'space-between',
                    alignItems:'center', paddingVertical:10,
                    borderBottomWidth:1, borderBottomColor:C.borderCard }}>
                    <TouchableOpacity onPress={() => confirmApprove(u)}
                      style={{ backgroundColor:C.green+'20', borderRadius:8,
                        paddingHorizontal:12, paddingVertical:6,
                        borderWidth:1, borderColor:C.green+'55' }}>
                      <Text style={{ color:C.green, fontWeight:'800', fontSize:12, fontFamily:'Tajawal' }}>
                        اعتماد ✓
                      </Text>
                    </TouchableOpacity>
                    <View style={{ flex:1, marginRight:10 }}>
                      <Text style={{ color:C.textMain, fontSize:14, fontWeight:'700',
                        textAlign:'right', fontFamily:'Tajawal' }}>{u.name}</Text>
                      <Text style={{ color:C.textMuted, fontSize:11,
                        textAlign:'right', fontFamily:'Tajawal' }}>
                        {roleLabels[u.role]} · {u.company_name||''}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {/* Platform Info */}
            <Card accent="green" style={{ marginBottom:16 }}>
              <Text style={{ color:C.white, fontSize:16, fontWeight:'700',
                textAlign:'right', fontFamily:'Tajawal', marginBottom:12 }}>
                ℹ️ معلومات المنصة
              </Text>
              <InfoRow label="اسم المنصة"  value="FLOWRIZ"/>
              <InfoRow label="الإصدار"      value="1.0.0"/>
              <InfoRow label="الخادم"       value="Render.com (Active)" valueColor={C.green}/>
              <InfoRow label="قاعدة البيانات" value="PostgreSQL (Connected)" valueColor={C.green}/>
              <InfoRow label="الواجهة"      value="Netlify (Published)" valueColor={C.green}/>
            </Card>
          </>
        )}

        {/* ── Users Tab ─────────────────────────────────── */}
        {activeTab === 'users' && (
          <>
            {/* Search */}
            <TextInput
              style={{
                backgroundColor:C.bgCard2, borderRadius:12, borderWidth:1,
                borderColor:C.borderInput, paddingHorizontal:16, paddingVertical:12,
                color:C.textMain, fontSize:14, textAlign:'right',
                fontFamily:'Tajawal', marginBottom:12, writingDirection:'rtl',
              }}
              value={search} onChangeText={setSearch}
              placeholder="بحث بالاسم أو البريد أو الشركة..."
              placeholderTextColor={C.textMuted}/>

            {/* Role Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap:8, marginBottom:16 }}>
              {ROLE_FILTERS.map(f => (
                <TouchableOpacity key={f.v} onPress={() => setRF(f.v)}
                  style={{
                    paddingHorizontal:16, paddingVertical:8, borderRadius:20,
                    backgroundColor: roleFilter===f.v ? C.green : C.bgCard,
                    borderWidth:1, borderColor: roleFilter===f.v ? C.green : C.borderCard,
                  }}>
                  <Text style={{ color: roleFilter===f.v ? '#000' : C.textMuted,
                    fontSize:12, fontWeight:'700', fontFamily:'Tajawal' }}>{f.l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading && (
              <View style={{ alignItems:'center', paddingVertical:40 }}>
                <ActivityIndicator color={C.green} size="large"/>
              </View>
            )}
            {!loading && filteredUsers.length === 0 && (
              <EmptyState icon="👥" title="لا يوجد مستخدمون" subtitle="لم يتم العثور على نتائج"/>
            )}
            {filteredUsers.map(u => (
              <UserCard key={u.id} u={u} onApprove={confirmApprove} onRevoke={confirmRevoke}/>
            ))}
          </>
        )}

        {/* ── Pending Tab ───────────────────────────────── */}
        {activeTab === 'pending' && (
          <>
            {pending.length === 0 ? (
              <EmptyState icon="✅" title="لا يوجد طلبات معلّقة"
                subtitle="تم اعتماد جميع المستخدمين المسجلين"/>
            ) : (
              <>
                <View style={{
                  backgroundColor:C.gold+'15', borderRadius:14, padding:14,
                  borderWidth:1, borderColor:C.gold+'44', marginBottom:16,
                  flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                }}>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'اعتماد الكل',
                        `هل تريد اعتماد ${pending.length} مستخدم دفعةً واحدة؟`,
                        [
                          { text:'إلغاء', style:'cancel' },
                          { text:'✅ اعتماد الكل', onPress: async () => {
                            for (const u of pending) {
                              await adminAPI.approveUser(u.id, true).catch(()=>{});
                            }
                            load();
                          }},
                        ]
                      );
                    }}
                    style={{
                      backgroundColor:C.green, borderRadius:10, paddingHorizontal:14,
                      paddingVertical:8,
                    }}>
                    <Text style={{ color:'#000', fontWeight:'800', fontSize:12, fontFamily:'Tajawal' }}>
                      اعتماد الكل ✓
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ color:C.gold, fontSize:15, fontWeight:'700',
                    fontFamily:'Tajawal' }}>
                    {pending.length} طلب بانتظار الاعتماد
                  </Text>
                </View>
                {pending.map(u => (
                  <UserCard key={u.id} u={u} onApprove={confirmApprove} onRevoke={confirmRevoke}/>
                ))}
              </>
            )}
          </>
        )}

      </ScrollView>
    </View>
  );
}
