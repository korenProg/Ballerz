import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import GameScoreboard from "./GameScoreboard";
import { T } from "../constants/theme";
import type { Game } from "../types/games";

// The full game card: navy gradient surface + faint football watermark +
// the GameScoreboard "full" content. Shared by the games list and home.
export default function GameCard({ game }: { game: Game }) {
  return (
    <LinearGradient
      colors={[T.border, T.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <Ionicons
        name="football"
        size={200}
        color={T.textSecondary + "12"}
        style={styles.watermark}
      />
      <GameScoreboard game={game} size="full" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
  },
  watermark: { position: "absolute", top: -20, right: -30, transform: [{ rotate: "-15deg" }] },
});
