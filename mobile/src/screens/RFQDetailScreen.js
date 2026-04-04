import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { rfqAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';
import { Card, StatusBadge, SectionHeader } from '../components';

export default function RFQDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [rfq, setRfq]         = useState(null);
  const [quotes, setQuotes]   = useState([]);
  const [loading, setL]       = useState(true);
  const [refresh, setRef]     = useState(false);
  const [showForm, setForm]   = useState(false);
  const [quote, setQuote]     = useState({ unit_price:'', delivery_days:'', notes:'' });
  const [submitting, setSub]  = useState(false);

  const load = async () => {
    try {
      const [r, q] = await Promise.all([rfqAPI.get(id), rfqAPI.getQuotes(id)]);
      setRfq(r.data.data);
      setQuotes(q.data.data || []);
    } catch {}
    setL(false); setRef(false);
  };

  useEffect(() => { load(); }, []);

  const submitQuote = async () => {
    if (!quote.unit_price) return Alert.alert('تنبيه', 'يرجى إدخال سعر الوحدة');
    setSub(true);
    try {
      const qty = parseFloat(rfq?.quantity) || 1;
      await rfqAPI.submitQuote(id, {
        unit_price:    parseFloat(quote.unit_price),
        total_price:   parseFloat(quote.unit_price) * qty,
        delivery_days: parseInt(quote.delivery_days) || 7,
        notes:         quote.notes,
      });
      Alert.alert('✅', 'تم تقديم العرض بنجاح!');
      setForm(false);
      setQuote({ unit_price:'', delivery_days:'', notes:'' });
      load();
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في تقديم العرض');
    } finally { setSub(false); }
  };

  const award = async (quoteId) => {
    Alert.alert('تأكيد الإرساء', 'هل تريد إرساء المشروع على هذا العرض؟', [
      { text:'إلغاء', style:'cancel' },
      { text:'نعم، أرسِ', onPress: async () => {
        try {
          await rfqAPI.award(id, quoteId);
          Alert.alert('✅', 'تم الإرساء بنجاح!');
          load();
        } catch(err) {
          Alert.alert('خطأ', err.response?.data?.message || 'خطأ');
        }
      }},
    ]);
  };

  if (loading) return (
    <View style={{ flex:1, backgroundColor:C.bgDeep, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator color={C.violet} size="large"/>
    </View>
  );

  const inpStyle = {
    backgroundColor:C.bgCard2, borderRadius:12, borderWidth:1, borderColor:C.borderViolet,
    paddingHorizontal:14, paddingVertical:11, color:C.textMain, fontSize:14,
    textAlign:'right', fontFamily:'Tajawal', marginBottom:10, writingDirection:'rtl',
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bgDeep }}
      contentContainerStyle={{ padding:16 }}
      refreshControl={<RefreshControl refreshing={refresh}
        onRefresh={()=>{ setRef(true); load(); }} tintColor={C.violet}/>}>

      {/* RFQ Info */}
      <Card style={{ marginBottom:16 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:12 }}>
          <StatusBadge status={rfq?.status}/>
          <Text style={{ color:C.violet, fontSize:12, fontFamily:'Tajawal' }}>{rfq?.rfq_number}</Text>
        </View>
        <Text style={{ color:C.textMain, fontSize:18, fontWeight:'700',
          textAlign:'right', fontFamily:'Tajawal', marginBottom:12 }}>{rfq?.title}</Text>
        {rfq?.description && (
          <Text style={{ color:C.textMuted, fontSize:13, textAlign:'right',
            fontFamily:'Tajawal', marginBottom:12, lineHeight:22 }}>{rfq.description}</Text>
        )}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
          {rfq?.quantity && (
            <InfoChip label="الكمية" value={`${rfq.quantity} ${rfq.unit||''}`}/>
          )}
          {rfq?.budget_max && (
            <InfoChip label="الميزانية" value={`SAR ${Number(rfq.budget_max).toLocaleString()}`} color={C.emerald}/>
          )}
          <InfoChip label="ينتهي" value={new Date(rfq?.closing_date).toLocaleDateString('ar-SA')} color={C.gold}/>
        </View>
      </Card>

      {/* Quotes */}
      <SectionHeader title={`العروض المقدّمة (${quotes.length})`}/>

      {quotes.length === 0 && (
        <Card style={{ marginBottom:16 }}>
          <Text style={{ color:C.textMuted, textAlign:'center', fontFamily:'Tajawal', paddingVertical:20 }}>
            لا توجد عروض بعد
          </Text>
        </Card>
      )}

      {quotes.map(q => (
        <Card key={q.id} style={{ marginBottom:12, borderColor: q.status==='awarded' ? C.emerald+'66' : C.borderCard }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
            <StatusBadge status={q.status}/>
            <Text style={{ color:C.textMain, fontSize:14, fontWeight:'700', fontFamily:'Tajawal' }}>
              {q.supplier_name}
            </Text>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
            <Text style={{ color:C.textMuted, fontSize:12, fontFamily:'Tajawal' }}>
              التسليم: {q.delivery_days} يوم
            </Text>
            <Text style={{ color:C.emerald, fontSize:16, fontWeight:'700', fontFamily:'Tajawal' }}>
              SAR {Number(q.total_price).toLocaleString()}
            </Text>
          </View>
          {q.notes && (
            <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
              fontFamily:'Tajawal', marginBottom:8 }}>{q.notes}</Text>
          )}
          {user?.role==='buyer' && rfq?.status==='open' && q.status==='submitted' && (
            <TouchableOpacity onPress={() => award(q.id)}
              style={{
                backgroundColor:C.emerald+'20', borderRadius:10, paddingVertical:10,
                alignItems:'center', borderWidth:1, borderColor:C.emerald+'44',
              }}>
              <Text style={{ color:C.emerald, fontWeight:'700', fontSize:13, fontFamily:'Tajawal' }}>
                ✅ إرساء المشروع
              </Text>
            </TouchableOpacity>
          )}
        </Card>
      ))}

      {/* Submit Quote (supplier only) */}
      {user?.role==='supplier' && rfq?.status==='open' && (
        <View style={{ marginTop:8 }}>
          {!showForm ? (
            <TouchableOpacity onPress={() => setForm(true)}
              style={{
                backgroundColor:C.violet, borderRadius:14, paddingVertical:14,
                alignItems:'center', shadowColor:C.violet, shadowOpacity:0.4,
                shadowRadius:12, elevation:6,
              }}>
              <Text style={{ color:'#fff', fontSize:15, fontWeight:'700', fontFamily:'Tajawal' }}>
                📤 تقديم عرض سعر
              </Text>
            </TouchableOpacity>
          ) : (
            <Card>
              <Text style={{ color:C.textMain, fontSize:16, fontWeight:'700',
                textAlign:'right', fontFamily:'Tajawal', marginBottom:14 }}>
                تقديم عرض سعر
              </Text>
              <Text style={lbl}>سعر الوحدة (SAR) *</Text>
              <TextInput style={inpStyle} value={quote.unit_price}
                onChangeText={v=>setQuote({...quote,unit_price:v})}
                keyboardType="numeric" placeholder="0.00" placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>مدة التسليم (أيام)</Text>
              <TextInput style={inpStyle} value={quote.delivery_days}
                onChangeText={v=>setQuote({...quote,delivery_days:v})}
                keyboardType="numeric" placeholder="7" placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>ملاحظات</Text>
              <TextInput style={[inpStyle, {height:80,textAlignVertical:'top'}]}
                value={quote.notes} onChangeText={v=>setQuote({...quote,notes:v})}
                multiline placeholder="ملاحظات العرض..." placeholderTextColor={C.textMuted}/>
              <View style={{ flexDirection:'row', gap:10 }}>
                <TouchableOpacity onPress={() => setForm(false)}
                  style={{ flex:1, borderRadius:12, paddingVertical:13, alignItems:'center',
                    borderWidth:1, borderColor:C.borderCard }}>
                  <Text style={{ color:C.textMuted, fontFamily:'Tajawal' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitQuote} disabled={submitting}
                  style={{ flex:2, backgroundColor:C.violet, borderRadius:12,
                    paddingVertical:13, alignItems:'center', opacity:submitting?0.7:1 }}>
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small"/>
                    : <Text style={{color:'#fff',fontWeight:'700',fontFamily:'Tajawal'}}>إرسال العرض</Text>
                  }
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function InfoChip({ label, value, color = C.cyan }) {
  return (
    <View style={{ backgroundColor:color+'15', borderRadius:10, paddingHorizontal:12,
      paddingVertical:6, borderWidth:1, borderColor:color+'33' }}>
      <Text style={{ color:C.textMuted, fontSize:10, textAlign:'center', fontFamily:'Tajawal' }}>{label}</Text>
      <Text style={{ color, fontSize:12, fontWeight:'700', textAlign:'center', fontFamily:'Tajawal' }}>{value}</Text>
    </View>
  );
}

const lbl = { color:C.textMuted, fontSize:12, textAlign:'right', marginBottom:5, fontFamily:'Tajawal' };
