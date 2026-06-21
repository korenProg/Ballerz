import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../constants/theme";
import { teamInitials } from "../utils/game";
import type { Game } from "../types/games";

function Divider() {
  return (
    <LinearGradient
      colors={[T.bg, T.textMuted, T.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.divider}
    />
  );
}

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
  const crestSize = full ? 60 : 42;
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
      {full && <Divider />}

      <View style={styles.middle}>
      {/* Top band: badges + score on one horizontal line */}
      <View style={styles.scoreRow}>
        <View style={styles.crestCol}>
          <Crest name={game.homeTeam} color={game.homeColor} logo={game.homeLogo} size={crestSize} />
        </View>
        {game.status === "Pending" ? (
          <Text style={full ? styles.vsFull : styles.vs}>vs</Text>
        ) : (
          <Text style={full ? styles.scoreFull : styles.score}>{game.homeScore} : {game.awayScore}</Text>
        )}
        <View style={styles.crestCol}>
          <Crest name={game.awayTeam} color={game.awayColor} logo={game.awayLogo} size={crestSize} />
        </View>
      </View>

      {/* Bottom band: team names + status pill on one horizontal line */}
      <View style={styles.namesRow}>
        <Text style={[styles.teamName, full && styles.teamNameFull]} numberOfLines={2}>{game.homeTeam}</Text>
        <View style={styles.pill}>
          {game.status === "Live" ? (
            <><View style={styles.liveDot} /><Text style={styles.pillTxt}>LIVE</Text></>
          ) : (
            <Text style={styles.pillTxt}>{game.status === "FT" ? "FT" : "SOON"}</Text>
          )}
        </View>
        <Text style={[styles.teamName, full && styles.teamNameFull]} numberOfLines={2}>{game.awayTeam}</Text>
      </View>
      </View>

      {full && game.mvp?.name ? (
        <View style={styles.mvpSection}>
          <Divider />
          <View style={styles.mvpRow}>
            <Ionicons name="star" size={13} color="#f5c518" />
            <Text style={styles.mvpName}>{game.mvp.name}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  middle: { gap: 10, paddingVertical: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerSide: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  headerTxt: { fontSize: 12, fontWeight: "700", color: T.textSecondary },
  divider: { height: 1, marginTop: -4, marginHorizontal: -14 },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  crestCol: { flex: 1, alignItems: "center" },
  namesRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, gap: 8 },
  badge: { alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontWeight: "900", color: "#fff" },
  teamName: { flex: 1, fontSize: 13, fontWeight: "700", color: T.textPrimary, textAlign: "center" },
  teamNameFull: { fontSize: 14, fontWeight: "800", color: "#fff" },
  score: { fontSize: 22, fontWeight: "900", color: T.textPrimary },
  scoreFull: { fontSize: 34, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  vs: { fontSize: 16, fontWeight: "800", color: T.textSecondary },
  vsFull: { fontSize: 24, fontWeight: "900", color: "#fff" },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.22)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pillTxt: { fontSize: 10, fontWeight: "800", color: "#c6ccd8", letterSpacing: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
  mvpSection: { gap: 4 },
  mvpRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mvpName: { fontSize: 12, fontWeight: "700", color: T.textSecondary },
});
