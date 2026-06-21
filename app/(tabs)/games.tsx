import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import { useStore } from "../../store";
import { useGamesByStatus } from "../../store/selectors";
import GameCard from "../../components/GameCard";
import { T } from "../../constants/theme";
import type { Game } from "../../types/games";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "FT", label: "FT" },
  { key: "Live", label: "Live" },
  { key: "Pending", label: "UpComing" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function GameRow({
  game, onPress, onDelete,
}: { game: Game; onPress: (id: string) => void; onDelete: (g: Game) => void }) {
  return (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity style={styles.deleteAction} activeOpacity={0.8} onPress={() => onDelete(game)}>
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(game.id)}>
        <GameCard game={game} />
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const total = useStore((s) => s.games.length);
  const deleteGame = useStore((s) => s.deleteGame);
  const { live, upcoming, results } = useGamesByStatus();
  const [filter, setFilter] = useState<FilterKey>("all");

  const openGame = (id: string) => router.push(`/game/${id}` as const);
  const confirmDelete = (g: Game) =>
    Alert.alert("Delete game?", `${g.homeTeam} vs ${g.awayTeam}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGame(g.id) },
    ]);

  const games =
    filter === "FT" ? results
    : filter === "Live" ? live
    : filter === "Pending" ? upcoming
    : [...live, ...upcoming, ...results];

  return (
    <View style={styles.main}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerSpacer} />
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
        <>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.pill, active && styles.pillActive]}
                  activeOpacity={0.8}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={[styles.pillTxt, active && styles.pillTxtActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {games.length === 0 ? (
              <Text style={styles.noneTxt}>No games here yet</Text>
            ) : (
              games.map((g) => (
                <GameRow key={g.id} game={g} onPress={openGame} onDelete={confirmDelete} />
              ))
            )}
          </ScrollView>
        </>
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
  headerSpacer: { width: 40 },
  title: { fontSize: 24, fontWeight: "900", color: T.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.textPrimary, alignItems: "center", justifyContent: "center" },

  filterRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  pill: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
  },
  pillActive: { backgroundColor: T.textPrimary, borderColor: T.textPrimary },
  pillTxt: { fontSize: 13, fontWeight: "800", color: T.textSecondary },
  pillTxtActive: { color: T.bg },

  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  deleteAction: { backgroundColor: "#ef4444", justifyContent: "center", alignItems: "center", width: 72, borderRadius: 20, marginLeft: 10 },
  noneTxt: { fontSize: 13, color: T.textSecondary, textAlign: "center", marginTop: 40 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: T.textPrimary },
  emptySub: { fontSize: 13, color: T.textSecondary, textAlign: "center" },
  emptyBtn: { marginTop: 10, backgroundColor: T.textPrimary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  emptyBtnTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
});
