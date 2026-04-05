import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';

const DEMO = [
  { label:'👑 مالك المنصة', email:'owner@FLOWRIZ.sa',  pass:'Owner@Flowriz2025', color:C.gold   },
  { label:'🛡️ مدير النظام', email:'admin@FLOWRIZ.sa',  pass:'Admin@123456',      color:C.green  },
  { label:'🛒 مشترٍ',        email:'buyer@demo.com',    pass:'Buyer@123456',      color:C.textMain },
  { label:'📦 مورد',          email:'supplier@demo.com', pass:'Supplier@123456',   color:'#60A5FA' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('تنبيه', 'يرجى إدخال البريد وكلمة المرور');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذّر الاتصال بالخادم');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bgDeep }}
      behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:24 }}
        keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={{ alignItems:'center', marginBottom:40 }}>
          {/* Glow ring */}
          <View style={{
            width:90, height:90, borderRadius:26,
            backgroundColor:C.bgCard2,
            borderWidth:2, borderColor:C.green,
            justifyContent:'center', alignItems:'center', marginBottom:16,
            shadowColor:C.green, shadowOpacity:0.5, shadowRadius:24, elevation:10,
          }}>
            <Text style={{ fontSize:40 }}>⬡</Text>
          </View>
          <Text style={{ color:C.white, fontSize:32, fontWeight:'900', letterSpacing:2, fontFamily:'Tajawal' }}>
            FLOWRIZ
          </Text>
          {/* Gold underline */}
          <View style={{ width:60, height:3, backgroundColor:C.gold, borderRadius:2, marginTop:6 }}/>
          <Text style={{ color:C.textMuted, fontSize:13, marginTop:10, fontFamily:'Tajawal' }}>
            منصة سلاسل الإمداد الذكية
          </Text>
        </View>

        {/* Form */}
        <View style={{
          backgroundColor:C.bgCard, borderRadius:22, padding:24,
          borderWidth:1, borderColor:C.borderCard,
          shadowColor:C.green, shadowOpacity:0.08, shadowRadius:20, elevation:4,
        }}>
          <Text style={{ color:C.white, fontSize:20, fontWeight:'700',
            textAlign:'right', fontFamily:'Tajawal', marginBottom:20 }}>
            تسجيل الدخول
          </Text>

          <Text style={lbl}>البريد الإلكتروني</Text>
          <TextInput style={inp} value={email} onChangeText={setEmail}
            placeholder="email@company.com" placeholderTextColor={C.textMuted}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/>

          <Text style={lbl}>كلمة المرور</Text>
          <TextInput style={inp} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor={C.textMuted} secureTextEntry/>

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}
            style={{
              backgroundColor:C.green, borderRadius:14, paddingVertical:15,
              alignItems:'center', marginTop:8, opacity:loading?0.7:1,
              shadowColor:C.green, shadowOpacity:0.45, shadowRadius:14, elevation:7,
            }}>
            {loading
              ? <ActivityIndicator color="#000"/>
              : <Text style={{ color:'#000', fontSize:16, fontWeight:'800', fontFamily:'Tajawal' }}>
                  تسجيل الدخول
                </Text>
            }
          </TouchableOpacity>

          {/* Demo */}
          <View style={{
            backgroundColor:C.bgCard2, borderRadius:14, padding:14, marginTop:18,
            borderWidth:1, borderColor:C.borderCard,
          }}>
            <Text style={{ color:C.gold, fontSize:11, fontWeight:'800',
              textAlign:'right', marginBottom:8, fontFamily:'Tajawal', letterSpacing:0.5 }}>
              ◆ حسابات تجريبية — اضغط للملء:
            </Text>
            {DEMO.map(d => (
              <TouchableOpacity key={d.email}
                onPress={() => { setEmail(d.email); setPassword(d.pass); }}
                style={{ paddingVertical:7, borderBottomWidth:1, borderBottomColor:C.borderCard }}>
                <Text style={{ color:d.color, fontSize:12, textAlign:'right', fontFamily:'Tajawal' }}>
                  {d.label}: {d.email}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flexDirection:'row', justifyContent:'center', marginTop:20, gap:6 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color:C.gold, fontSize:14, fontWeight:'700', fontFamily:'Tajawal' }}>
              سجّل الآن ←
            </Text>
          </TouchableOpacity>
          <Text style={{ color:C.textMuted, fontSize:14, fontFamily:'Tajawal' }}>ليس لديك حساب؟</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const lbl = { color:C.textMuted, fontSize:12, textAlign:'right',
  marginBottom:7, fontFamily:'Tajawal', fontWeight:'600' };
const inp = {
  backgroundColor:C.bgCard2, borderRadius:12, borderWidth:1, borderColor:C.borderInput,
  paddingHorizontal:16, paddingVertical:13, color:C.textMain, fontSize:14,
  textAlign:'right', writingDirection:'rtl', fontFamily:'Tajawal', marginBottom:14,
};
