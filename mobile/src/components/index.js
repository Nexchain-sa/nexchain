import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { C } from '../theme/colors';

// ── Loading Screen ────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={{ flex:1, backgroundColor:C.bgDeep, justifyContent:'center', alignItems:'center' }}>
      <Text style={{ fontSize:28, marginBottom:16 }}>⬡</Text>
      <ActivityIndicator color={C.violet} size="large"/>
      <Text style={{ color:C.textMuted, marginTop:12, fontFamily:'Tajawal' }}>جارٍ التحميل...</Text>
    </View>
  );
}

// ── AI Button ─────────────────────────────────────────────────────────────────
export function AIButton({ title, onPress, disabled, loading, color = C.violet, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{
        backgroundColor: color,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        opacity: disabled || loading ? 0.5 : 1,
      }, style]}>
      {loading
        ? <ActivityIndicator color="#fff" size="small"/>
        : <Text style={{ color:'#fff', fontWeight:'700', fontSize:15, fontFamily:'Tajawal' }}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ── AI Input ──────────────────────────────────────────────────────────────────
export function AIInput({ label, style, inputStyle, ...props }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {label && (
        <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 6,
          textAlign:'right', fontFamily:'Tajawal' }}>{label}</Text>
      )}
      <View style={{
        backgroundColor: C.bgCard2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.borderViolet,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}>
        <props.Component
          style={[{
            color: C.textMain,
            fontSize: 14,
            textAlign: 'right',
            fontFamily: 'Tajawal',
            writingDirection: 'rtl',
          }, inputStyle]}
          placeholderTextColor={C.textMuted}
          {...props}
        />
      </View>
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, color }) {
  return (
    <View style={[{
      backgroundColor: C.bgCard,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: color ? color + '33' : C.borderCard,
    }, style]}>
      {children}
    </View>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const statusMap = {
  open:      ['مفتوح',  C.cyan],
  closed:    ['مغلق',   C.textMuted],
  awarded:   ['مُرسى',  C.emerald],
  cancelled: ['ملغى',   C.red],
  pending:   ['معلّق',  C.gold],
  submitted: ['مقدّم',  C.violet],
  financed:  ['ممول',   C.emerald],
  approved:  ['معتمد',  C.emerald],
  financing_requested: ['طلب تمويل', C.violet],
  paid:      ['مدفوع',  C.emerald],
  overdue:   ['متأخر',  C.red],
};

export function StatusBadge({ status }) {
  const [label, color] = statusMap[status] || ['—', C.textMuted];
  return (
    <View style={{
      backgroundColor: color + '20',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', fontFamily: 'Tajawal' }}>{label}</Text>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
      <Text style={{ color:C.textMain, fontSize:17, fontWeight:'700', fontFamily:'Tajawal' }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color:C.violet, fontSize:12, fontFamily:'Tajawal' }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={{ height:1, backgroundColor: C.borderCard, marginVertical:8 }}/>;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
export function KPICard({ label, value, color = C.violet, icon }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: C.bgCard,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: color + '33',
      minWidth: 130,
    }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color:C.textMuted, fontSize:11, marginBottom:4, textAlign:'right', fontFamily:'Tajawal' }}>{label}</Text>
          <Text style={{ color, fontSize:20, fontWeight:'700', textAlign:'right', fontFamily:'Tajawal' }}>{value}</Text>
        </View>
        {icon && (
          <View style={{ backgroundColor: color+'15', borderRadius:10, padding:8, marginLeft:8 }}>
            <Text style={{ fontSize:16 }}>{icon}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <View style={{ alignItems:'center', paddingVertical:40 }}>
      <Text style={{ fontSize:48, marginBottom:12 }}>{icon}</Text>
      <Text style={{ color:C.textMain, fontSize:16, fontWeight:'700', fontFamily:'Tajawal', marginBottom:6 }}>{title}</Text>
      {subtitle && (
        <Text style={{ color:C.textMuted, fontSize:13, textAlign:'center', fontFamily:'Tajawal' }}>{subtitle}</Text>
      )}
    </View>
  );
}
