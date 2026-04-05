import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { C } from '../theme/colors';

// ── Loading Screen ────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={{ flex:1, backgroundColor:C.bgDeep, justifyContent:'center', alignItems:'center' }}>
      <View style={{
        width:72, height:72, borderRadius:20,
        backgroundColor:C.bgCard2, borderWidth:2, borderColor:C.green,
        justifyContent:'center', alignItems:'center', marginBottom:20,
        shadowColor:C.green, shadowOpacity:0.4, shadowRadius:20, elevation:8,
      }}>
        <Text style={{ fontSize:32 }}>⬡</Text>
      </View>
      <ActivityIndicator color={C.green} size="large"/>
      <Text style={{ color:C.textMuted, marginTop:14, fontFamily:'Tajawal', fontSize:14 }}>
        جارٍ التحميل...
      </Text>
    </View>
  );
}

// ── AI Button ─────────────────────────────────────────────────────────────────
export function AIButton({ title, onPress, disabled, loading, variant='green', style }) {
  const bg = variant === 'gold' ? C.gold : C.green;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[{
        backgroundColor: bg,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        opacity: disabled || loading ? 0.5 : 1,
        shadowColor: bg, shadowOpacity:0.35, shadowRadius:12, elevation:5,
      }, style]}>
      {loading
        ? <ActivityIndicator color="#000" size="small"/>
        : <Text style={{ color:'#000', fontWeight:'800', fontSize:15, fontFamily:'Tajawal' }}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, accent }) {
  return (
    <View style={[{
      backgroundColor: C.bgCard,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: accent === 'gold' ? C.borderGold
                 : accent === 'green' ? C.borderGreen
                 : C.borderCard,
    }, style]}>
      {children}
    </View>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const statusMap = {
  open:      ['مفتوح',    C.green],
  closed:    ['مغلق',     C.textMuted],
  awarded:   ['مُرسى',    C.gold],
  cancelled: ['ملغى',     C.red],
  pending:   ['معلّق',    C.gold],
  submitted: ['مقدّم',    '#60A5FA'],
  financed:  ['ممول',     C.green],
  approved:  ['معتمد',    C.green],
  financing_requested: ['طلب تمويل', C.gold],
  paid:      ['مدفوع',    C.green],
  overdue:   ['متأخر',    C.red],
};

export function StatusBadge({ status }) {
  const [label, color] = statusMap[status] || ['—', C.textMuted];
  return (
    <View style={{
      backgroundColor: color + '22',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: color + '44',
    }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', fontFamily: 'Tajawal' }}>{label}</Text>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
      <TouchableOpacity onPress={onAction} disabled={!onAction}>
        {action
          ? <Text style={{ color:C.gold, fontSize:12, fontFamily:'Tajawal', fontWeight:'700' }}>{action} ←</Text>
          : <View/>
        }
      </TouchableOpacity>
      <Text style={{ color:C.textMain, fontSize:17, fontWeight:'700', fontFamily:'Tajawal' }}>{title}</Text>
    </View>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
export function KPICard({ label, value, color, icon }) {
  const c = color || C.green;
  return (
    <View style={{
      flex: 1,
      backgroundColor: C.bgCard,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c + '33',
      minWidth: 140,
    }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
        <View style={{ backgroundColor:c+'18', borderRadius:10, padding:8 }}>
          <Text style={{ fontSize:16 }}>{icon}</Text>
        </View>
        <View style={{ flex:1, marginRight:10 }}>
          <Text style={{ color:C.textMuted, fontSize:11, textAlign:'right',
            fontFamily:'Tajawal', marginBottom:4 }}>{label}</Text>
          <Text style={{ color:c, fontSize:20, fontWeight:'800', textAlign:'right',
            fontFamily:'Tajawal' }}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ color }) {
  return <View style={{ height:1, backgroundColor: color || C.borderCard, marginVertical:8 }}/>;
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <View style={{ alignItems:'center', paddingVertical:40 }}>
      <View style={{
        width:72, height:72, borderRadius:36, backgroundColor:C.bgCard2,
        justifyContent:'center', alignItems:'center', marginBottom:14,
        borderWidth:1, borderColor:C.borderCard,
      }}>
        <Text style={{ fontSize:34 }}>{icon}</Text>
      </View>
      <Text style={{ color:C.textMain, fontSize:16, fontWeight:'700',
        fontFamily:'Tajawal', marginBottom:6 }}>{title}</Text>
      {subtitle && (
        <Text style={{ color:C.textMuted, fontSize:13, textAlign:'center',
          fontFamily:'Tajawal', lineHeight:20 }}>{subtitle}</Text>
      )}
    </View>
  );
}

// ── Separator Row ─────────────────────────────────────────────────────────────
export function InfoRow({ label, value, valueColor }) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between',
      alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.borderCard }}>
      <Text style={{ color: valueColor || C.textMain, fontSize:13,
        fontFamily:'Tajawal', fontWeight:'600' }}>{value}</Text>
      <Text style={{ color:C.textMuted, fontSize:13, fontFamily:'Tajawal' }}>{label}</Text>
    </View>
  );
}
