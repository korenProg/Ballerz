import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Crest from "./Crest";
import { T, TYPE, SPACE } from "../constants/theme";
import { shortDate } from "../utils/game";
import type { Game } from "../types/games";

const STATUS_LABEL = { FT: "Full time", Live: "Live", Pending: "Upcoming" } as const;

function Side({ name, color, logo }: { name: string; color: string; logo?: string }) {
  return (
    <View style={styles.side}>
      <Crest name={name} color={color} logo={logo} size={52} />
      <Text style={styles.team} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

// Card-less match header: crests either side, big tabular score, status under it.
export default function GameScoreboard({ game }: { game: Game }) {
  const pending = game.status === "Pending";
  const live = game.status === "Live";
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Side name={game.homeTeam} color={game.homeColor} logo={game.homeLogo} />
        <View style={styles.center}>
          <Text style={pending ? styles.date : styles.score} numberOfLines={1}>
            {pending ? shortDate(game.date) : `${game.homeScore} - ${game.awayScore}`}
          </Text>
          <Text style={[styles.status, live ? styles.live : null]}>{STATUS_LABEL[game.status]}</Text>
        </View>
        <Side name={game.awayTeam} color={game.awayColor} logo={game.awayLogo} />
      </View>
      {game.status === "FT" && game.mvp?.name ? (
        <View style={styles.mvp}>
          <Ionicons name="star" size={13} color={T.yellow} />
          <Text style={styles.mvpTxt} numberOfLines={1}>
            {game.mvp.name}
            {game.mvp.stat ? ` · ${game.mvp.stat}` : ""}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.md, paddingVertical: SPACE.lg },
  row: { flexDirection: "row", alignItems: "flex-start" },
  side: { flex: 1, alignItems: "center", gap: SPACE.sm },
  team: { fontSize: 15, fontWeight: "600", color: T.text, textAlign: "center" },
  center: { width: 120, alignItems: "center", paddingTop: 4, gap: 4 },
  score: TYPE.score,
  date: { fontSize: 24, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"], paddingTop: 8 },
  status: { fontSize: 13, fontWeight: "500", color: T.textDim },
  live: { color: T.accent },
  mvp: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  mvpTxt: { fontSize: 13, fontWeight: "400", color: T.textDim, flexShrink: 1 },
});
