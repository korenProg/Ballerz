import type { ReactNode } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "./Text";
import { T, TYPE, SPACE } from "../../constants/theme";

export const ROW_H = 64;

export default function ListRow({
  leading,
  title,
  badge,
  subtitle,
  trailing,
  onPress,
  divider = false,
}: {
  leading?: ReactNode;
  title: string;
  badge?: ReactNode;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  const body = (
    <>
      {leading ?? null}
      <View style={styles.text}>
        <View style={styles.titleLine}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge ?? null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? null}
      {divider ? <View style={styles.divider} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_H,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  pressed: { backgroundColor: T.surfaceAlt },
  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  title: { ...TYPE.rowPrimary, flexShrink: 1 },
  subtitle: TYPE.rowSecondary,
  divider: {
    position: "absolute",
    left: SPACE.lg,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.divider,
  },
});
