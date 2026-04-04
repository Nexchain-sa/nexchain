import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { C, roleColors } from '../theme/colors';
import { LoadingScreen } from '../components';

// Screens
import LoginScreen       from '../screens/LoginScreen';
import RegisterScreen    from '../screens/RegisterScreen';
import DashboardScreen   from '../screens/DashboardScreen';
import RFQListScreen     from '../screens/RFQListScreen';
import RFQDetailScreen   from '../screens/RFQDetailScreen';
import RFQCreateScreen   from '../screens/RFQCreateScreen';
import CompetitionsScreen from '../screens/CompetitionsScreen';
import InvoicesScreen    from '../screens/InvoicesScreen';
import FinancingScreen   from '../screens/FinancingScreen';
import ProfileScreen     from '../screens/ProfileScreen';
import AdminScreen       from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Tab icon helper
function TabIcon({ emoji, label, focused, color }) {
  return (
    <View style={{ alignItems:'center', paddingTop:4 }}>
      <Text style={{ fontSize: focused ? 22 : 18 }}>{emoji}</Text>
      <Text style={{
        fontSize:9, color, fontFamily:'Tajawal', marginTop:2,
        fontWeight: focused ? '700' : '400',
      }}>{label}</Text>
    </View>
  );
}

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

// Main Tabs (by role)
function MainTabs() {
  const { user } = useAuth();
  const role = user?.role || 'buyer';
  const rc   = roleColors[role] || C.violet;

  const tabBar = ({ state, descriptors, navigation }) => (
    <View style={{
      flexDirection:'row',
      backgroundColor: C.bgCard,
      borderTopWidth:1,
      borderTopColor: C.borderCard,
      paddingBottom: 8,
      paddingTop: 4,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex:1, alignItems:'center' }}>
            {options.tabBarIcon?.({ focused, color: focused ? rc : C.textMuted })}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Tab.Navigator tabBar={tabBar} screenOptions={{ headerShown:false }}>
      <Tab.Screen name="DashboardTab" component={DashboardScreen}
        options={{
          tabBarIcon: (p) => <TabIcon emoji="🏠" label="الرئيسية" {...p}/>,
        }}/>

      <Tab.Screen name="RFQsTab" component={RFQStack}
        options={{
          tabBarIcon: (p) => <TabIcon emoji="📋" label="الطلبات" {...p}/>,
        }}/>

      {(role==='buyer'||role==='supplier'||role==='admin'||role==='owner') && (
        <Tab.Screen name="CompetitionsTab" component={CompetitionsScreen}
          options={{
            tabBarIcon: (p) => <TabIcon emoji="🏆" label="المنافسات" {...p}/>,
            headerShown:true, ...stackOpts, title:'المنافسات',
          }}/>
      )}

      {(role==='buyer'||role==='supplier'||role==='admin'||role==='owner') && (
        <Tab.Screen name="InvoicesTab" component={InvoicesScreen}
          options={{
            tabBarIcon: (p) => <TabIcon emoji="🧾" label="الفواتير" {...p}/>,
            headerShown:true, ...stackOpts, title:'الفواتير',
          }}/>
      )}

      {(role==='investor'||role==='admin'||role==='owner') && (
        <Tab.Screen name="FinancingTab" component={FinancingScreen}
          options={{
            tabBarIcon: (p) => <TabIcon emoji="💰" label="التمويل" {...p}/>,
            headerShown:true, ...stackOpts, title:'التمويل',
          }}/>
      )}

      {(role==='admin'||role==='owner') && (
        <Tab.Screen name="AdminTab" component={AdminScreen}
          options={{
            tabBarIcon: (p) => <TabIcon emoji={role==='owner'?'👑':'🛡️'} label="الإدارة" {...p}/>,
            headerShown:true, ...stackOpts, title: role==='owner' ? 'لوحة المالك' : 'الإدارة',
          }}/>
      )}

      <Tab.Screen name="ProfileTab" component={ProfileScreen}
        options={{
          tabBarIcon: (p) => <TabIcon emoji="👤" label="حسابي" {...p}/>,
          headerShown:true, ...stackOpts, title:'الملف الشخصي',
        }}/>
    </Tab.Navigator>
  );
}

// Main Navigator
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
              options={{ ...stackOpts, headerShown:true, title:'إنشاء حساب' }}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Shared header options
const stackOpts = {
  headerStyle:       { backgroundColor: C.bgCard },
  headerTintColor:   C.textMain,
  headerTitleStyle:  { fontFamily:'Tajawal', fontWeight:'700', fontSize:17 },
  headerTitleAlign:  'center',
  headerBackTitle:   'رجوع',
  contentStyle:      { backgroundColor: C.bgDeep },
};
