import type { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, TYPE, SPACE } from "../../constants/theme";

// Solid, left-aligned header. Inside a SafeAreaView pass safeTop={false}.
export default function ScreenHeader({
  title,
  subtitle,
  leading,
  action,
  safeTop = true,
}: {
  title?: string;
  subtitle?: string;
  leading?: ReactNode;
  action?: ReactNode;
  safeTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: (safeTop ? insets.top : 0) + SPACE.sm }]}>
      {leading ?? null}
      <View style={styles.titles}>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.md,
    backgroundColor: T.bg,
  },
  titles: { flex: 1, gap: 2 },
  title: TYPE.screenTitle,
  subtitle: TYPE.rowSecondary,
});
