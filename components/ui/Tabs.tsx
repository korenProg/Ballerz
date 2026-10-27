import { ScrollView, Pressable, StyleSheet } from "react-native";
import { Text } from "./Text";
import { T, SPACE, RADIUS } from "../../constants/theme";

// Pill filters. Inactive pills are surfaceAlt so they read both on the black
// page and inside a grey Section card; the active pill is the accent. The row
// scrolls sideways if the pills ever outgrow the screen.
export default function Tabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <ScrollView
      horizontal
      style={styles.scroller}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
      accessibilityRole="tablist"
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.key)}
            hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
            style={({ pressed }) => [
              styles.pill,
              active ? styles.pillActive : null,
              pressed && !active ? styles.pillPressed : null,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ScrollView defaults to flexGrow: 1, which would stretch the pill row to
  // fill half the screen and push the list below it down. Size to content.
  scroller: { flexGrow: 0, flexShrink: 0 },
  bar: {
    flexDirection: "row",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
  },
  pill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surfaceAlt,
  },
  pillActive: { backgroundColor: T.accent },
  pillPressed: { opacity: 0.7 },
  label: { fontSize: 13, fontWeight: "600", color: T.textDim },
  labelActive: { color: "#000" },
});
