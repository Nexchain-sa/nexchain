import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { invoiceAPI, financingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';
import { Card, StatusBadge, EmptyState, SectionHeader } from '../components';

const FINANCING_TYPES = [
  { id:'company',    icon:'🏦', label:'شركة تمويل',   desc:'تمويل عبر شركات مرخصة',      color:C.cyan    },
  { id:'individual', icon:'👤', label:'مستثمر فردي',  desc:'تمويل مباشر من مستثمرين',     color:C.violet  },
  { id:'fund',       icon:'🏛️', label:'صندوق المنصة', desc:'تمويل من صندوق FLOWRIZ',      color:C.emerald },
];

export default function InvoicesScreen() {
  const { user } = useAuth();
  const [invs, setInvs]         = useState([]);
  const [loading, setL]         = useState(true);
  const [refresh, setRef]       = useState(false);
  const [showCreate, setCreate] = useState(false);
  const [finModal, setFinModal] = useState(null);
  const [finType, setFinType]   = useState(null);
  const [finAmount, setFinAmt]  = useState('');
  const [finSub, setFinSub]     = useState(false);
  const [finDone, setFinDone]   = useState(false);
  const [form, setForm]         = useState({ amount:'', due_date:'', notes:'' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const r = await invoiceAPI.list();
      setInvs(r.data.data || []);
    } catch {}
    setL(false); setRef(false);
  };

  useEffect(() => { load(); }, []);

  const createInvoice = async () => {
    if (!form.amount || !form.due_date)
      return Alert.alert('تنبيه', 'يرجى ملء المبلغ وتاريخ الاستحقاق');
    setCreating(true);
    try {
      await invoiceAPI.create(form);
      Alert.alert('✅', 'تم إنشاء الفاتورة بنجاح!');
      setCreate(false);
      setForm({ amount:'', due_date:'', notes:'' });
      load();
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في الإنشاء');
    } finally { setCreating(false); }
  };

  const openFin = (inv) => {
    setFinModal(inv);
    setFinType(null);
    setFinAmt(String(inv.amount));
    setFinDone(false);
  };

  const submitFin = async () => {
    if (!finType) return Alert.alert('تنبيه', 'اختر جهة التمويل');
    setFinSub(true);
    try {
      await financingAPI.request({
        invoice_id:       finModal.id,
        requested_amount: finAmount,
        financing_type:   finType,
      });
      setFinDone(true);
      load();
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في الطلب');
    } finally { setFinSub(false); }
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

        {/* Create Form */}
        {showCreate && (
          <Card style={{ marginBottom:16 }}>
            <Text style={{ color:C.textMain, fontSize:16, fontWeight:'700',
              textAlign:'right', fontFamily:'Tajawal', marginBottom:14 }}>
              🧾 إنشاء فاتورة جديدة
            </Text>
            <Text style={lbl}>المبلغ (SAR) *</Text>
            <TextInput style={inpStyle} value={form.amount}
              onChangeText={v=>setForm({...form,amount:v})}
              keyboardType="numeric" placeholder="0.00" placeholderTextColor={C.textMuted}/>
            <Text style={lbl}>تاريخ الاستحقاق (YYYY-MM-DD) *</Text>
            <TextInput style={inpStyle} value={form.due_date}
              onChangeText={v=>setForm({...form,due_date:v})}
              placeholder="2025-12-31" placeholderTextColor={C.textMuted}/>
            <Text style={lbl}>ملاحظات</Text>
            <TextInput style={[inpStyle,{height:70,textAlignVertical:'top'}]}
              value={form.notes} onChangeText={v=>setForm({...form,notes:v})}
              multiline placeholder="ملاحظات..." placeholderTextColor={C.textMuted}/>
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity onPress={()=>setCreate(false)}
                style={{ flex:1, borderRadius:12, paddingVertical:12, alignItems:'center',
                  borderWidth:1, borderColor:C.borderCard }}>
                <Text style={{ color:C.textMuted, fontFamily:'Tajawal' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createInvoice} disabled={creating}
                style={{ flex:2, backgroundColor:C.violet, borderRadius:12,
                  paddingVertical:12, alignItems:'center', opacity:creating?0.7:1 }}>
                {creating
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <Text style={{color:'#fff',fontWeight:'700',fontFamily:'Tajawal'}}>إنشاء الفاتورة</Text>
                }
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Invoice List */}
        {loading && (
          <View style={{ alignItems:'center', paddingVertical:40 }}>
            <ActivityIndicator color={C.violet} size="large"/>
          </View>
        )}
        {!loading && invs.length === 0 && (
          <EmptyState icon="🧾" title="لا توجد فواتير" subtitle="لم يتم إنشاء أي فواتير بعد"/>
        )}

        {invs.map(inv => {
          const canFinance = inv.status==='pending' &&
            (user?.role==='buyer' || user?.role==='supplier');
          return (
            <Card key={inv.id} style={{ marginBottom:12 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
                <StatusBadge status={inv.status}/>
                <Text style={{ color:C.violet, fontSize:11, fontFamily:'Tajawal' }}>
                  {inv.invoice_number}
                </Text>
              </View>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                <Text style={{ color:C.textMuted, fontSize:12, fontFamily:'Tajawal' }}>
                  {new Date(inv.due_date).toLocaleDateString('ar-SA')}
                </Text>
                <Text style={{ color:C.emerald, fontSize:17, fontWeight:'700', fontFamily:'Tajawal' }}>
                  SAR {Number(inv.amount).toLocaleString()}
                </Text>
              </View>
              <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                <Text style={{ color:C.textMuted, fontSize:11, fontFamily:'Tajawal' }}>
                  {inv.buyer_name || ''} → {inv.supplier_name || ''}
                </Text>
              </View>
              {canFinance && (
                <TouchableOpacity onPress={() => openFin(inv)}
                  style={{
                    backgroundColor:C.emerald+'20', borderRadius:10, paddingVertical:10,
                    alignItems:'center', marginTop:12, borderWidth:1, borderColor:C.emerald+'44',
                  }}>
                  <Text style={{ color:C.emerald, fontWeight:'700', fontSize:13, fontFamily:'Tajawal' }}>
                    🏦 طلب تمويل الفاتورة
                  </Text>
                </TouchableOpacity>
              )}
              {inv.status==='financing_requested' && (
                <Text style={{ color:C.violet, fontSize:12, textAlign:'center',
                  marginTop:10, fontFamily:'Tajawal' }}>🕐 قيد المراجعة</Text>
              )}
              {inv.status==='financed' && (
                <Text style={{ color:C.cyan, fontSize:12, textAlign:'center',
                  marginTop:10, fontFamily:'Tajawal' }}>✅ ممولة</Text>
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* FAB */}
      {(user?.role==='buyer' || user?.role==='supplier') && (
        <TouchableOpacity
          onPress={() => setCreate(!showCreate)}
          style={{
            position:'absolute', bottom:24, left:24,
            width:56, height:56, borderRadius:28,
            backgroundColor:C.violet, justifyContent:'center', alignItems:'center',
            shadowColor:C.violet, shadowOpacity:0.5, shadowRadius:16, elevation:8,
          }}>
          <Text style={{ color:'#fff', fontSize:28, lineHeight:30 }}>+</Text>
        </TouchableOpacity>
      )}

      {/* Financing Modal */}
      <Modal visible={!!finModal} transparent animationType="slide">
        <View style={{
          flex:1, backgroundColor:'#000000AA', justifyContent:'flex-end',
        }}>
          <View style={{
            backgroundColor:C.bgCard, borderTopLeftRadius:24, borderTopRightRadius:24,
            padding:24, borderTopWidth:1, borderTopColor:C.borderViolet,
            maxHeight:'85%',
          }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {!finDone ? (
                <>
                  <Text style={{ color:C.textMain, fontSize:18, fontWeight:'700',
                    textAlign:'right', fontFamily:'Tajawal', marginBottom:4 }}>
                    🏦 تمويل الفاتورة
                  </Text>
                  <Text style={{ color:C.violet, fontSize:12, textAlign:'right',
                    fontFamily:'Tajawal', marginBottom:16 }}>
                    {finModal?.invoice_number}
                  </Text>

                  {/* Amount */}
                  <Text style={lbl}>المبلغ المطلوب تمويله (SAR)</Text>
                  <TextInput
                    style={{
                      backgroundColor:C.bgCard2, borderRadius:12, borderWidth:1,
                      borderColor:C.borderViolet, paddingHorizontal:14, paddingVertical:11,
                      color:C.textMain, fontSize:16, fontWeight:'700', textAlign:'right',
                      fontFamily:'Tajawal', marginBottom:16,
                    }}
                    value={finAmount} onChangeText={setFinAmt} keyboardType="numeric"/>

                  {/* Type selection */}
                  <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
                    fontFamily:'Tajawal', marginBottom:10, fontWeight:'700' }}>
                    اختر جهة التمويل:
                  </Text>
                  {FINANCING_TYPES.map(({ id, icon, label, desc, color }) => (
                    <TouchableOpacity key={id} onPress={() => setFinType(id)}
                      style={{
                        flexDirection:'row', alignItems:'center', padding:14,
                        borderRadius:14, marginBottom:10, borderWidth:2,
                        backgroundColor: finType===id ? color+'15' : C.bgCard2,
                        borderColor: finType===id ? color : C.borderCard,
                      }}>
                      <View style={{
                        width:20, height:20, borderRadius:10, borderWidth:2,
                        borderColor: finType===id ? color : C.textMuted,
                        backgroundColor: finType===id ? color : 'transparent',
                        justifyContent:'center', alignItems:'center', marginLeft:12,
                      }}>
                        {finType===id && (
                          <View style={{ width:8, height:8, borderRadius:4, backgroundColor:'#fff' }}/>
                        )}
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ color:C.textMain, fontSize:14, fontWeight:'700',
                          textAlign:'right', fontFamily:'Tajawal' }}>
                          {icon} {label}
                        </Text>
                        <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
                          fontFamily:'Tajawal', marginTop:2 }}>{desc}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <View style={{ flexDirection:'row', gap:10, marginTop:8 }}>
                    <TouchableOpacity onPress={() => setFinModal(null)}
                      style={{ flex:1, borderRadius:12, paddingVertical:13, alignItems:'center',
                        borderWidth:1, borderColor:C.borderCard }}>
                      <Text style={{ color:C.textMuted, fontFamily:'Tajawal' }}>إلغاء</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={submitFin} disabled={finSub || !finType}
                      style={{
                        flex:2, backgroundColor:C.emerald, borderRadius:12,
                        paddingVertical:13, alignItems:'center',
                        opacity: finSub || !finType ? 0.5 : 1,
                      }}>
                      {finSub
                        ? <ActivityIndicator color="#fff" size="small"/>
                        : <Text style={{color:'#fff',fontWeight:'700',fontFamily:'Tajawal'}}>
                            📤 تقديم طلب التمويل
                          </Text>
                      }
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ alignItems:'center', paddingVertical:20 }}>
                  <Text style={{ fontSize:60, marginBottom:16 }}>✅</Text>
                  <Text style={{ color:C.textMain, fontSize:20, fontWeight:'700',
                    fontFamily:'Tajawal', marginBottom:8 }}>تم تقديم الطلب!</Text>
                  <Text style={{ color:C.textMuted, fontSize:13, textAlign:'center',
                    fontFamily:'Tajawal', marginBottom:24, lineHeight:22 }}>
                    سيتم مراجعة طلب تمويل الفاتورة والتواصل معك قريباً
                  </Text>
                  <TouchableOpacity onPress={() => setFinModal(null)}
                    style={{
                      backgroundColor:C.violet, borderRadius:14, paddingVertical:14,
                      paddingHorizontal:40,
                    }}>
                    <Text style={{ color:'#fff', fontWeight:'700', fontSize:15, fontFamily:'Tajawal' }}>
                      حسناً ✓
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const lbl = { color:C.textMuted, fontSize:12, textAlign:'right', marginBottom:5, fontFamily:'Tajawal' };
