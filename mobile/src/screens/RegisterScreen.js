import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { authAPI } from '../utils/api';
import { C } from '../theme/colors';

const ROLES = [
  { r:'buyer',    l:'🛒 مشترٍ',   c: C.cyan    },
  { r:'supplier', l:'📦 مورد',     c: C.emerald },
  { r:'investor', l:'💰 مستثمر',  c: C.gold    },
];

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:'', email:'', password:'', confirm:'',
    role:'buyer', company_name:'', phone:'', city:'',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async () => {
    if (!form.name || !form.email || !form.password || !form.company_name)
      return Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة');
    if (form.password !== form.confirm)
      return Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
    setLoading(true);
    try {
      await authAPI.register({
        name: form.name, email: form.email, password: form.password,
        role: form.role, company_name: form.company_name,
        phone: form.phone, city: form.city,
      });
      Alert.alert('تم إنشاء الحساب! ✅', 'يرجى تسجيل الدخول', [
        { text: 'حسناً', onPress: () => navigation.navigate('Login') },
      ]);
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في التسجيل');
    } finally { setLoading(false); }
  };

  const inp = (k, placeholder, opts = {}) => (
    <TextInput
      style={{
        backgroundColor: C.bgCard2, borderRadius:12, borderWidth:1,
        borderColor: C.borderViolet, paddingHorizontal:16, paddingVertical:12,
        color:C.textMain, fontSize:14, textAlign:'right',
        writingDirection:'rtl', fontFamily:'Tajawal', marginBottom:10,
      }}
      value={form[k]}
      onChangeText={v => set(k, v)}
      placeholder={placeholder}
      placeholderTextColor={C.textMuted}
      {...opts}
    />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor:C.bgDeep }}
      behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ padding:24 }}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={{ alignItems:'center', marginTop:20, marginBottom:28 }}>
          <View style={{
            width:60, height:60, borderRadius:16, backgroundColor:C.violet,
            justifyContent:'center', alignItems:'center', marginBottom:10,
            shadowColor:C.violet, shadowOpacity:0.4, shadowRadius:12, elevation:6,
          }}>
            <Text style={{ fontSize:26 }}>⬡</Text>
          </View>
          <Text style={{ color:C.textMain, fontSize:22, fontWeight:'800', fontFamily:'Tajawal' }}>
            إنشاء حساب جديد
          </Text>
          <Text style={{ color:C.textMuted, fontSize:13, fontFamily:'Tajawal' }}>انضم إلى منصة FLOWRIZ</Text>
        </View>

        <View style={{
          backgroundColor:C.bgCard, borderRadius:20, padding:22,
          borderWidth:1, borderColor:C.borderViolet,
        }}>

          {/* Role tabs */}
          <View style={{
            flexDirection:'row', backgroundColor:C.bgCard2,
            borderRadius:12, padding:4, marginBottom:18,
          }}>
            {ROLES.map(({ r, l, c }) => (
              <TouchableOpacity key={r} onPress={() => set('role', r)}
                style={{
                  flex:1, paddingVertical:9, borderRadius:10, alignItems:'center',
                  backgroundColor: form.role===r ? C.violet : 'transparent',
                }}>
                <Text style={{
                  color: form.role===r ? '#fff' : C.textMuted,
                  fontSize:12, fontWeight:'700', fontFamily:'Tajawal',
                }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={lbl}>الاسم الكامل *</Text>
          {inp('name','الاسم...')}

          <Text style={lbl}>اسم الشركة / المؤسسة *</Text>
          {inp('company_name','اسم الجهة...')}

          <Text style={lbl}>البريد الإلكتروني *</Text>
          {inp('email','email@company.com',{keyboardType:'email-address',autoCapitalize:'none'})}

          <Text style={lbl}>رقم الجوال</Text>
          {inp('phone','+966 5X...',{keyboardType:'phone-pad'})}

          <Text style={lbl}>المدينة</Text>
          {inp('city','الرياض...')}

          <Text style={lbl}>كلمة المرور *</Text>
          {inp('password','8 أحرف+',{secureTextEntry:true})}

          <Text style={lbl}>تأكيد كلمة المرور *</Text>
          {inp('confirm','••••••••',{secureTextEntry:true})}

          <TouchableOpacity
            onPress={handle} disabled={loading} activeOpacity={0.85}
            style={{
              backgroundColor:C.violet, borderRadius:14, paddingVertical:15,
              alignItems:'center', marginTop:8, opacity:loading?0.7:1,
              shadowColor:C.violet, shadowOpacity:0.4, shadowRadius:12, elevation:6,
            }}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={{color:'#fff',fontSize:16,fontWeight:'700',fontFamily:'Tajawal'}}>
                  إنشاء الحساب
                </Text>
            }
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection:'row', justifyContent:'center', marginTop:16, gap:4 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color:C.violet, fontSize:14, fontWeight:'700', fontFamily:'Tajawal' }}>تسجيل الدخول</Text>
          </TouchableOpacity>
          <Text style={{ color:C.textMuted, fontSize:14, fontFamily:'Tajawal' }}>لديك حساب؟</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const lbl = {
  color: C.textMuted, fontSize:12, textAlign:'right',
  marginBottom:5, fontFamily:'Tajawal', fontWeight:'600',
};
