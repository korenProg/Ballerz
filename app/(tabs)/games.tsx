import { useState, type ComponentProps } from "react";
import { View, Text, SectionList, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useStore } from "../../store";
import { useGamesByStatus } from "../../store/selectors";
import GameCard from "../../components/GameCard";
import ScreenHeader from "../../components/ui/ScreenHeader";
import Tabs from "../../components/ui/Tabs";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { T, SPACE, RADIUS } from "../../constants/theme";
import type { Game } from "../../types/games";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "FT", label: "Results" },
  { key: "Pending", label: "Upcoming" },
  { key: "Live", label: "Live" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

type IoniconName = ComponentProps<typeof Ionicons>["name"];
const EMPTY_FILTER: Record<FilterKey, { icon: IoniconName; title: string; sub: string }> = {
  all: { icon: "football-outline", title: "No games yet", sub: "Create a game to get the season going" },
  FT: { icon: "checkmark-done-outline", title: "No results yet", sub: "Finished games will show up here" },
  Live: { icon: "radio-outline", title: "No live games", sub: "Start a game to follow it live" },
  Pending: { icon: "calendar-outline", title: "No upcoming games", sub: "Scheduled games will appear here" },
};

type GameSection = { title: string; data: Game[] };

function GameRow({
  game,
  first,
  last,
  onPress,
  onDelete,
}: {
  game: Game;
  first: boolean;
  last: boolean;
  onPress: (id: string) => void;
  onDelete: (g: Game) => void;
}) {
  return (
    <View style={[styles.cell, first ? styles.cellFirst : null, last ? styles.cellLast : null]}>
      <Swipeable
        renderRightActions={() => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete game"
            style={styles.deleteAction}
            onPress={() => onDelete(game)}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </Pressable>
        )}
      >
        <Pressable
          onPress={() => onPress(game.id)}
          style={({ pressed }) => [styles.rowBg, pressed ? styles.rowPressed : null]}
        >
          <GameCard game={game} />
        </Pressable>
      </Swipeable>
      {last ? null : <View style={styles.divider} />}
    </View>
  );
}

export default function GamesScreen() {
  const router = useRouter();
  const total = useStore((s) => s.games.length);
  const deleteGame = useStore((s) => s.deleteGame);
  const { live, upcoming, results } = useGamesByStatus();
  const [filter, setFilter] = useState<FilterKey>("all");

  const openGame = (id: string) => router.push({ pathname: "/game/[id]", params: { id } });
  const confirmDelete = (g: Game) =>
    Alert.alert("Delete game?", `${g.homeTeam} vs ${g.awayTeam}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGame(g.id) },
    ]);

  const sections: GameSection[] =
    filter === "FT"
      ? [{ title: "Results", data: results }]
      : filter === "Live"
        ? [{ title: "Live", data: live }]
        : filter === "Pending"
          ? [{ title: "Upcoming", data: upcoming }]
          : [
              { title: "Live", data: live },
              { title: "Upcoming", data: upcoming },
              { title: "Results", data: results },
            ];
  const visible = sections.filter((s) => s.data.length > 0);
  const empty = EMPTY_FILTER[filter];

  return (
    <View style={styles.main}>
      <ScreenHeader
        title="Games"
        subtitle={`${total} ${total === 1 ? "game" : "games"}`}
        actions={[{ icon: "add", label: "Create game", onPress: () => router.push("/create-game") }]}
      />
      {total === 0 ? (
        <EmptyState icon="football-outline" title="No games yet" sub="Create your first game to get the season going">
          <Button label="Create game" onPress={() => router.push("/create-game")} />
        </EmptyState>
      ) : (
        <>
          <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
          <SectionList
            contentInsetAdjustmentBehavior="automatic"
            sections={visible}
            keyExtractor={(g) => g.id}
            renderSectionHeader={({ section }) =>
              filter === "all" ? <Text style={styles.sectionTitle}>{section.title}</Text> : null
            }
            renderItem={({ item, index, section }) => (
              <GameRow
                game={item}
                first={index === 0}
                last={index === section.data.length - 1}
                onPress={openGame}
                onDelete={confirmDelete}
              />
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon={empty.icon} title={empty.title} sub={empty.sub} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  list: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm, paddingBottom: SPACE.xxxl },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: T.text,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.sm,
  },
  cell: { backgroundColor: T.surface, overflow: "hidden" },
  cellFirst: { borderTopLeftRadius: RADIUS.card, borderTopRightRadius: RADIUS.card },
  cellLast: { borderBottomLeftRadius: RADIUS.card, borderBottomRightRadius: RADIUS.card },
  rowBg: { backgroundColor: T.surface },
  rowPressed: { backgroundColor: T.surfaceAlt },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: T.divider, marginLeft: SPACE.lg },
  deleteAction: { backgroundColor: T.red, justifyContent: "center", alignItems: "center", width: 72 },
});
