import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { rfqAPI, categoriesAPI } from '../utils/api';
import { C } from '../theme/colors';
import { Card } from '../components';

export default function RFQCreateScreen({ navigation }) {
  const [cats, setCats]   = useState([]);
  const [loading, setL]   = useState(false);
  const [form, setForm]   = useState({
    title:'', description:'', category_id:'',
    quantity:'', unit:'قطعة', budget_min:'', budget_max:'',
    delivery_date:'', closing_date:'',
  });

  useEffect(() => {
    categoriesAPI.list().then(r => setCats(r.data.data || [])).catch(()=>{});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.closing_date)
      return Alert.alert('تنبيه', 'يرجى ملء العنوان وتاريخ الإغلاق');
    setL(true);
    try {
      await rfqAPI.create(form);
      Alert.alert('✅ تم إنشاء الطلب!', 'سيُعرض طلبك على الموردين فوراً', [
        { text:'حسناً', onPress:()=>navigation.goBack() },
      ]);
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في الإنشاء');
    } finally { setL(false); }
  };

  const inpStyle = {
    backgroundColor:C.bgCard2, borderRadius:12, borderWidth:1, borderColor:C.borderViolet,
    paddingHorizontal:14, paddingVertical:11, color:C.textMain, fontSize:14,
    textAlign:'right', fontFamily:'Tajawal', marginBottom:12, writingDirection:'rtl',
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bgDeep }}
      behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding:16 }} keyboardShouldPersistTaps="handled">

        <Card style={{ marginBottom:16 }}>
          <Text style={{ color:C.textMain, fontSize:17, fontWeight:'700',
            textAlign:'right', fontFamily:'Tajawal', marginBottom:16 }}>
            📋 طلب شراء جديد
          </Text>

          <Text style={lbl}>عنوان الطلب *</Text>
          <TextInput style={inpStyle} value={form.title}
            onChangeText={v=>set('title',v)}
            placeholder="عنوان طلب الشراء..." placeholderTextColor={C.textMuted}/>

          <Text style={lbl}>وصف تفصيلي</Text>
          <TextInput style={[inpStyle,{height:90,textAlignVertical:'top'}]}
            value={form.description} onChangeText={v=>set('description',v)}
            multiline placeholder="تفاصيل المنتج أو الخدمة..." placeholderTextColor={C.textMuted}/>

          <View style={{ flexDirection:'row', gap:10 }}>
            <View style={{ flex:2 }}>
              <Text style={lbl}>الكمية</Text>
              <TextInput style={inpStyle} value={form.quantity}
                onChangeText={v=>set('quantity',v)} keyboardType="numeric"
                placeholder="100" placeholderTextColor={C.textMuted}/>
            </View>
            <View style={{ flex:1 }}>
              <Text style={lbl}>الوحدة</Text>
              <TextInput style={inpStyle} value={form.unit}
                onChangeText={v=>set('unit',v)}
                placeholder="قطعة" placeholderTextColor={C.textMuted}/>
            </View>
          </View>

          <View style={{ flexDirection:'row', gap:10 }}>
            <View style={{ flex:1 }}>
              <Text style={lbl}>الميزانية (من)</Text>
              <TextInput style={inpStyle} value={form.budget_min}
                onChangeText={v=>set('budget_min',v)} keyboardType="numeric"
                placeholder="0" placeholderTextColor={C.textMuted}/>
            </View>
            <View style={{ flex:1 }}>
              <Text style={lbl}>الميزانية (إلى)</Text>
              <TextInput style={inpStyle} value={form.budget_max}
                onChangeText={v=>set('budget_max',v)} keyboardType="numeric"
                placeholder="100000" placeholderTextColor={C.textMuted}/>
            </View>
          </View>

          <Text style={lbl}>تاريخ الإغلاق (YYYY-MM-DD) *</Text>
          <TextInput style={inpStyle} value={form.closing_date}
            onChangeText={v=>set('closing_date',v)}
            placeholder="2025-12-31" placeholderTextColor={C.textMuted}/>

          <Text style={lbl}>تاريخ التسليم المطلوب</Text>
          <TextInput style={inpStyle} value={form.delivery_date}
            onChangeText={v=>set('delivery_date',v)}
            placeholder="2026-01-15" placeholderTextColor={C.textMuted}/>

          <TouchableOpacity onPress={submit} disabled={loading}
            style={{
              backgroundColor:C.violet, borderRadius:14, paddingVertical:15,
              alignItems:'center', marginTop:8, opacity:loading?0.7:1,
              shadowColor:C.violet, shadowOpacity:0.4, shadowRadius:12, elevation:6,
            }}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={{color:'#fff',fontSize:16,fontWeight:'700',fontFamily:'Tajawal'}}>
                  نشر الطلب 🚀
                </Text>
            }
          </TouchableOpacity>
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const lbl = { color:C.textMuted, fontSize:12, textAlign:'right', marginBottom:5, fontFamily:'Tajawal' };
