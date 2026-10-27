import type { ReactNode } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "./Text";
import { T, TYPE, SPACE, RADIUS } from "../../constants/theme";

// Borderless grey card. `padded` insets the children; leave it off for
// ListRows, which carry their own padding and dividers. `divider` draws a
// hairline between the title and the content.
export default function Section({
  title,
  footer,
  onFooterPress,
  padded = false,
  divider = false,
  children,
}: {
  title?: string;
  footer?: string;
  onFooterPress?: () => void;
  padded?: boolean;
  divider?: boolean;
  children: ReactNode;
}) {
  const lined = divider && !!title;
  // Below a divider the content gets full padding, as at the top of a card.
  const bodyStyle = padded ? (title && !lined ? styles.paddedUnderTitle : styles.padded) : null;
  return (
    <View style={styles.card}>
      {title ? <Text style={[styles.title, lined ? styles.titleLined : null]}>{title}</Text> : null}
      {lined ? <View style={styles.divider} /> : null}
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
  titleLined: { paddingBottom: SPACE.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: T.divider },
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
