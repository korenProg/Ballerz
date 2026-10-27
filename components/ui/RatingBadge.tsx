import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { RADIUS } from "../../constants/theme";
import { ratingColor } from "../../utils/rating";

// Band-coloured number. Pass `color` to override the band (e.g. a #1 count).
export default function RatingBadge({
  value,
  color,
  size = "md",
}: {
  value: number;
  color?: string;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <View style={[styles.badge, lg ? styles.lg : null, { backgroundColor: color ?? ratingColor(value) }]}>
      <Text style={[styles.txt, lg ? styles.txtLg : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 36,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: RADIUS.badge,
    alignItems: "center",
    justifyContent: "center",
  },
  lg: { minWidth: 54, height: 40, borderRadius: 10 },
  txt: { fontSize: 14, fontWeight: "700", color: "#000", fontVariant: ["tabular-nums"] },
  txtLg: { fontSize: 22 },
});
