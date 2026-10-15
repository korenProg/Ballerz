import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '@/store';
import { T } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());

  useEffect(() => {
    // Covers hydration finishing between the initial render and this subscription.
    if (useStore.persist.hasHydrated()) queueMicrotask(() => setHydrated(true));
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: T.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="create-player"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="create-game"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="record-result"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="game/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="player/[id]"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
