import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';

const DEMO = [
  { label:'👑 مالك المنصة', email:'owner@FLOWRIZ.sa',  pass:'Owner@Flowriz2025', color: C.magenta },
  { label:'🛡️ مدير النظام', email:'admin@FLOWRIZ.sa',  pass:'Admin@123456',       color: C.violet  },
  { label:'🛒 مشترٍ',        email:'buyer@demo.com',    pass:'Buyer@123456',       color: C.cyan    },
  { label:'📦 مورد',          email:'supplier@demo.com', pass:'Supplier@123456',    color: C.emerald },
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
      const user = await login(email.trim(), password);
      // Navigation happens automatically via AuthContext state change
    } catch (err) {
      Alert.alert('خطأ في الدخول', err.response?.data?.message || 'تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: C.bgCard2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderViolet,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: C.textMain,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'Tajawal',
    marginBottom: 12,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor: C.bgDeep }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:24 }}
        keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={{ alignItems:'center', marginBottom:36 }}>
          <View style={{
            width:72, height:72, borderRadius:20,
            backgroundColor: C.violet,
            justifyContent:'center', alignItems:'center',
            marginBottom:12,
            shadowColor: C.violet, shadowOpacity:0.5, shadowRadius:20, elevation:8,
          }}>
            <Text style={{ fontSize:32 }}>⬡</Text>
          </View>
          <Text style={{ color:C.textMain, fontSize:28, fontWeight:'800', fontFamily:'Tajawal' }}>FLOWRIZ</Text>
          <Text style={{ color:C.textMuted, fontSize:13, marginTop:4, fontFamily:'Tajawal' }}>
            منصة سلاسل الإمداد الذكية
          </Text>
        </View>

        {/* Form Card */}
        <View style={{
          backgroundColor: C.bgCard,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: C.borderViolet,
          shadowColor: C.violet, shadowOpacity:0.15, shadowRadius:20, elevation:5,
        }}>
          <Text style={{ color:C.textMain, fontSize:20, fontWeight:'700', marginBottom:20,
            textAlign:'right', fontFamily:'Tajawal' }}>تسجيل الدخول</Text>

          <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
            marginBottom:6, fontFamily:'Tajawal' }}>البريد الإلكتروني</Text>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            placeholder="email@company.com"
            placeholderTextColor={C.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={{ color:C.textMuted, fontSize:12, textAlign:'right',
            marginBottom:6, fontFamily:'Tajawal' }}>كلمة المرور</Text>
          <TextInput
            style={inputStyle}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={C.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: C.violet,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: 'center',
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
              shadowColor: C.violet, shadowOpacity:0.4, shadowRadius:12, elevation:6,
            }}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={{ color:'#fff', fontSize:16, fontWeight:'700', fontFamily:'Tajawal' }}>
                  تسجيل الدخول
                </Text>
            }
          </TouchableOpacity>

          {/* Demo Accounts */}
          <View style={{
            backgroundColor: C.bgCard2,
            borderRadius: 12,
            padding: 14,
            marginTop: 18,
            borderWidth: 1,
            borderColor: C.borderViolet,
          }}>
            <Text style={{ color:C.textMuted, fontSize:11, fontWeight:'700',
              textAlign:'right', marginBottom:8, fontFamily:'Tajawal' }}>
              حسابات تجريبية — اضغط للملء التلقائي:
            </Text>
            {DEMO.map(d => (
              <TouchableOpacity
                key={d.email}
                onPress={() => { setEmail(d.email); setPassword(d.pass); }}
                style={{ paddingVertical: 6 }}>
                <Text style={{ color:d.color, fontSize:12, textAlign:'right', fontFamily:'Tajawal' }}>
                  {d.label}: {d.email}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Register link */}
        <View style={{ flexDirection:'row', justifyContent:'center', marginTop:20, gap:4 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color:C.violet, fontSize:14, fontWeight:'700', fontFamily:'Tajawal' }}>
              سجّل الآن
            </Text>
          </TouchableOpacity>
          <Text style={{ color:C.textMuted, fontSize:14, fontFamily:'Tajawal' }}>ليس لديك حساب؟</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
