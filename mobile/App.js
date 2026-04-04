import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { C } from './src/theme/colors';

// Prevent splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          'Tajawal':         require('./assets/fonts/Tajawal-Regular.ttf'),
          'Tajawal-Bold':    require('./assets/fonts/Tajawal-Bold.ttf'),
          'Tajawal-Medium':  require('./assets/fonts/Tajawal-Medium.ttf'),
        });
      } catch (e) {
        // fonts fallback — app still works
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (!ready) return null;

  return (
    <AuthProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.bgDeep}
        translucent={Platform.OS === 'android'}
      />
      <AppNavigator />
    </AuthProvider>
  );
}
