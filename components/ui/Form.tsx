import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { SPACE, SHEET } from "../../constants/theme";

export const FORM_ROW_H = 50;

// iOS inset-grouped section: optional uppercase header, rounded cells, and
// an optional grey footnote underneath.
export function FormSection({ header, footer, children }: { header?: string; footer?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {header ? <Text style={styles.sectionHeader}>{header.toUpperCase()}</Text> : null}
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.sectionFooter}>{footer}</Text> : null}
    </View>
  );
}

// One cell. Every cell but the last draws the hairline iOS insets under its label.
export function FormRow({ children, last = false, tall = false }: { children: ReactNode; last?: boolean; tall?: boolean }) {
  return (
    <View style={[styles.row, tall ? styles.rowTall : null]}>
      {children}
      {last ? null : <View style={styles.separator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACE.xxl },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "400",
    color: SHEET.label,
    marginBottom: 6,
    marginLeft: SPACE.lg,
  },
  sectionFooter: {
    fontSize: 13,
    fontWeight: "400",
    color: SHEET.label,
    marginTop: 6,
    marginHorizontal: SPACE.lg,
  },
  group: { backgroundColor: SHEET.cell, borderRadius: 16, overflow: "hidden" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
    minHeight: FORM_ROW_H,
    paddingHorizontal: SPACE.lg,
  },
  rowTall: { minHeight: 54 },
  separator: {
    position: "absolute",
    left: SPACE.lg,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: SHEET.separator,
  },
});
