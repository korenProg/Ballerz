import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../constants/theme";
import { teamInitials } from "../utils/game";
import type { Game } from "../types/games";

function Crest({ name, color, logo, size }: { name: string; color: string; logo?: string; size: number }) {
  if (logo) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.badgeTxt, { fontSize: size * 0.34 }]}>{teamInitials(name)}</Text>
    </View>
  );
}

export default function GameScoreboard({ game, size = "row" }: { game: Game; size?: "row" | "full" }) {
  const full = size === "full";
  const crestSize = full ? 76 : 42;
  const header = [game.league, game.location].filter(Boolean).join(" - ");

  return (
    <View style={styles.wrap}>
      {full && (
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Ionicons name="location-outline" size={13} color={T.textSecondary} />
            <Text style={styles.headerTxt} numberOfLines={1}>{header || "Match"}</Text>
          </View>
          {game.date ? (
            <View style={styles.headerSide}>
              <Ionicons name="calendar-outline" size={13} color={T.textSecondary} />
              <Text style={styles.headerTxt}>{game.date}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={[styles.row, full && styles.rowFull]}>
        <View style={styles.teamCol}>
          <Crest name={game.homeTeam} color={game.homeColor} logo={game.homeLogo} size={crestSize} />
          <Text style={[styles.teamName, full && styles.teamNameFull]} numberOfLines={2}>{game.homeTeam}</Text>
        </View>

        <View style={styles.centerCol}>
          {game.status === "Pending" ? (
            <Text style={full ? styles.vsFull : styles.vs}>vs</Text>
          ) : (
            <Text style={full ? styles.scoreFull : styles.score}>{game.homeScore} : {game.awayScore}</Text>
          )}
          <View style={styles.pill}>
            {game.status === "Live" ? (
              <><View style={styles.liveDot} /><Text style={styles.pillTxt}>LIVE</Text></>
            ) : (
              <Text style={styles.pillTxt}>{game.status === "FT" ? "FT" : "SOON"}</Text>
            )}
          </View>
        </View>

        <View style={styles.teamCol}>
          <Crest name={game.awayTeam} color={game.awayColor} logo={game.awayLogo} size={crestSize} />
          <Text style={[styles.teamName, full && styles.teamNameFull]} numberOfLines={2}>{game.awayTeam}</Text>
        </View>
      </View>

      {full && game.mvp?.name ? (
        <View style={styles.mvpRow}>
          <Ionicons name="star" size={16} color="#f5c518" />
          <Text style={styles.mvpName}>{game.mvp.name}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerSide: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
  headerTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  rowFull: { paddingHorizontal: 4 },
  teamCol: { flex: 1, alignItems: "center", gap: 10 },
  centerCol: { alignItems: "center", gap: 8, paddingHorizontal: 8 },
  badge: { alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontWeight: "900", color: "#fff" },
  teamName: { fontSize: 13, fontWeight: "700", color: T.textPrimary, textAlign: "center", maxWidth: 110 },
  teamNameFull: { fontSize: 15, fontWeight: "800" },
  score: { fontSize: 22, fontWeight: "900", color: T.textPrimary },
  scoreFull: { fontSize: 46, fontWeight: "900", color: T.textPrimary, letterSpacing: 2 },
  vs: { fontSize: 16, fontWeight: "800", color: T.textSecondary },
  vsFull: { fontSize: 30, fontWeight: "900", color: T.textSecondary },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.border, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillTxt: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
  mvpRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mvpName: { fontSize: 14, fontWeight: "800", color: T.textSecondary },
});
