import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { financingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';
import { Card, StatusBadge, EmptyState } from '../components';

export default function FinancingScreen() {
  const { user } = useAuth();
  const [requests, setReqs] = useState([]);
  const [loading, setL]     = useState(true);
  const [refresh, setRef]   = useState(false);
  const [bidModal, setBid]  = useState(null);
  const [bidForm, setBidF]  = useState({ offered_amount:'', monthly_rate:'', duration_days:'30', terms:'' });
  const [subBid, setSubBid] = useState(false);

  const load = async () => {
    try {
      const r = await financingAPI.listRequests();
      setReqs(r.data.data || []);
    } catch {}
    setL(false); setRef(false);
  };

  useEffect(() => { load(); }, []);

  const submitBid = async () => {
    if (!bidForm.offered_amount || !bidForm.monthly_rate)
      return Alert.alert('تنبيه', 'يرجى ملء المبلغ ونسبة الربح');
    setSubBid(true);
    try {
      await financingAPI.submitBid(bidModal.id, {
        offered_amount: parseFloat(bidForm.offered_amount),
        monthly_rate:   parseFloat(bidForm.monthly_rate),
        duration_days:  parseInt(bidForm.duration_days) || 30,
        terms:          bidForm.terms,
        financier_type: user?.role === 'investor' ? 'individual' : 'fund',
      });
      Alert.alert('✅', 'تم تقديم عرض التمويل بنجاح!');
      setBid(null);
      load();
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في تقديم العرض');
    } finally { setSubBid(false); }
  };

  const typeLabel = { fund:'صندوق', company:'شركة تمويل', individual:'مستثمر فردي', competition:'منافسة' };
  const typeColor = { fund:C.emerald, company:C.cyan, individual:C.violet, competition:C.gold };

  const inpStyle = {
    backgroundColor:C.bgCard2, borderRadius:12, borderWidth:1, borderColor:C.borderViolet,
    paddingHorizontal:14, paddingVertical:11, color:C.textMain, fontSize:14,
    textAlign:'right', fontFamily:'Tajawal', marginBottom:10, writingDirection:'rtl',
  };

  return (
    <View style={{ flex:1, backgroundColor:C.bgDeep }}>
      <ScrollView
        contentContainerStyle={{ padding:16 }}
        refreshControl={<RefreshControl refreshing={refresh}
          onRefresh={()=>{ setRef(true); load(); }} tintColor={C.violet}/>}>

        {/* Header info for investor */}
        {user?.role === 'investor' && (
          <View style={{
            backgroundColor:C.violet+'15', borderRadius:16, padding:16,
            borderWidth:1, borderColor:C.violet+'33', marginBottom:16,
          }}>
            <Text style={{ color:C.textMain, fontSize:16, fontWeight:'700',
              textAlign:'right', fontFamily:'Tajawal', marginBottom:4 }}>
              💡 فرص الاستثمار
            </Text>
            <Text style={{ color:C.textMuted, fontSize:13, textAlign:'right',
              fontFamily:'Tajawal' }}>
              قدّم عروض تمويل للفواتير المعتمدة واحصل على عوائد مجزية
            </Text>
          </View>
        )}

        {loading && (
          <View style={{ alignItems:'center', paddingVertical:40 }}>
            <ActivityIndicator color={C.violet} size="large"/>
          </View>
        )}

        {!loading && requests.length === 0 && (
          <EmptyState icon="🏦" title="لا توجد طلبات تمويل"
            subtitle="ستظهر هنا طلبات تمويل الفواتير"/>
        )}

        {requests.map(req => (
          <Card key={req.id} style={{ marginBottom:14 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
              <StatusBadge status={req.status}/>
              <View style={{
                backgroundColor: (typeColor[req.financing_type]||C.gold)+'20',
                borderRadius:8, paddingHorizontal:10, paddingVertical:4,
              }}>
                <Text style={{ color:typeColor[req.financing_type]||C.gold,
                  fontSize:11, fontWeight:'700', fontFamily:'Tajawal' }}>
                  {typeLabel[req.financing_type] || req.financing_type}
                </Text>
              </View>
            </View>

            <Text style={{ color:C.emerald, fontSize:20, fontWeight:'700',
              textAlign:'right', fontFamily:'Tajawal', marginBottom:6 }}>
              SAR {Number(req.requested_amount).toLocaleString()}
            </Text>

            <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
              fontFamily:'Tajawal', marginBottom:10 }}>
              📅 {new Date(req.created_at).toLocaleDateString('ar-SA')}
            </Text>

            {req.notes && (
              <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
                fontFamily:'Tajawal', marginBottom:10 }}>{req.notes}</Text>
            )}

            {/* Bids summary */}
            {req.bids_count > 0 && (
              <View style={{
                backgroundColor:C.bgCard2, borderRadius:10, padding:10, marginBottom:10,
              }}>
                <Text style={{ color:C.cyan, fontSize:12, textAlign:'right', fontFamily:'Tajawal' }}>
                  💼 {req.bids_count} عرض تمويل مقدّم
                </Text>
              </View>
            )}

            {/* Submit bid button - investor only, open requests */}
            {user?.role === 'investor' && req.status === 'open' && (
              <TouchableOpacity onPress={() => { setBid(req); setBidF({offered_amount:String(req.requested_amount),monthly_rate:'',duration_days:'30',terms:''}); }}
                style={{
                  backgroundColor:C.violet+'20', borderRadius:10, paddingVertical:10,
                  alignItems:'center', borderWidth:1, borderColor:C.violet+'44',
                }}>
                <Text style={{ color:C.violet, fontWeight:'700', fontSize:13, fontFamily:'Tajawal' }}>
                  💰 تقديم عرض تمويل
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        ))}
      </ScrollView>

      {/* Bid Modal */}
      <Modal visible={!!bidModal} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000AA', justifyContent:'flex-end' }}>
          <View style={{
            backgroundColor:C.bgCard, borderTopLeftRadius:24, borderTopRightRadius:24,
            padding:24, borderTopWidth:1, borderTopColor:C.borderViolet, maxHeight:'80%',
          }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{ color:C.textMain, fontSize:18, fontWeight:'700',
                textAlign:'right', fontFamily:'Tajawal', marginBottom:18 }}>
                💰 تقديم عرض تمويل
              </Text>
              <Text style={lbl}>المبلغ المعروض (SAR) *</Text>
              <TextInput style={inpStyle} value={bidForm.offered_amount}
                onChangeText={v=>setBidF({...bidForm,offered_amount:v})}
                keyboardType="numeric" placeholder="0.00" placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>نسبة الربح الشهري (%) *</Text>
              <TextInput style={inpStyle} value={bidForm.monthly_rate}
                onChangeText={v=>setBidF({...bidForm,monthly_rate:v})}
                keyboardType="numeric" placeholder="1.5" placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>مدة التمويل (أيام)</Text>
              <TextInput style={inpStyle} value={bidForm.duration_days}
                onChangeText={v=>setBidF({...bidForm,duration_days:v})}
                keyboardType="numeric" placeholder="30" placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>الشروط والأحكام</Text>
              <TextInput style={[inpStyle,{height:70,textAlignVertical:'top'}]}
                value={bidForm.terms} onChangeText={v=>setBidF({...bidForm,terms:v})}
                multiline placeholder="شروط العرض..." placeholderTextColor={C.textMuted}/>
              <View style={{ flexDirection:'row', gap:10, marginTop:8 }}>
                <TouchableOpacity onPress={() => setBid(null)}
                  style={{ flex:1, borderRadius:12, paddingVertical:13, alignItems:'center',
                    borderWidth:1, borderColor:C.borderCard }}>
                  <Text style={{ color:C.textMuted, fontFamily:'Tajawal' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitBid} disabled={subBid}
                  style={{ flex:2, backgroundColor:C.violet, borderRadius:12,
                    paddingVertical:13, alignItems:'center', opacity:subBid?0.7:1 }}>
                  {subBid
                    ? <ActivityIndicator color="#fff" size="small"/>
                    : <Text style={{color:'#fff',fontWeight:'700',fontFamily:'Tajawal'}}>إرسال العرض</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const lbl = { color:C.textMuted, fontSize:12, textAlign:'right', marginBottom:5, fontFamily:'Tajawal' };
