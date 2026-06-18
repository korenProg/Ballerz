import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { useStore } from "../../store";
import { useGamesByStatus } from "../../store/selectors";
import GameScoreboard from "../../components/GameScoreboard";
import { T } from "../../constants/theme";
import type { Game } from "../../types/games";

function Section({
  title, games, onPress, onDelete,
}: { title: string; games: Game[]; onPress: (id: string) => void; onDelete: (g: Game) => void }) {
  if (!games.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {games.map((g) => (
        <Swipeable
          key={g.id}
          renderRightActions={() => (
            <TouchableOpacity style={styles.deleteAction} activeOpacity={0.8} onPress={() => onDelete(g)}>
              <Ionicons name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        >
          <TouchableOpacity style={styles.rowCard} activeOpacity={0.85} onPress={() => onPress(g.id)}>
            <GameScoreboard game={g} size="row" />
          </TouchableOpacity>
        </Swipeable>
      ))}
    </View>
  );
}

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const total = useStore((s) => s.games.length);
  const deleteGame = useStore((s) => s.deleteGame);
  const { live, upcoming, results } = useGamesByStatus();

  const openGame = (id: string) => router.push(`/game/${id}` as const);
  const confirmDelete = (g: Game) =>
    Alert.alert("Delete game?", `${g.homeTeam} vs ${g.awayTeam}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGame(g.id) },
    ]);

  return (
    <View style={styles.main}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Games</Text>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => router.push("/create-game")}>
          <Ionicons name="add" size={24} color={T.bg} />
        </TouchableOpacity>
      </View>

      {total === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="football" size={26} color={T.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No games yet</Text>
          <Text style={styles.emptySub}>Create your first game to get the season going</Text>
          <TouchableOpacity style={styles.emptyBtn} activeOpacity={0.8} onPress={() => router.push("/create-game")}>
            <Text style={styles.emptyBtnTxt}>Create Game</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Section title="LIVE" games={live} onPress={openGame} onDelete={confirmDelete} />
          <Section title="UPCOMING" games={upcoming} onPress={openGame} onDelete={confirmDelete} />
          <Section title="RESULTS" games={results} onPress={openGame} onDelete={confirmDelete} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  headerBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14,
  },
  title: { fontSize: 28, fontWeight: "900", color: T.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.textPrimary, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  section: { marginTop: 18, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  rowCard: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: T.textPrimary },
  emptySub: { fontSize: 13, color: T.textSecondary, textAlign: "center" },
  emptyBtn: { marginTop: 10, backgroundColor: T.textPrimary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  emptyBtnTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
  deleteAction: { backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center", width: 72, borderRadius: 16, marginLeft: 10 },
});
