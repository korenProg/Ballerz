import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { T } from "../../constants/theme";

// FotMob-style result chip: green win, grey draw, red loss.
export default function ResultChip({ result }: { result: "W" | "D" | "L" }) {
  return (
    <View style={[styles.chip, result === "W" ? styles.w : result === "L" ? styles.l : styles.d]}>
      <Text style={[styles.txt, result === "D" ? styles.txtD : result === "L" ? styles.txtL : null]}>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  w: { backgroundColor: T.accent },
  d: { backgroundColor: T.surfaceAlt },
  l: { backgroundColor: T.red },
  txt: { fontSize: 13, fontWeight: "700", color: "#000" },
  txtD: { color: T.textDim },
  txtL: { color: "#FFFFFF" },
});
