import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { adminAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C, roleColors, roleLabels } from '../theme/colors';
import { Card, EmptyState } from '../components';

export default function AdminScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setL]     = useState(true);
  const [refresh, setRef]   = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const r = await adminAPI.users();
      setUsers(r.data.data || []);
    } catch {}
    setL(false); setRef(false);
  };

  useEffect(() => { load(); }, []);

  const approve = (id, val, name) => {
    Alert.alert(
      val ? 'اعتماد المستخدم' : 'إلغاء الاعتماد',
      val ? `هل تريد اعتماد ${name}؟` : `هل تريد إلغاء اعتماد ${name}؟`,
      [
        { text:'إلغاء', style:'cancel' },
        { text:'تأكيد', onPress: async () => {
          try {
            await adminAPI.approveUser(id, val);
            Alert.alert('✅', val ? 'تم اعتماد المستخدم' : 'تم إلغاء الاعتماد');
            load();
          } catch { Alert.alert('خطأ', 'تعذّر تنفيذ الإجراء'); }
        }},
      ]
    );
  };

  const FILTERS = [
    { v:'all',      l:'الكل'   },
    { v:'pending',  l:'المعلّقون' },
    { v:'buyer',    l:'المشترون' },
    { v:'supplier', l:'الموردون' },
  ];

  const filtered = filter==='all' ? users
    : filter==='pending' ? users.filter(u => !u.is_approved)
    : users.filter(u => u.role===filter);

  const stats = [
    { l:'إجمالي المستخدمين', v:users.length,                                             c:C.violet  },
    { l:'بانتظار الاعتماد',  v:users.filter(u=>!u.is_approved&&u.role!=='admin'&&u.role!=='owner').length, c:C.gold },
    { l:'موردون',            v:users.filter(u=>u.role==='supplier').length,               c:C.emerald },
    { l:'مشترون',           v:users.filter(u=>u.role==='buyer').length,                  c:C.cyan    },
  ];

  const isOwner = currentUser?.role === 'owner';

  return (
    <View style={{ flex:1, backgroundColor:C.bgDeep }}>
      <ScrollView
        contentContainerStyle={{ padding:16 }}
        refreshControl={<RefreshControl refreshing={refresh}
          onRefresh={()=>{ setRef(true); load(); }} tintColor={C.violet}/>}>

        {/* Header */}
        <Text style={{ color:C.textMain, fontSize:20, fontWeight:'800',
          textAlign:'right', fontFamily:'Tajawal', marginBottom:16 }}>
          {isOwner ? '👑 لوحة مالك المنصة' : '🛡️ إدارة المستخدمين'}
        </Text>

        {/* Stats */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 }}>
          {stats.map(({ l, v, c }) => (
            <View key={l} style={{
              backgroundColor:C.bgCard, borderRadius:14, padding:14,
              borderWidth:1, borderColor:c+'33', flex:1, minWidth:140,
            }}>
              <Text style={{ color:c, fontSize:22, fontWeight:'700', textAlign:'right', fontFamily:'Tajawal' }}>
                {v}
              </Text>
              <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right', fontFamily:'Tajawal', marginTop:2 }}>
                {l}
              </Text>
            </View>
          ))}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap:8, marginBottom:16 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.v} onPress={() => setFilter(f.v)}
              style={{
                paddingHorizontal:16, paddingVertical:8, borderRadius:20,
                backgroundColor: filter===f.v ? C.violet : C.bgCard,
                borderWidth:1, borderColor: filter===f.v ? C.violet : C.borderCard,
              }}>
              <Text style={{
                color: filter===f.v ? '#fff' : C.textMuted,
                fontSize:12, fontWeight:'700', fontFamily:'Tajawal',
              }}>{f.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Users */}
        {loading && (
          <View style={{ alignItems:'center', paddingVertical:40 }}>
            <ActivityIndicator color={C.violet} size="large"/>
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState icon="👥" title="لا يوجد مستخدمون" subtitle="لم يتم تسجيل أي مستخدمين في هذه الفئة"/>
        )}

        {filtered.map(u => {
          const rc = roleColors[u.role] || C.textMuted;
          const isProtected = u.role === 'owner' || u.role === 'admin';
          return (
            <Card key={u.id} style={{ marginBottom:12 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
                  {/* Approve / Revoke */}
                  {!isProtected && (
                    u.is_approved ? (
                      <TouchableOpacity onPress={() => approve(u.id, false, u.name)}
                        style={{
                          backgroundColor:'#EF444420', borderRadius:8, padding:7,
                          borderWidth:1, borderColor:'#EF444433',
                        }}>
                        <Text style={{ fontSize:14 }}>❌</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => approve(u.id, true, u.name)}
                        style={{
                          backgroundColor:C.emerald+'20', borderRadius:8, padding:7,
                          borderWidth:1, borderColor:C.emerald+'44',
                        }}>
                        <Text style={{ fontSize:14 }}>✅</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <View style={{ flex:1, alignItems:'flex-end' }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                    {u.role === 'owner' && <Text style={{ fontSize:12 }}>👑</Text>}
                    <Text style={{ color:C.textMain, fontSize:15, fontWeight:'700', fontFamily:'Tajawal' }}>
                      {u.name}
                    </Text>
                  </View>
                  <Text style={{ color:C.textMuted, fontSize:12, fontFamily:'Tajawal', marginTop:2 }}>
                    {u.email}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                <Text style={{ color: u.is_approved ? C.emerald : C.gold,
                  fontSize:12, fontFamily:'Tajawal' }}>
                  {u.is_approved ? '✓ معتمد' : '⏳ معلّق'}
                </Text>
                <View style={{ flexDirection:'row', gap:8 }}>
                  {u.company_name && (
                    <Text style={{ color:C.textMuted, fontSize:11, fontFamily:'Tajawal' }}>
                      {u.company_name}
                    </Text>
                  )}
                  <View style={{
                    backgroundColor:rc+'20', borderRadius:8,
                    paddingHorizontal:10, paddingVertical:3,
                  }}>
                    <Text style={{ color:rc, fontSize:11, fontWeight:'700', fontFamily:'Tajawal' }}>
                      {roleLabels[u.role] || u.role}
                    </Text>
                  </View>
                </View>
              </View>

              {u.city && (
                <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
                  fontFamily:'Tajawal', marginTop:4 }}>📍 {u.city}</Text>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
