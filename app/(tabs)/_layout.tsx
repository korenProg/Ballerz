import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { T, FONT } from '../../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { filled: IconName; outline: IconName }> = {
  index: { filled: 'home', outline: 'home-outline' },
  games: { filled: 'football', outline: 'football-outline' },
  players: { filled: 'people', outline: 'people-outline' },
  league: { filled: 'trophy', outline: 'trophy-outline' },
};

const PILL_W = 54;
const PILL_H = 32;
const TAB_H = 34;

function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const slot = state.routes.length ? barWidth / state.routes.length : 0;

  const [translateX] = useState(() => new Animated.Value(0));
  const initialized = useRef(false);

  useEffect(() => {
    if (!slot) return;
    const target = state.index * slot + (slot - PILL_W) / 2;
    if (!initialized.current) {
      // Place the pill without animating on first layout so it doesn't fly in.
      translateX.setValue(target);
      initialized.current = true;
    } else {
      Animated.spring(translateX, {
        toValue: target,
        useNativeDriver: true,
        stiffness: 150,
        damping: 16,
        mass: 0.9,
      }).start();
    }
  }, [state.index, slot, translateX]);

  return (
    <View
      style={[
        styles.bar,
        { height: TAB_H + insets.bottom + 18, paddingBottom: insets.bottom + 6 },
      ]}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {barWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.pill, { transform: [{ translateX }] }]}
        />
      )}

      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const icons = TAB_ICONS[route.name];

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            hitSlop={8}
            accessibilityRole="tab"
            accessibilityLabel={descriptors[route.key].options.title ?? route.name}
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
          >
            <Ionicons
              name={focused ? icons.filled : icons.outline}
              size={24}
              color={focused ? T.accent : T.textFaint}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

// On iOS and Android the tabs are the platform's own native tab bar, so they
// match the system (Liquid Glass on iOS 26, Material on Android). Web has no
// native bar, so it keeps the custom FloatingTabBar above.
// The native bar floats over the screen, and iOS only auto-insets the first
// scroll view it finds (on Games that's the pill filters), so every tab sets
// contentInsetAdjustmentBehavior="automatic" on its main list itself.
export default function TabLayout() {
  if (Platform.OS === 'web') {
    return (
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="games" options={{ title: 'Games' }} />
        <Tabs.Screen name="players" options={{ title: 'Players' }} />
        <Tabs.Screen name="league" options={{ title: 'League' }} />
      </Tabs>
    );
  }

  return (
    <NativeTabs tintColor={T.accent} minimizeBehavior="onScrollDown" labelStyle={{ fontFamily: FONT }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="games">
        <NativeTabs.Trigger.Icon sf="soccerball" md="sports_soccer" />
        <NativeTabs.Trigger.Label>Games</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="players">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
        <NativeTabs.Trigger.Label>Players</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="league">
        <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} md="emoji_events" />
        <NativeTabs.Trigger.Label>League</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: T.bg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.divider,
  },
  tab: {
    flex: 1,
    height: TAB_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 12,
    width: PILL_W,
    height: PILL_H,
    borderRadius: 999,
    backgroundColor: T.surfaceAlt,
  },
});
