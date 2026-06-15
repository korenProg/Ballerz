import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { T } from '../../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { filled: IconName; outline: IconName }> = {
  index: { filled: 'home', outline: 'home-outline' },
  games: { filled: 'football', outline: 'football-outline' },
  players: { filled: 'people', outline: 'people-outline' },
  league: { filled: 'trophy', outline: 'trophy-outline' },
};

const PILL_W = 60;
const PILL_H = 40;
const TAB_H = 44;

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const slot = state.routes.length ? barWidth / state.routes.length : 0;

  const translateX = useRef(new Animated.Value(0)).current;
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
        { height: TAB_H + 6 + insets.bottom + 6, paddingBottom: insets.bottom + 6 },
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
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
          >
            <Ionicons
              name={focused ? icons.filled : icons.outline}
              size={26}
              color={focused ? T.textPrimary : T.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
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

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: T.bg,
    paddingTop: 6,
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
    top: 8,
    width: PILL_W,
    height: PILL_H,
    borderRadius: 999,
    backgroundColor: T.border,
  },
});
