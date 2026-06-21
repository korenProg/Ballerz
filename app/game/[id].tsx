import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import GameScoreboard from "../../components/GameScoreboard";
import { T } from "../../constants/theme";
import type { GamePlayer } from "../../types/games";

function Lineup({ title, players, color }: { title: string; players?: GamePlayer[]; color: string }) {
  if (!players || players.length === 0) return null;
  return (
    <View style={styles.lineupCol}>
      <View style={[styles.lineupDot, { backgroundColor: color }]} />
      <Text style={styles.lineupTitle}>{title}</Text>
      {players.map((p) => (
        <Text key={p.id} style={styles.lineupName} numberOfLines={1}>{p.name}</Text>
      ))}
    </View>
  );
}

export default function GameDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useStore((s) => s.games.find((g) => g.id === id) ?? null);
  const updateGame = useStore((s) => s.updateGame);

  if (!game) {
    return (
      <SafeAreaView style={styles.main}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTxt}>Game not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnTxt}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}><Ionicons name="chevron-back" size={26} color={T.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{game.location || "Match"}</Text>
        <TouchableOpacity onPress={() => router.push(`/create-game?id=${game.id}` as const)} hitSlop={8}><Ionicons name="create-outline" size={22} color={T.textPrimary} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {game.date ? <Text style={styles.dateTxt}>{game.date}</Text> : null}
        <View style={styles.board}><GameScoreboard game={game} size="full" /></View>

        <View style={styles.lineups}>
          <Lineup title={game.homeTeam} players={game.homePlayers} color={game.homeColor} />
          <Lineup title={game.awayTeam} players={game.awayPlayers} color={game.awayColor} />
        </View>

        {game.status === "FT" && game.mvp?.name ? (
          <View style={styles.mvpCard}>
            <Ionicons name="star" size={18} color="#ca8a04" />
            <View>
              <Text style={styles.mvpLabel}>MVP</Text>
              <Text style={styles.mvpName}>{game.mvp.name}{game.mvp.stat ? ` · ${game.mvp.stat}` : ""}</Text>
            </View>
          </View>
        ) : null}

        {game.status === "Pending" && (
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => updateGame(game.id, { status: "Live" })}>
            <Ionicons name="play" size={18} color={T.bg} />
            <Text style={styles.primaryBtnTxt}>Start Game</Text>
          </TouchableOpacity>
        )}

        {game.status === "Live" && (
          <>
            <View style={styles.liveControls}>
              <View style={styles.liveTeam}>
                <Text style={styles.liveTeamName} numberOfLines={1}>{game.homeTeam}</Text>
                <View style={styles.liveBtns}>
                  <TouchableOpacity style={styles.liveBtn} onPress={() => updateGame(game.id, { homeScore: Math.max(0, game.homeScore - 1) })}><Ionicons name="remove" size={20} color={T.textPrimary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.liveBtn} onPress={() => updateGame(game.id, { homeScore: game.homeScore + 1 })}><Ionicons name="add" size={20} color={T.textPrimary} /></TouchableOpacity>
                </View>
              </View>
              <View style={styles.liveTeam}>
                <Text style={styles.liveTeamName} numberOfLines={1}>{game.awayTeam}</Text>
                <View style={styles.liveBtns}>
                  <TouchableOpacity style={styles.liveBtn} onPress={() => updateGame(game.id, { awayScore: Math.max(0, game.awayScore - 1) })}><Ionicons name="remove" size={20} color={T.textPrimary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.liveBtn} onPress={() => updateGame(game.id, { awayScore: game.awayScore + 1 })}><Ionicons name="add" size={20} color={T.textPrimary} /></TouchableOpacity>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => router.push(`/record-result?id=${game.id}` as const)}>
              <Ionicons name="flag" size={18} color={T.bg} />
              <Text style={styles.primaryBtnTxt}>Finish</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: T.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 32, alignItems: "stretch" },
  dateTxt: { fontSize: 12, color: T.textSecondary, textAlign: "center", marginBottom: 12 },
  board: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 20, padding: 14, overflow: "hidden" },
  lineups: { flexDirection: "row", gap: 12, marginTop: 16 },
  lineupCol: { flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 14, gap: 4 },
  lineupDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  lineupTitle: { fontSize: 13, fontWeight: "800", color: T.textPrimary, marginBottom: 4 },
  lineupName: { fontSize: 13, color: T.textSecondary },
  primaryBtn: { flexDirection: "row", gap: 8, backgroundColor: T.textPrimary, paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 20 },
  primaryBtnTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTxt: { fontSize: 16, fontWeight: "700", color: T.textSecondary },
  backBtn: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  backBtnTxt: { color: T.textPrimary, fontWeight: "700" },
  liveControls: { flexDirection: "row", gap: 12, marginTop: 16 },
  liveTeam: { flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 14, gap: 10, alignItems: "center" },
  liveTeamName: { fontSize: 13, fontWeight: "800", color: T.textPrimary },
  liveBtns: { flexDirection: "row", gap: 10 },
  liveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.border, alignItems: "center", justifyContent: "center" },
  mvpCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, marginTop: 16 },
  mvpLabel: { fontSize: 10, fontWeight: "800", color: T.textSecondary, letterSpacing: 1 },
  mvpName: { fontSize: 15, fontWeight: "800", color: T.textPrimary },
});
