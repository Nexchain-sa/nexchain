import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { C, roleColors, roleLabels } from '../theme/colors';
import { Card } from '../components';

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const [editing, setEditing]   = useState(false);
  const [savingP, setSavingP]   = useState(false);
  const [savingPW, setSavingPW] = useState(false);
  const [form, setForm]         = useState({
    name:         user?.name || '',
    company_name: user?.company_name || '',
    phone:        user?.phone || '',
    city:         user?.city || '',
  });
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm:'' });
  const [showPW, setShowPW] = useState(false);

  const roleColor = roleColors[user?.role] || C.violet;

  const saveProfile = async () => {
    setSavingP(true);
    try {
      const r = await authAPI.updateProfile(form);
      setUser(r.data.data);
      Alert.alert('✅', 'تم تحديث البيانات بنجاح!');
      setEditing(false);
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في الحفظ');
    } finally { setSavingP(false); }
  };

  const changePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password)
      return Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
    if (pwForm.new_password !== pwForm.confirm)
      return Alert.alert('خطأ', 'كلمتا المرور الجديدتان غير متطابقتين');
    setSavingPW(true);
    try {
      await authAPI.changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      Alert.alert('✅', 'تم تغيير كلمة المرور بنجاح!');
      setPwForm({ current_password:'', new_password:'', confirm:'' });
      setShowPW(false);
    } catch(err) {
      Alert.alert('خطأ', err.response?.data?.message || 'خطأ في تغيير كلمة المرور');
    } finally { setSavingPW(false); }
  };

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text:'إلغاء', style:'cancel' },
      { text:'خروج', style:'destructive', onPress: logout },
    ]);
  };

  const inpStyle = {
    backgroundColor:C.bgCard2, borderRadius:12, borderWidth:1, borderColor:C.borderViolet,
    paddingHorizontal:14, paddingVertical:11, color:C.textMain, fontSize:14,
    textAlign:'right', fontFamily:'Tajawal', marginBottom:10, writingDirection:'rtl',
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bgDeep }}
      contentContainerStyle={{ padding:16 }}>

      {/* Profile Header */}
      <View style={{ alignItems:'center', marginBottom:24 }}>
        <View style={{
          width:80, height:80, borderRadius:40,
          backgroundColor:roleColor,
          justifyContent:'center', alignItems:'center', marginBottom:12,
          shadowColor:roleColor, shadowOpacity:0.4, shadowRadius:16, elevation:6,
        }}>
          <Text style={{ color:'#fff', fontSize:30, fontWeight:'800', fontFamily:'Tajawal' }}>
            {user?.name?.[0]?.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color:C.textMain, fontSize:20, fontWeight:'700', fontFamily:'Tajawal' }}>
          {user?.name}
        </Text>
        <View style={{
          backgroundColor:roleColor+'20', borderRadius:10, paddingHorizontal:14,
          paddingVertical:5, marginTop:6, borderWidth:1, borderColor:roleColor+'44',
        }}>
          <Text style={{ color:roleColor, fontSize:13, fontWeight:'700', fontFamily:'Tajawal' }}>
            {roleLabels[user?.role]}
          </Text>
        </View>
        <Text style={{ color:C.textMuted, fontSize:13, marginTop:6, fontFamily:'Tajawal' }}>
          {user?.email}
        </Text>
        {user?.is_verified && (
          <Text style={{ color:C.emerald, fontSize:12, marginTop:4, fontFamily:'Tajawal' }}>
            ✅ حساب موثّق
          </Text>
        )}
      </View>

      {/* Profile Info */}
      <Card style={{ marginBottom:16 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <TouchableOpacity onPress={() => editing ? saveProfile() : setEditing(true)}
            disabled={savingP}
            style={{
              backgroundColor: editing ? C.emerald : C.bgCard2,
              borderRadius:10, paddingHorizontal:14, paddingVertical:7,
              borderWidth:1, borderColor: editing ? C.emerald : C.borderCard,
            }}>
            {savingP
              ? <ActivityIndicator color="#fff" size="small"/>
              : <Text style={{ color: editing ? '#fff' : C.textMuted,
                  fontSize:12, fontWeight:'700', fontFamily:'Tajawal' }}>
                  {editing ? 'حفظ ✓' : '✏️ تعديل'}
                </Text>
            }
          </TouchableOpacity>
          <Text style={{ color:C.textMain, fontSize:16, fontWeight:'700', fontFamily:'Tajawal' }}>
            بيانات الحساب
          </Text>
        </View>

        {[
          ['name',         'الاسم الكامل'],
          ['company_name', 'اسم الشركة'],
          ['phone',        'رقم الجوال'],
          ['city',         'المدينة'],
        ].map(([k, label]) => (
          <View key={k} style={{ marginBottom:12 }}>
            <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
              fontFamily:'Tajawal', marginBottom:4 }}>{label}</Text>
            {editing ? (
              <TextInput style={inpStyle} value={form[k]}
                onChangeText={v=>setForm({...form,[k]:v})}
                placeholder={label} placeholderTextColor={C.textMuted}/>
            ) : (
              <Text style={{ color:C.textMain, fontSize:14, textAlign:'right',
                fontFamily:'Tajawal', fontWeight:'600' }}>
                {user?.[k] || '—'}
              </Text>
            )}
          </View>
        ))}

        {editing && (
          <TouchableOpacity onPress={() => setEditing(false)}
            style={{ borderRadius:10, paddingVertical:10, alignItems:'center',
              borderWidth:1, borderColor:C.borderCard, marginTop:4 }}>
            <Text style={{ color:C.textMuted, fontFamily:'Tajawal' }}>إلغاء</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Change Password */}
      <Card style={{ marginBottom:16 }}>
        <TouchableOpacity
          onPress={() => setShowPW(!showPW)}
          style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <Text style={{ color:C.gold, fontSize:13, fontFamily:'Tajawal' }}>
            {showPW ? '▲' : '▼'}
          </Text>
          <Text style={{ color:C.textMain, fontSize:15, fontWeight:'700', fontFamily:'Tajawal' }}>
            🔒 تغيير كلمة المرور
          </Text>
        </TouchableOpacity>
        {showPW && (
          <View style={{ marginTop:14 }}>
            {[
              ['current_password', 'كلمة المرور الحالية'],
              ['new_password',     'كلمة المرور الجديدة'],
              ['confirm',          'تأكيد كلمة المرور الجديدة'],
            ].map(([k, label]) => (
              <View key={k}>
                <Text style={lbl}>{label}</Text>
                <TextInput style={inpStyle} value={pwForm[k]}
                  onChangeText={v=>setPwForm({...pwForm,[k]:v})}
                  secureTextEntry placeholder="••••••••" placeholderTextColor={C.textMuted}/>
              </View>
            ))}
            <TouchableOpacity onPress={changePassword} disabled={savingPW}
              style={{
                backgroundColor:C.violet, borderRadius:12, paddingVertical:12,
                alignItems:'center', opacity:savingPW?0.7:1, marginTop:4,
              }}>
              {savingPW
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={{color:'#fff',fontWeight:'700',fontFamily:'Tajawal'}}>
                    حفظ كلمة المرور
                  </Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* App Info */}
      <Card style={{ marginBottom:16 }}>
        <Text style={{ color:C.textMain, fontSize:15, fontWeight:'700',
          textAlign:'right', fontFamily:'Tajawal', marginBottom:12 }}>ℹ️ معلومات التطبيق</Text>
        {[
          ['اسم المنصة',    'FLOWRIZ'],
          ['الإصدار',       '1.0.0'],
          ['نوع الحساب',    roleLabels[user?.role] || user?.role],
          ['حالة الحساب',   user?.is_approved ? '✅ معتمد' : '⏳ قيد الاعتماد'],
        ].map(([k, v]) => (
          <View key={k} style={{ flexDirection:'row', justifyContent:'space-between',
            paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.borderCard }}>
            <Text style={{ color:C.textMuted, fontSize:13, fontFamily:'Tajawal' }}>{v}</Text>
            <Text style={{ color:C.textMain, fontSize:13, fontFamily:'Tajawal', fontWeight:'600' }}>{k}</Text>
          </View>
        ))}
      </Card>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout}
        style={{
          backgroundColor:'#EF444415', borderRadius:14, paddingVertical:15,
          alignItems:'center', borderWidth:1, borderColor:'#EF444433', marginBottom:32,
        }}>
        <Text style={{ color:C.red, fontSize:15, fontWeight:'700', fontFamily:'Tajawal' }}>
          🚪 تسجيل الخروج
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const lbl = { color:C.textMuted, fontSize:12, textAlign:'right', marginBottom:5, fontFamily:'Tajawal' };
