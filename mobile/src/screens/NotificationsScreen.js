import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardAPI } from '../utils/api';
import { C } from '../theme/colors';
import { Card, EmptyState } from '../components';

const TYPE_META = {
  mfg_request: { icon: '🏭', color: C.gold },
  mfg_offer:   { icon: '📨', color: C.cyan || '#22D3EE' },
  mfg_awarded: { icon: '🎉', color: C.green },
  default:     { icon: '🔔', color: C.violet || '#8B5CF6' },
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'الآن';
  if (s < 3600) return `قبل ${Math.floor(s / 60)} د`;
  if (s < 86400) return `قبل ${Math.floor(s / 3600)} س`;
  return `قبل ${Math.floor(s / 86400)} يوم`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = async () => {
    try { const r = await dashboardAPI.notifications(); setItems(r.data.data || []); } catch {}
    setLoading(false); setRefresh(false);
  };

  // أعد التحميل ووسّمها كمقروءة عند فتح الشاشة
  useFocusEffect(useCallback(() => {
    load().then(() => { dashboardAPI.markRead().catch(() => {}); });
  }, []));

  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bgDeep }}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refresh}
          onRefresh={() => { setRefresh(true); load(); }} tintColor={C.green} />}>

        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={C.green} size="large" />
          </View>
        )}

        {!loading && items.length === 0 && (
          <EmptyState icon="🔔" title="لا توجد إشعارات" subtitle="ستظهر هنا تنبيهات الطلبات والعروض والتمويل" />
        )}

        {items.map(n => {
          const m = TYPE_META[n.type] || TYPE_META.default;
          return (
            <Card key={n.id} style={{ marginBottom: 10, opacity: n.is_read ? 0.7 : 1, borderColor: n.is_read ? C.borderCard : m.color + '55' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: m.color + '18', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                  <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: C.textMain, fontSize: 14, fontWeight: '700', fontFamily: 'Tajawal', textAlign: 'right', flex: 1 }}>{n.title}</Text>
                    {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.color, marginRight: 6 }} />}
                  </View>
                  <Text style={{ color: C.textMuted, fontSize: 12, fontFamily: 'Tajawal', textAlign: 'right', marginTop: 4, lineHeight: 19 }}>{n.message}</Text>
                  <Text style={{ color: C.textMuted, fontSize: 10, fontFamily: 'Tajawal', textAlign: 'right', marginTop: 6, opacity: 0.7 }}>{timeAgo(n.created_at)}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
