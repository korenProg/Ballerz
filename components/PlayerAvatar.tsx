import { Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { initials } from "../utils/initials";

// iOS Contacts' grey avatar gradient.
const FADE = ["#A0A0A6", "#6E6E74"] as const;

// A player's photo, or iOS Contacts-style initials on grey (a person glyph
// while there is no name yet).
export default function PlayerAvatar({
  name,
  photo,
  size,
}: {
  name: string;
  photo?: string | null;
  size: number;
}) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (photo) return <Image source={{ uri: photo }} style={round} />;
  const monogram = initials(name);
  return (
    <LinearGradient colors={FADE} style={[styles.fill, round]}>
      {monogram ? (
        <Text style={[styles.monogram, { fontSize: Math.round(size * 0.39) }]}>{monogram}</Text>
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.54)} color="#FFFFFF" />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  monogram: { fontWeight: "600", color: "#FFFFFF" },
});
