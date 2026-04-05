import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, rfqAPI, competitionAPI } from '../utils/api';
import { C, roleLabels } from '../theme/colors';
import { KPICard, Card, StatusBadge, SectionHeader, EmptyState } from '../components';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [rfqs, setRfqs]       = useState([]);
  const [comps, setComps]     = useState([]);
  const [refresh, setRefresh] = useState(false);

  const load = async () => {
    try {
      const [s, r, c] = await Promise.allSettled([
        dashboardAPI.stats(),
        rfqAPI.list({ limit:5 }),
        competitionAPI.list({ limit:4 }),
      ]);
      if (s.status==='fulfilled') setStats(s.value.data.data);
      if (r.status==='fulfilled') setRfqs(r.value.data.data || []);
      if (c.status==='fulfilled') setComps(c.value.data.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefresh(true); await load(); setRefresh(false); };

  const role = user?.role;

  const kpiBuyer = stats ? [
    { label:'طلبات الشراء',   value:stats.rfqs||0,      color:C.green, icon:'📋' },
    { label:'قيمة المشتريات', value:`${stats.orders_value||0}`,color:C.gold, icon:'💰' },
    { label:'الفواتير',        value:stats.invoices||0,  color:C.green, icon:'🧾' },
    { label:'طلبات التمويل',  value:stats.financing||0, color:C.gold,  icon:'🏦' },
  ] : [];

  const kpiSupplier = stats ? [
    { label:'عروض مقدّمة',   value:stats.quotes||0,    color:C.green, icon:'📤' },
    { label:'عروض فائزة',   value:stats.won||0,        color:C.gold,  icon:'🏆' },
    { label:'معدل الفوز',    value:`${stats.win_rate||0}%`,color:C.green,icon:'📈' },
    { label:'إجمالي المبيعات',value:`${stats.total_sales||0}`,color:C.gold,icon:'💵' },
  ] : [];

  const kpiAdmin = stats ? [
    { label:'المستخدمون',   value:stats.users||0,              color:C.green, icon:'👥' },
    { label:'طلبات الشراء', value:stats.rfqs||0,               color:C.gold,  icon:'📋' },
    { label:'المنافسات',    value:stats.competitions||0,        color:C.green, icon:'🏆' },
    { label:'طلبات تمويل', value:stats.financing_requests||0, color:C.gold,  icon:'🏦' },
  ] : [];

  const kpiInvestor = [
    { label:'فرص تمويل',        value:'12',    color:C.green, icon:'💡' },
    { label:'العائد المتوقع',    value:'15.4%', color:C.gold,  icon:'📈' },
    { label:'محفظتي',            value:'SAR 0', color:C.green, icon:'💼' },
  ];

  const kpis = role==='buyer'     ? kpiBuyer
             : role==='supplier'  ? kpiSupplier
             : (role==='admin'||role==='owner') ? kpiAdmin
             : kpiInvestor;

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bgDeep }}
      contentContainerStyle={{ padding:16 }}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={C.green}/>}>

      {/* Welcome Banner */}
      <View style={{
        backgroundColor:C.bgCard, borderRadius:20, padding:18, marginBottom:20,
        borderWidth:1, borderColor:C.borderGreen,
        shadowColor:C.green, shadowOpacity:0.12, shadowRadius:16, elevation:4,
      }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <View style={{
            backgroundColor:C.green+'22', borderRadius:12, paddingHorizontal:12,
            paddingVertical:5, borderWidth:1, borderColor:C.green+'44',
          }}>
            <Text style={{ color:C.green, fontSize:12, fontWeight:'700', fontFamily:'Tajawal' }}>
              {roleLabels[role]}
            </Text>
          </View>
          <View style={{ flex:1, marginRight:10 }}>
            <Text style={{ color:C.white, fontSize:18, fontWeight:'800',
              textAlign:'right', fontFamily:'Tajawal' }}>
              {user?.company_name || user?.name} 👋
            </Text>
            <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
              fontFamily:'Tajawal', marginTop:2 }}>
              {new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </Text>
          </View>
        </View>
      </View>

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <View style={{ marginBottom:20 }}>
          <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
            {kpis.slice(0,2).map((k,i) => <KPICard key={i} {...k}/>)}
          </View>
          <View style={{ flexDirection:'row', gap:10 }}>
            {kpis.slice(2,4).map((k,i) => <KPICard key={i} {...k}/>)}
          </View>
        </View>
      )}

      {/* Quick Actions for buyer */}
      {role==='buyer' && (
        <View style={{ flexDirection:'row', gap:10, marginBottom:20 }}>
          <TouchableOpacity onPress={() => navigation.navigate('RFQCreate')}
            style={{
              flex:1, backgroundColor:C.green, borderRadius:16, paddingVertical:16,
              alignItems:'center', shadowColor:C.green, shadowOpacity:0.4,
              shadowRadius:12, elevation:6,
            }}>
            <Text style={{ fontSize:22 }}>📋</Text>
            <Text style={{ color:'#000', fontSize:12, fontWeight:'800',
              fontFamily:'Tajawal', marginTop:4 }}>طلب شراء جديد</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('InvoicesTab')}
            style={{
              flex:1, backgroundColor:C.bgCard, borderRadius:16, paddingVertical:16,
              alignItems:'center', borderWidth:1, borderColor:C.borderGold,
            }}>
            <Text style={{ fontSize:22 }}>🧾</Text>
            <Text style={{ color:C.gold, fontSize:12, fontWeight:'700',
              fontFamily:'Tajawal', marginTop:4 }}>الفواتير</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent RFQs */}
      <Card style={{ marginBottom:16 }} accent="green">
        <SectionHeader title="آخر طلبات الشراء" action="عرض الكل"
          onAction={() => navigation.navigate('RFQsTab')}/>
        {rfqs.length === 0
          ? <EmptyState icon="📋" title="لا توجد طلبات بعد"/>
          : rfqs.slice(0,4).map(r => (
            <TouchableOpacity key={r.id}
              onPress={() => navigation.navigate('RFQDetail', { id:r.id })}
              style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.borderCard }}>
              <StatusBadge status={r.status}/>
              <View style={{ flex:1, marginRight:10 }}>
                <Text style={{ color:C.textMain, fontSize:14, fontWeight:'600',
                  textAlign:'right', fontFamily:'Tajawal' }} numberOfLines={1}>{r.title}</Text>
                <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
                  fontFamily:'Tajawal' }}>{r.rfq_number} · {r.quote_count||0} عروض</Text>
              </View>
            </TouchableOpacity>
          ))
        }
      </Card>

      {/* Recent Competitions */}
      <Card style={{ marginBottom:24 }} accent="gold">
        <SectionHeader title="المنافسات المفتوحة" action="عرض الكل"
          onAction={() => navigation.navigate('CompetitionsTab')}/>
        {comps.length === 0
          ? <EmptyState icon="🏆" title="لا توجد منافسات"/>
          : comps.slice(0,4).map(c => (
            <View key={c.id} style={{ flexDirection:'row', justifyContent:'space-between',
              alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.borderCard }}>
              <Text style={{ color:C.gold, fontSize:13, fontWeight:'800', fontFamily:'Tajawal' }}>
                {c.budget ? `SAR ${Number(c.budget).toLocaleString()}` : '—'}
              </Text>
              <View style={{ flex:1, marginRight:10 }}>
                <Text style={{ color:C.textMain, fontSize:14, fontWeight:'600',
                  textAlign:'right', fontFamily:'Tajawal' }} numberOfLines={1}>{c.title}</Text>
                <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
                  fontFamily:'Tajawal' }}>{c.bid_count||0} عروض</Text>
              </View>
            </View>
          ))
        }
      </Card>

    </ScrollView>
  );
}
