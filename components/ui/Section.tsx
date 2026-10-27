import type { ReactNode } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "./Text";
import { T, TYPE, SPACE, RADIUS } from "../../constants/theme";

// Borderless grey card. `padded` insets the children; leave it off for
// ListRows, which carry their own padding and dividers.
export default function Section({
  title,
  footer,
  onFooterPress,
  padded = false,
  children,
}: {
  title?: string;
  footer?: string;
  onFooterPress?: () => void;
  padded?: boolean;
  children: ReactNode;
}) {
  const bodyStyle = padded ? (title ? styles.paddedUnderTitle : styles.padded) : null;
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={bodyStyle}>{children}</View>
      {footer && onFooterPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onFooterPress}
          style={({ pressed }) => [styles.footer, pressed ? styles.pressed : null]}
        >
          <Text style={styles.footerTxt}>{footer}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: T.surface, borderRadius: RADIUS.card, overflow: "hidden" },
  title: { ...TYPE.sectionTitle, paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm },
  padded: { padding: SPACE.lg },
  paddedUnderTitle: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.xs, paddingBottom: SPACE.lg },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.divider,
    paddingVertical: SPACE.md + 2,
    alignItems: "center",
  },
  footerTxt: { fontSize: 14, fontWeight: "600", color: T.text },
  pressed: { backgroundColor: T.surfaceAlt },
});
