import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { T, SPACE } from "../../constants/theme";

function Value({ v, color }: { v: number; color: string | null }) {
  return (
    <View style={[styles.value, color ? { backgroundColor: color } : null]}>
      <Text style={[styles.valueTxt, color ? styles.valueTxtOn : null]}>{v}</Text>
    </View>
  );
}

// Left value · label · right value. The higher side sits in its team colour;
// a tie highlights neither.
export default function StatCompare({
  label,
  home,
  away,
  homeColor,
  awayColor,
}: {
  label: string;
  home: number;
  away: number;
  homeColor: string;
  awayColor: string;
}) {
  return (
    <View style={styles.row}>
      <Value v={home} color={home > away ? homeColor : null} />
      <Text style={styles.label}>{label}</Text>
      <Value v={away} color={away > home ? awayColor : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: SPACE.sm },
  label: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "500", color: T.textDim },
  value: {
    minWidth: 36,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  valueTxt: { fontSize: 15, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  valueTxtOn: { color: "#fff" },
});
