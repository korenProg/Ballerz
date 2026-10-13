import { memo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../../store";
import { usePlayersByPosition } from "../../store/selectors";
import Crest from "../../components/Crest";
import { T } from "../../constants/theme";
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

const FORM_ICON = {
  hot: { name: "flame", color: "#ea580c" },
  cold: { name: "snow", color: "#38bdf8" },
  neutral: { name: "remove", color: T.textMuted },
} as const;

const ROW_H = 72;
const AVATAR = 44;

// Only primitives cross this boundary, so the shallow compare in memo works.
const PlayerRow = memo(function PlayerRow({
  id,
  name,
  position,
  ovr,
  form,
  isMvp,
  photo,
  crestColor,
  onPress,
}: {
  id: string;
  name: string;
  position: string;
  ovr: number;
  form: Player["form"];
  isMvp: boolean;
  photo?: string;
  crestColor: string;
  onPress: (id: string) => void;
}) {
  const formIcon = FORM_ICON[form] ?? FORM_ICON.neutral;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      onPress={() => onPress(id)}
    >
      <Crest name={name} color={crestColor} logo={photo} size={AVATAR} />

      <View style={styles.rowMain}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName} numberOfLines={1}>
            {name}
          </Text>
          {isMvp ? (
            <View style={styles.mvpBadge}>
              <Text style={styles.mvpTxt}>MVP</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.rowMetaLine}>
          <Text style={styles.rowPos}>{position}</Text>
          <Ionicons name={formIcon.name} size={13} color={formIcon.color} />
        </View>
      </View>

      <View style={styles.ovrBox}>
        <Text style={styles.ovrValue}>{ovr}</Text>
        <Text style={styles.ovrLabel}>OVR</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={T.textMuted} />
    </Pressable>
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
  const insets = useSafeAreaInsets();
  const crestColor = useStore((s) => s.league.color);
  const roster = usePlayersByPosition();
  const [filter, setFilter] = useState<FilterKey>("all");

  // One stable callback for the whole list; rows call it with their own id.
  const openPlayer = (id: string) =>
    router.push({ pathname: "/player/[id]", params: { id } });

  const players = roster[filter];
  const empty = EMPTY[filter];

  const renderItem = ({ item }: ListRenderItemInfo<Player>) => (
    <PlayerRow
      id={item.id}
      name={item.name}
      position={item.position}
      ovr={item.ovr}
      form={item.form}
      isMvp={!!item.isMvp}
      photo={item.photo}
      crestColor={crestColor}
      onPress={openPlayer}
    />
  );

  return (
    <View style={styles.main}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Players</Text>
            <Text style={styles.subtitle}>{roster.all.length} in the squad</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed ? styles.addBtnPressed : null]}
            onPress={() => router.push("/create-player")}
          >
            <Ionicons name="add" size={22} color={T.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.chip, filter === f.key ? styles.chipActive : null]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipTxt, filter === f.key ? styles.chipTxtActive : null]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={34} color={T.textMuted} />
            <Text style={styles.emptyTitle}>{empty.title}</Text>
            <Text style={styles.emptySub}>{empty.sub}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 30, fontWeight: "900", color: T.textPrimary, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, fontWeight: "600", color: T.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  addBtnPressed: { opacity: 0.6 },

  chips: { flexDirection: "row", gap: 8, marginTop: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  chipActive: { backgroundColor: T.textPrimary, borderColor: T.textPrimary },
  chipTxt: { fontSize: 12, fontWeight: "800", color: T.textSecondary },
  chipTxtActive: { color: T.bg },

  listContent: { paddingHorizontal: 20, paddingTop: 4 },
  row: {
    height: ROW_H,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowPressed: { opacity: 0.6 },
  rowMain: { flex: 1, gap: 4 },
  rowNameLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowName: { fontSize: 16, fontWeight: "800", color: T.textPrimary, flexShrink: 1 },
  mvpBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#ca8a04",
  },
  mvpTxt: { fontSize: 9, fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
  rowMetaLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  rowPos: { fontSize: 12, fontWeight: "700", color: T.textSecondary },

  ovrBox: { alignItems: "center", minWidth: 34 },
  ovrValue: { fontSize: 18, fontWeight: "900", color: T.textPrimary },
  ovrLabel: { fontSize: 8, fontWeight: "800", color: T.textMuted, letterSpacing: 0.6 },

  emptyWrap: { alignItems: "center", gap: 6, paddingTop: 70 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: T.textPrimary, marginTop: 6 },
  emptySub: { fontSize: 13, fontWeight: "600", color: T.textSecondary, textAlign: "center" },
});
