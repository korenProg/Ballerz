import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GameScoreboard from "./GameScoreboard";
import { T } from "../constants/theme";
import type { Game } from "../types/games";

// The full game card: solid surface (matches the leaderboard card) + faint
// football watermark + the GameScoreboard "full" content. Shared by the
// games list and the home screen.
export default function GameCard({ game }: { game: Game }) {
  return (
    <View style={styles.card}>
      <Ionicons
        name="football"
        size={200}
        color={T.textSecondary + "12"}
        style={styles.watermark}
      />
      <GameScoreboard game={game} size="full" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.surface,
    borderRadius: 18,
    padding: 14,
    overflow: "hidden",
  },
  watermark: { position: "absolute", top: -40, right: -45, transform: [{ rotate: "-15deg" }] },
});
