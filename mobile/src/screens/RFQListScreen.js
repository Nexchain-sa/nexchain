import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { rfqAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';
import { StatusBadge, EmptyState, Card } from '../components';

export default function RFQListScreen({ navigation }) {
  const { user } = useAuth();
  const [rfqs, setRfqs]     = useState([]);
  const [loading, setL]     = useState(true);
  const [refresh, setRef]   = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      const r = await rfqAPI.list({ search, status });
      setRfqs(r.data.data || []);
    } catch {}
    setL(false); setRef(false);
  };

  useEffect(() => { load(); }, [search, status]);

  const STATUSES = [
    { v:'',        l:'الكل'   },
    { v:'open',    l:'مفتوح'  },
    { v:'closed',  l:'مغلق'   },
    { v:'awarded', l:'مُرسى'  },
  ];

  return (
    <View style={{ flex:1, backgroundColor:C.bgDeep }}>
      {/* Search */}
      <View style={{ padding:16, paddingBottom:8 }}>
        <TextInput
          style={{
            backgroundColor:C.bgCard, borderRadius:12, borderWidth:1,
            borderColor:C.borderViolet, paddingHorizontal:16, paddingVertical:12,
            color:C.textMain, fontSize:14, textAlign:'right', fontFamily:'Tajawal',
          }}
          value={search}
          onChangeText={setSearch}
          placeholder="بحث في الطلبات..."
          placeholderTextColor={C.textMuted}
        />
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:16, paddingBottom:12, gap:8 }}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s.v} onPress={() => setStatus(s.v)}
            style={{
              paddingHorizontal:16, paddingVertical:8, borderRadius:20,
              backgroundColor: status===s.v ? C.violet : C.bgCard,
              borderWidth:1, borderColor: status===s.v ? C.violet : C.borderCard,
            }}>
            <Text style={{
              color: status===s.v ? '#fff' : C.textMuted,
              fontSize:12, fontWeight:'700', fontFamily:'Tajawal',
            }}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ padding:16, paddingTop:0 }}
        refreshControl={<RefreshControl refreshing={refresh}
          onRefresh={()=>{ setRef(true); load(); }} tintColor={C.violet}/>}>

        {loading && (
          <View style={{ alignItems:'center', paddingVertical:40 }}>
            <ActivityIndicator color={C.violet} size="large"/>
          </View>
        )}

        {!loading && rfqs.length === 0 && (
          <EmptyState icon="📋" title="لا توجد طلبات" subtitle="لم يتم إنشاء أي طلبات بعد"/>
        )}

        {rfqs.map(r => (
          <TouchableOpacity key={r.id}
            onPress={() => navigation.navigate('RFQDetail', { id: r.id })}
            activeOpacity={0.8}
            style={{
              backgroundColor:C.bgCard, borderRadius:16, padding:16,
              borderWidth:1, borderColor:C.borderCard, marginBottom:12,
            }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <StatusBadge status={r.status}/>
              <Text style={{ color:C.violet, fontSize:11, fontFamily:'Tajawal',
                fontWeight:'600' }}>{r.rfq_number}</Text>
            </View>
            <Text style={{ color:C.textMain, fontSize:15, fontWeight:'700',
              textAlign:'right', fontFamily:'Tajawal', marginBottom:6 }}
              numberOfLines={2}>{r.title}</Text>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <Text style={{ color:C.emerald, fontSize:12, fontWeight:'700', fontFamily:'Tajawal' }}>
                {r.quote_count||0} عروض
              </Text>
              <Text style={{ color:C.textMuted, fontSize:11, fontFamily:'Tajawal' }}>
                ينتهي: {new Date(r.closing_date).toLocaleDateString('ar-SA')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAB - buyer only */}
      {user?.role === 'buyer' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('RFQCreate')}
          style={{
            position:'absolute', bottom:24, left:24,
            width:56, height:56, borderRadius:28,
            backgroundColor:C.violet, justifyContent:'center', alignItems:'center',
            shadowColor:C.violet, shadowOpacity:0.5, shadowRadius:16, elevation:8,
          }}>
          <Text style={{ color:'#fff', fontSize:28, lineHeight:30 }}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
