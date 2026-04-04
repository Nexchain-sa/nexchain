import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
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
    { label:'طلبات الشراء',    value: stats.rfqs||0,       color: C.violet,  icon:'📋' },
    { label:'قيمة المشتريات',  value: `${stats.orders_value||0}`, color:C.emerald, icon:'💰' },
    { label:'الفواتير',         value: stats.invoices||0,   color: C.cyan,    icon:'🧾' },
    { label:'طلبات التمويل',   value: stats.financing||0,  color: C.gold,    icon:'🏦' },
  ] : [];

  const kpiSupplier = stats ? [
    { label:'عروض مقدّمة',    value: stats.quotes||0,    color: C.violet,  icon:'📤' },
    { label:'عروض فائزة',    value: stats.won||0,        color: C.emerald, icon:'🏆' },
    { label:'معدل الفوز',     value:`${stats.win_rate||0}%`, color:C.cyan, icon:'📈' },
    { label:'إجمالي المبيعات',value:`${stats.total_sales||0}`,color:C.gold,icon:'💵' },
  ] : [];

  const kpiAdmin = stats ? [
    { label:'المستخدمون',   value: stats.users||0,               color: C.cyan,    icon:'👥' },
    { label:'طلبات الشراء', value: stats.rfqs||0,                color: C.violet,  icon:'📋' },
    { label:'المنافسات',    value: stats.competitions||0,         color: C.magenta, icon:'🏆' },
    { label:'طلبات تمويل', value: stats.financing_requests||0,  color: C.gold,    icon:'🏦' },
  ] : [];

  const kpiInvestor = [
    { label:'فرص تمويل متاحة',    value:'12',   color: C.cyan,   icon:'💡' },
    { label:'عائدي المتوقع',       value:'15.4%', color:C.emerald, icon:'📈' },
    { label:'محفظتي الاستثمارية', value:'SAR 0', color:C.violet,  icon:'💼' },
  ];

  const kpis = role==='buyer' ? kpiBuyer
             : role==='supplier' ? kpiSupplier
             : (role==='admin'||role==='owner') ? kpiAdmin
             : kpiInvestor;

  return (
    <ScrollView
      style={{ flex:1, backgroundColor:C.bgDeep }}
      contentContainerStyle={{ padding:16 }}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={C.violet}/>}>

      {/* Welcome */}
      <View style={{ marginBottom:20 }}>
        <Text style={{ color:C.textMain, fontSize:22, fontWeight:'800',
          textAlign:'right', fontFamily:'Tajawal' }}>
          مرحباً 👋{'\n'}{user?.company_name || user?.name}
        </Text>
        <Text style={{ color:C.textMuted, fontSize:13, textAlign:'right',
          marginTop:4, fontFamily:'Tajawal' }}>
          {roleLabels[role]} — {new Date().toLocaleDateString('ar-SA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </Text>
      </View>

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <View style={{ marginBottom:20 }}>
          <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
            {kpis.slice(0,2).map((k,i) => (
              <KPICard key={i} label={k.label} value={k.value} color={k.color} icon={k.icon}/>
            ))}
          </View>
          <View style={{ flexDirection:'row', gap:10 }}>
            {kpis.slice(2,4).map((k,i) => (
              <KPICard key={i} label={k.label} value={k.value} color={k.color} icon={k.icon}/>
            ))}
          </View>
        </View>
      )}

      {/* Recent RFQs */}
      <Card style={{ marginBottom:16 }}>
        <SectionHeader
          title="آخر طلبات الشراء"
          action="عرض الكل"
          onAction={() => navigation.navigate('RFQs')}
        />
        {rfqs.length === 0
          ? <EmptyState icon="📋" title="لا توجد طلبات بعد"/>
          : rfqs.map(r => (
            <TouchableOpacity key={r.id}
              onPress={() => navigation.navigate('RFQDetail', { id: r.id })}
              style={{
                flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.borderCard,
              }}>
              <StatusBadge status={r.status}/>
              <View style={{ flex:1, marginRight:12 }}>
                <Text style={{ color:C.textMain, fontSize:14, fontWeight:'600',
                  textAlign:'right', fontFamily:'Tajawal' }} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
                  fontFamily:'Tajawal' }}>
                  {r.rfq_number} · {r.quote_count||0} عروض
                </Text>
              </View>
            </TouchableOpacity>
          ))
        }
      </Card>

      {/* Recent Competitions */}
      <Card style={{ marginBottom:16 }}>
        <SectionHeader
          title="المنافسات المفتوحة"
          action="عرض الكل"
          onAction={() => navigation.navigate('Competitions')}
        />
        {comps.length === 0
          ? <EmptyState icon="🏆" title="لا توجد منافسات"/>
          : comps.map(c => (
            <View key={c.id}
              style={{
                flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.borderCard,
              }}>
              <Text style={{ color:C.emerald, fontSize:12, fontWeight:'700', fontFamily:'Tajawal' }}>
                {c.budget ? `SAR ${Number(c.budget).toLocaleString()}` : '—'}
              </Text>
              <View style={{ flex:1, marginRight:12 }}>
                <Text style={{ color:C.textMain, fontSize:14, fontWeight:'600',
                  textAlign:'right', fontFamily:'Tajawal' }} numberOfLines={1}>
                  {c.title}
                </Text>
                <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
                  fontFamily:'Tajawal' }}>
                  {c.comp_number} · {c.bid_count||0} عروض
                </Text>
              </View>
            </View>
          ))
        }
      </Card>

      {/* Quick Actions */}
      {(role==='buyer') && (
        <View style={{ marginBottom:8 }}>
          <SectionHeader title="إجراءات سريعة"/>
          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('RFQCreate')}
              style={{
                flex:1, backgroundColor:C.violet, borderRadius:14,
                paddingVertical:14, alignItems:'center',
                shadowColor:C.violet, shadowOpacity:0.35, shadowRadius:10, elevation:5,
              }}>
              <Text style={{ fontSize:20 }}>📋</Text>
              <Text style={{ color:'#fff', fontSize:12, fontWeight:'700',
                fontFamily:'Tajawal', marginTop:4 }}>طلب شراء جديد</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Invoices')}
              style={{
                flex:1, backgroundColor:C.bgCard, borderRadius:14,
                paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:C.borderCard,
              }}>
              <Text style={{ fontSize:20 }}>🧾</Text>
              <Text style={{ color:C.textMain, fontSize:12, fontWeight:'700',
                fontFamily:'Tajawal', marginTop:4 }}>الفواتير</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </ScrollView>
  );
}
