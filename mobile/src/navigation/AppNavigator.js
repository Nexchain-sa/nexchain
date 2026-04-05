import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';
import { LoadingScreen } from '../components';

import LoginScreen        from '../screens/LoginScreen';
import RegisterScreen     from '../screens/RegisterScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import RFQListScreen      from '../screens/RFQListScreen';
import RFQDetailScreen    from '../screens/RFQDetailScreen';
import RFQCreateScreen    from '../screens/RFQCreateScreen';
import CompetitionsScreen from '../screens/CompetitionsScreen';
import InvoicesScreen     from '../screens/InvoicesScreen';
import FinancingScreen    from '../screens/FinancingScreen';
import ProfileScreen      from '../screens/ProfileScreen';
import AdminScreen        from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Custom Tab Bar
function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: C.bgCard,
      borderTopWidth: 1,
      borderTopColor: C.borderCard,
      paddingBottom: 10,
      paddingTop: 6,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? C.green : C.textMuted;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
            style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
            <View style={{
              alignItems:'center',
              paddingVertical:4,
              paddingHorizontal:12,
              borderRadius:12,
              backgroundColor: focused ? C.green+'18' : 'transparent',
            }}>
              <Text style={{ fontSize: focused ? 20 : 18 }}>
                {options.tabBarEmoji}
              </Text>
              <Text style={{
                fontSize:9, color, fontFamily:'Tajawal', marginTop:2,
                fontWeight: focused ? '800' : '500',
              }}>
                {options.tabBarLabel}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Stack options
const stackOpts = {
  headerStyle:      { backgroundColor: C.bgCard },
  headerTintColor:  C.textMain,
  headerTitleStyle: { fontFamily:'Tajawal', fontWeight:'700', fontSize:17, color:C.white },
  headerTitleAlign: 'center',
  contentStyle:     { backgroundColor: C.bgDeep },
  headerBackTitle:  'رجوع',
  headerShadowVisible: false,
};

// RFQ Stack
function RFQStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="RFQList"   component={RFQListScreen}   options={{ title:'الطلبات' }}/>
      <Stack.Screen name="RFQDetail" component={RFQDetailScreen} options={{ title:'تفاصيل الطلب' }}/>
      <Stack.Screen name="RFQCreate" component={RFQCreateScreen} options={{ title:'طلب شراء جديد' }}/>
    </Stack.Navigator>
  );
}

// Main Tabs
function MainTabs() {
  const { user } = useAuth();
  const role = user?.role || 'buyer';

  return (
    <Tab.Navigator tabBar={p => <MyTabBar {...p}/>} screenOptions={{ headerShown:false }}>

      <Tab.Screen name="DashboardTab" component={DashboardScreen}
        options={{ tabBarEmoji:'🏠', tabBarLabel:'الرئيسية' }}/>

      <Tab.Screen name="RFQsTab" component={RFQStack}
        options={{ tabBarEmoji:'📋', tabBarLabel:'الطلبات' }}/>

      {(role==='buyer'||role==='supplier'||role==='admin'||role==='owner') && (
        <Tab.Screen name="CompetitionsTab" component={CompetitionsScreen}
          options={{
            tabBarEmoji:'🏆', tabBarLabel:'المنافسات',
            headerShown:true, ...stackOpts, title:'المنافسات',
          }}/>
      )}

      {(role==='buyer'||role==='supplier'||role==='admin'||role==='owner') && (
        <Tab.Screen name="InvoicesTab" component={InvoicesScreen}
          options={{
            tabBarEmoji:'🧾', tabBarLabel:'الفواتير',
            headerShown:true, ...stackOpts, title:'الفواتير',
          }}/>
      )}

      {(role==='investor'||role==='admin'||role==='owner') && (
        <Tab.Screen name="FinancingTab" component={FinancingScreen}
          options={{
            tabBarEmoji:'💰', tabBarLabel:'التمويل',
            headerShown:true, ...stackOpts, title:'التمويل',
          }}/>
      )}

      {(role==='admin'||role==='owner') && (
        <Tab.Screen name="AdminTab" component={AdminScreen}
          options={{
            tabBarEmoji: role==='owner' ? '👑' : '🛡️',
            tabBarLabel: role==='owner' ? 'المالك' : 'الإدارة',
            headerShown:true, ...stackOpts,
            title: role==='owner' ? 'لوحة المالك' : 'لوحة الإدارة',
          }}/>
      )}

      <Tab.Screen name="ProfileTab" component={ProfileScreen}
        options={{
          tabBarEmoji:'👤', tabBarLabel:'حسابي',
          headerShown:true, ...stackOpts, title:'الملف الشخصي',
        }}/>
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen/>;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown:false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs}/>
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen}/>
            <Stack.Screen name="Register" component={RegisterScreen}
              options={{ headerShown:true, ...stackOpts, title:'إنشاء حساب جديد' }}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
