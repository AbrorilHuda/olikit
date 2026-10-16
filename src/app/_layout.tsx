import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { FloatingTabBar } from '@/components/ui/floating-tab-bar';
import { OilProvider } from '@/context/oil-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <OilProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Tabs
          tabBar={(props) => <FloatingTabBar {...(props as any)} />}
          screenOptions={{
            headerShown: false,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Beranda',
            }}
          />
          <Tabs.Screen
            name="catat"
            options={{
              title: 'Catat',
            }}
          />
          <Tabs.Screen
            name="riwayat"
            options={{
              title: 'Riwayat',
            }}
          />
        </Tabs>
      </OilProvider>
    </ThemeProvider>
  );
}
