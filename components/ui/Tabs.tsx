import { View, Text, Pressable, StyleSheet } from "react-native";
import { T, SPACE } from "../../constants/theme";

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
    <View style={styles.bar} accessibilityRole="tablist">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.key)}
            style={styles.tab}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{t.label}</Text>
            <View style={[styles.indicator, active ? styles.indicatorActive : null]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: SPACE.xl,
    paddingHorizontal: SPACE.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.divider,
  },
  tab: { paddingTop: SPACE.sm },
  label: { fontSize: 14, fontWeight: "600", color: T.textFaint, paddingBottom: SPACE.sm + 2 },
  labelActive: { color: T.text },
  indicator: { height: 2, borderRadius: 1 },
  indicatorActive: { backgroundColor: T.accent },
});
