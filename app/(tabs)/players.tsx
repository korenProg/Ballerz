import { memo, useState, type ComponentProps } from "react";
import { View, Text, FlatList, StyleSheet, type ListRenderItemInfo } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlayersByPosition } from "../../store/selectors";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import Tabs from "../../components/ui/Tabs";
import ListRow, { ROW_H } from "../../components/ui/ListRow";
import RatingBadge from "../../components/ui/RatingBadge";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import SearchField from "../../components/ui/SearchField";
import { matchesSearch } from "../../utils/search";
import { T, SPACE, RADIUS } from "../../constants/theme";
import type { Player } from "../../types/players";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "GK", label: "GK" },
  { key: "DEF", label: "DEF" },
  { key: "MID", label: "MID" },
  { key: "FWD", label: "FWD" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const EMPTY: Record<FilterKey, { title: string; sub: string }> = {
  all: { title: "No players yet", sub: "Add your first player to build the squad" },
  GK: { title: "No keepers", sub: "Nobody is listed as GK yet" },
  DEF: { title: "No defenders", sub: "Nobody is listed as DEF yet" },
  MID: { title: "No midfielders", sub: "Nobody is listed as MID yet" },
  FWD: { title: "No forwards", sub: "Nobody is listed as FWD yet" },
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];
const FORM_ARROW: Record<Player["form"], { icon: IoniconName; color: string } | null> = {
  hot: { icon: "arrow-up", color: T.accent },
  cold: { icon: "arrow-down", color: T.red },
  neutral: null,
};

// Only primitives cross this boundary, so the shallow compare in memo works.
const PlayerRow = memo(function PlayerRow({
  id,
  name,
  position,
  ovr,
  form,
  isMvp,
  photo,
  first,
  last,
  onPress,
}: {
  id: string;
  name: string;
  position: string;
  ovr: number;
  form: Player["form"];
  isMvp: boolean;
  photo?: string;
  first: boolean;
  last: boolean;
  onPress: (id: string) => void;
}) {
  const arrow = FORM_ARROW[form] ?? null;
  return (
    <View style={[styles.cell, first ? styles.cellFirst : null, last ? styles.cellLast : null]}>
      <ListRow
        onPress={() => onPress(id)}
        leading={<Crest name={name} logo={photo} size={40} variant="avatar" />}
        title={name}
        badge={
          isMvp ? (
            <View style={styles.mvp}>
              <Text style={styles.mvpTxt}>MVP</Text>
            </View>
          ) : undefined
        }
        subtitle={position}
        trailing={
          <View style={styles.trailing}>
            {arrow ? <Ionicons name={arrow.icon} size={14} color={arrow.color} /> : null}
            <RatingBadge value={ovr} />
          </View>
        }
        divider={!last}
      />
    </View>
  );
});

const keyExtractor = (p: Player) => p.id;
const getItemLayout = (_: unknown, index: number) => ({
  length: ROW_H,
  offset: ROW_H * index,
  index,
});

export default function PlayersScreen() {
  const router = useRouter();
  const roster = usePlayersByPosition();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  // One stable callback for the whole list; rows call it with their own id.
  const openPlayer = (id: string) => router.push({ pathname: "/player/[id]", params: { id } });

  const searching = query.trim().length > 0;
  const players = searching
    ? roster[filter].filter((p) => matchesSearch(p.name, query))
    : roster[filter];
  const empty = EMPTY[filter];

  const renderItem = ({ item, index }: ListRenderItemInfo<Player>) => (
    <PlayerRow
      id={item.id}
      name={item.name}
      position={item.position}
      ovr={item.ovr}
      form={item.form}
      isMvp={!!item.isMvp}
      photo={item.photo}
      first={index === 0}
      last={index === players.length - 1}
      onPress={openPlayer}
    />
  );

  return (
    <View style={styles.main}>
      <ScreenHeader
        title="Players"
        subtitle={`${roster.all.length} in the squad`}
        actions={[{ icon: "add", label: "Add player", onPress: () => router.push("/create-player") }]}
      />
      <View style={styles.search}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search players" />
      </View>
      <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searching ? (
            <EmptyState
              icon="search-outline"
              title={`No players match “${query.trim()}”`}
              sub="Try a different name, or clear the search."
            >
              <Button variant="secondary" label="Clear search" onPress={() => setQuery("")} />
            </EmptyState>
          ) : (
            <EmptyState icon="people-outline" title={empty.title} sub={empty.sub}>
              {filter === "all" ? (
                <Button label="Add player" onPress={() => router.push("/create-player")} />
              ) : null}
            </EmptyState>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  search: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xs },
  list: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xxxl },
  cell: { backgroundColor: T.surface, overflow: "hidden" },
  cellFirst: { borderTopLeftRadius: RADIUS.card, borderTopRightRadius: RADIUS.card },
  cellLast: { borderBottomLeftRadius: RADIUS.card, borderBottomRightRadius: RADIUS.card },
  mvp: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: T.yellow },
  mvpTxt: { fontSize: 10, fontWeight: "700", color: "#000" },
  trailing: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
});
