import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "../constants/theme";

type Props = {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function TopBar({ title, left, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingTop: insets.top + 12 }]}>
      <View style={s.side}>{left ?? null}</View>
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      <View style={s.side}>{right ?? null}</View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 100,
  },
  side: {
    minWidth: 40,
    alignItems: "center",
  },
  title: {
    color: T.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
});
