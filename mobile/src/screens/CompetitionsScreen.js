import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { competitionAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';
import { Card, StatusBadge, EmptyState } from '../components';

export default function CompetitionsScreen() {
  const { user } = useAuth();
  const [comps, setComps]     = useState([]);
  const [loading, setL]       = useState(true);
  const [refresh, setRef]     = useState(false);
  const [bidModal, setBid]    = useState(null);
  const [bidForm, setBidF]    = useState({ bid_amount:'', notes:'' });
  const [subBid, setSubBid]   = useState(false);
  const [createModal, setCM]  = useState(false);
  const [compForm, setCompF]  = useState({ title:'', description:'', budget:'', closing_date:'' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const r = await competitionAPI.list();
      setComps(r.data.data || []);
    } catch {}
    setL(false); setRef(false);
  };

  useEffect(() => { load(); }, []);

  const submitBid = async () => {
    if (!bidForm.bid_amount) return Alert.alert('تنبيه', 'يرجى إدخال قيمة العرض');
    setSubBid(true);
    try {
      await competitionAPI.submitBid(bidModal.id, {
        bid_amount: parseFloat(bidForm.bid_amount),
        notes:      bidForm.notes,
      });
      Alert.alert('✅', 'تم تقديم العرض بنجاح!');
      setBid(null);
      load();
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في تقديم العرض');
    } finally { setSubBid(false); }
  };

  const createComp = async () => {
    if (!compForm.title || !compForm.closing_date)
      return Alert.alert('تنبيه', 'يرجى ملء العنوان وتاريخ الإغلاق');
    setCreating(true);
    try {
      await competitionAPI.create({ ...compForm, type:'product', is_public:true });
      Alert.alert('✅', 'تم إنشاء المنافسة بنجاح!');
      setCM(false);
      setCompF({ title:'', description:'', budget:'', closing_date:'' });
      load();
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في الإنشاء');
    } finally { setCreating(false); }
  };

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

        {loading && (
          <View style={{ alignItems:'center', paddingVertical:40 }}>
            <ActivityIndicator color={C.violet} size="large"/>
          </View>
        )}

        {!loading && comps.length === 0 && (
          <EmptyState icon="🏆" title="لا توجد منافسات" subtitle="لم يتم فتح أي منافسات بعد"/>
        )}

        {comps.map(c => (
          <Card key={c.id} style={{ marginBottom:14 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
              <StatusBadge status={c.status}/>
              <Text style={{ color:C.magenta, fontSize:11, fontFamily:'Tajawal' }}>{c.comp_number}</Text>
            </View>
            <Text style={{ color:C.textMain, fontSize:15, fontWeight:'700',
              textAlign:'right', fontFamily:'Tajawal', marginBottom:6 }}
              numberOfLines={2}>{c.title}</Text>
            {c.description && (
              <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
                fontFamily:'Tajawal', marginBottom:8 }} numberOfLines={2}>{c.description}</Text>
            )}
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
              <Text style={{ color:C.textMuted, fontSize:11, fontFamily:'Tajawal' }}>
                {c.bid_count||0} عروض · {new Date(c.closing_date).toLocaleDateString('ar-SA')}
              </Text>
              {c.budget && (
                <Text style={{ color:C.emerald, fontSize:14, fontWeight:'700', fontFamily:'Tajawal' }}>
                  SAR {Number(c.budget).toLocaleString()}
                </Text>
              )}
            </View>
            {user?.role==='supplier' && c.status==='open' && (
              <TouchableOpacity
                onPress={() => { setBid(c); setBidF({ bid_amount:'', notes:'' }); }}
                style={{
                  backgroundColor:C.magenta+'20', borderRadius:10, paddingVertical:10,
                  alignItems:'center', borderWidth:1, borderColor:C.magenta+'44',
                }}>
                <Text style={{ color:C.magenta, fontWeight:'700', fontSize:13, fontFamily:'Tajawal' }}>
                  🏆 تقديم عرض
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        ))}
      </ScrollView>

      {/* FAB - buyer */}
      {user?.role==='buyer' && (
        <TouchableOpacity onPress={() => setCM(true)}
          style={{
            position:'absolute', bottom:24, left:24, width:56, height:56, borderRadius:28,
            backgroundColor:C.magenta, justifyContent:'center', alignItems:'center',
            shadowColor:C.magenta, shadowOpacity:0.5, shadowRadius:16, elevation:8,
          }}>
          <Text style={{ color:'#fff', fontSize:28, lineHeight:30 }}>+</Text>
        </TouchableOpacity>
      )}

      {/* Bid Modal */}
      <Modal visible={!!bidModal} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000AA', justifyContent:'flex-end' }}>
          <View style={{
            backgroundColor:C.bgCard, borderTopLeftRadius:24, borderTopRightRadius:24,
            padding:24, borderTopWidth:1, borderTopColor:C.magenta+'44',
          }}>
            <Text style={{ color:C.textMain, fontSize:18, fontWeight:'700',
              textAlign:'right', fontFamily:'Tajawal', marginBottom:4 }}>
              🏆 تقديم عرض للمنافسة
            </Text>
            <Text style={{ color:C.magenta, fontSize:12, fontFamily:'Tajawal',
              textAlign:'right', marginBottom:16 }}>{bidModal?.title}</Text>
            <Text style={lbl}>قيمة العرض (SAR) *</Text>
            <TextInput style={inpStyle} value={bidForm.bid_amount}
              onChangeText={v=>setBidF({...bidForm,bid_amount:v})}
              keyboardType="numeric" placeholder="0.00" placeholderTextColor={C.textMuted}/>
            <Text style={lbl}>ملاحظات وتفاصيل العرض</Text>
            <TextInput style={[inpStyle,{height:80,textAlignVertical:'top'}]}
              value={bidForm.notes} onChangeText={v=>setBidF({...bidForm,notes:v})}
              multiline placeholder="تفاصيل العرض..." placeholderTextColor={C.textMuted}/>
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity onPress={() => setBid(null)}
                style={{ flex:1, borderRadius:12, paddingVertical:13, alignItems:'center',
                  borderWidth:1, borderColor:C.borderCard }}>
                <Text style={{ color:C.textMuted, fontFamily:'Tajawal' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitBid} disabled={subBid}
                style={{ flex:2, backgroundColor:C.magenta, borderRadius:12,
                  paddingVertical:13, alignItems:'center', opacity:subBid?0.7:1 }}>
                {subBid
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <Text style={{color:'#fff',fontWeight:'700',fontFamily:'Tajawal'}}>إرسال العرض</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Competition Modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000AA', justifyContent:'flex-end' }}>
          <View style={{
            backgroundColor:C.bgCard, borderTopLeftRadius:24, borderTopRightRadius:24,
            padding:24, borderTopWidth:1, borderTopColor:C.borderViolet, maxHeight:'80%',
          }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={{ color:C.textMain, fontSize:18, fontWeight:'700',
                textAlign:'right', fontFamily:'Tajawal', marginBottom:16 }}>
                🏆 منافسة جديدة
              </Text>
              <Text style={lbl}>العنوان *</Text>
              <TextInput style={inpStyle} value={compForm.title}
                onChangeText={v=>setCompF({...compForm,title:v})}
                placeholder="عنوان المنافسة..." placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>الوصف</Text>
              <TextInput style={[inpStyle,{height:70,textAlignVertical:'top'}]}
                value={compForm.description} onChangeText={v=>setCompF({...compForm,description:v})}
                multiline placeholder="تفاصيل المنافسة..." placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>الميزانية (SAR)</Text>
              <TextInput style={inpStyle} value={compForm.budget}
                onChangeText={v=>setCompF({...compForm,budget:v})}
                keyboardType="numeric" placeholder="500000" placeholderTextColor={C.textMuted}/>
              <Text style={lbl}>تاريخ الإغلاق *</Text>
              <TextInput style={inpStyle} value={compForm.closing_date}
                onChangeText={v=>setCompF({...compForm,closing_date:v})}
                placeholder="2025-12-31" placeholderTextColor={C.textMuted}/>
              <View style={{ flexDirection:'row', gap:10 }}>
                <TouchableOpacity onPress={() => setCM(false)}
                  style={{ flex:1, borderRadius:12, paddingVertical:13, alignItems:'center',
                    borderWidth:1, borderColor:C.borderCard }}>
                  <Text style={{ color:C.textMuted, fontFamily:'Tajawal' }}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={createComp} disabled={creating}
                  style={{ flex:2, backgroundColor:C.magenta, borderRadius:12,
                    paddingVertical:13, alignItems:'center', opacity:creating?0.7:1 }}>
                  {creating
                    ? <ActivityIndicator color="#fff" size="small"/>
                    : <Text style={{color:'#fff',fontWeight:'700',fontFamily:'Tajawal'}}>نشر المنافسة 🚀</Text>
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
