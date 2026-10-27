import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '@/store';
import { T } from '@/constants/theme';
import AnimatedSplash from '@/components/AnimatedSplash';

// Keep the static native splash up until AnimatedSplash has drawn its first
// (identical) frame, so the hand-off is invisible.
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Covers hydration finishing between the initial render and this subscription.
    if (useStore.persist.hasHydrated()) queueMicrotask(() => setHydrated(true));
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  // The app mounts underneath as soon as data is hydrated; the splash stays on
  // top for at least 2s (longer if hydration is slow) and then fades to reveal it.
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {hydrated ? <AppStack colorScheme={colorScheme} /> : null}
      {splashDone ? null : (
        <AnimatedSplash ready={hydrated} onDone={() => setSplashDone(true)} />
      )}
    </View>
  );
}

function AppStack({ colorScheme }: { colorScheme: ReturnType<typeof useColorScheme> }) {
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
