import { View, Text, StyleSheet } from "react-native";
import Crest from "./Crest";
import { T, SPACE } from "../constants/theme";
import { shortDate } from "../utils/game";
import type { Game } from "../types/games";

export const MATCH_ROW_H = 60;

// Compact match row: status | home  crest  score  crest  away.
// No background — the list it sits in provides the card.
export default function GameCard({ game }: { game: Game }) {
  const pending = game.status === "Pending";
  const live = game.status === "Live";
  const center = pending ? shortDate(game.date) : `${game.homeScore} - ${game.awayScore}`;
  const status = game.status === "FT" ? "FT" : live ? "Live" : "";
  return (
    <View style={styles.row}>
      <Text style={[styles.status, live ? styles.live : null]}>{status}</Text>
      <Text style={[styles.team, styles.home]} numberOfLines={1}>
        {game.homeTeam}
      </Text>
      <Crest name={game.homeTeam} color={game.homeColor} logo={game.homeLogo} size={22} />
      <Text
        style={[styles.center, pending ? styles.centerDate : null, live ? styles.live : null]}
        numberOfLines={1}
      >
        {center}
      </Text>
      <Crest name={game.awayTeam} color={game.awayColor} logo={game.awayLogo} size={22} />
      <Text style={styles.team} numberOfLines={1}>
        {game.awayTeam}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: MATCH_ROW_H,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
  },
  status: { width: 30, fontSize: 12, fontWeight: "500", color: T.textFaint },
  live: { color: T.accent },
  team: { flex: 1, fontSize: 14, fontWeight: "600", color: T.text },
  home: { textAlign: "right" },
  center: {
    width: 64,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
  centerDate: { fontSize: 13, fontWeight: "500", color: T.textDim },
});
