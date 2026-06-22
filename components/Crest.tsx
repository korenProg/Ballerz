import { View, Text, Image, StyleSheet } from "react-native";
import { teamInitials } from "../utils/game";

export default function Crest({
  name, color, logo, size,
}: { name: string; color: string; logo?: string; size: number }) {
  if (logo) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.badgeTxt, { fontSize: size * 0.34 }]}>{teamInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontWeight: "900", color: "#fff" },
});
