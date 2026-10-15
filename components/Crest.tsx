import { View, Text, Image, StyleSheet } from "react-native";
import { teamInitials } from "../utils/game";
import { T } from "../constants/theme";

// Team crest (team colour) or player avatar (neutral grey). Shows the image
// when one exists.
export default function Crest({
  name,
  color,
  logo,
  size,
  variant = "team",
}: {
  name: string;
  color?: string;
  logo?: string;
  size: number;
  variant?: "team" | "avatar";
}) {
  const avatar = variant === "avatar";
  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode={avatar ? "cover" : "contain"}
      />
    );
  }
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatar ? T.surfaceAlt : color ?? T.surfaceAlt,
        },
      ]}
    >
      <Text style={[styles.txt, { fontSize: size * 0.36, color: avatar ? T.textDim : "#fff" }]}>
        {teamInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
  txt: { fontWeight: "700" },
});
