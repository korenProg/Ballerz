import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Text } from "../../components/ui/Text";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import ScreenHeader from "../../components/ui/ScreenHeader";
import Section from "../../components/ui/Section";
import RatingBadge from "../../components/ui/RatingBadge";
import EmptyState from "../../components/ui/EmptyState";
import ResultChip from "../../components/ui/ResultChip";
import { chooseAction } from "../../components/ui/chooseAction";
import PlayerAvatar from "../../components/PlayerAvatar";
import AttributeRadar from "../../components/AttributeRadar";
import { T, TYPE, SPACE } from "../../constants/theme";
import { shortDate } from "../../utils/game";
import { computePlayerStats, recentForm } from "../../utils/playerStats";
import type { Player } from "../../types/players";

const AXES = [
  ["pac", "PAC"],
  ["sho", "SHO"],
  ["pas", "PAS"],
  ["dri", "DRI"],
  ["def", "DEF"],
  ["phy", "PHY"],
] as const;

const FOOT_LABEL: Record<Player["foot"], string> = { L: "Left foot", R: "Right foot" };
const RECENT = 5;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = useStore((s) => s.players.find((p) => p.id === id) ?? null);
  const games = useStore((s) => s.games);
  const setMvp = useStore((s) => s.setMvp);
  const deletePlayer = useStore((s) => s.deletePlayer);

  if (!player) {
    return (
      <SafeAreaView style={styles.main} edges={["bottom"]}>
        <ScreenHeader nav="back" title="Player" />
        <EmptyState icon="help-circle-outline" title="Player not found" sub="They may have been deleted." />
      </SafeAreaView>
    );
  }

  const stats = computePlayerStats(player, games);
  const form = recentForm(stats.games);
  const recent = stats.games.slice(0, RECENT);
  // The radar fills the card's width, capped so it never dominates a tablet.
  const radarSize = Math.min(width - SPACE.lg * 4, 300);

  const confirmDelete = () =>
    chooseAction(`Delete ${player.name}? This can't be undone.`, [
      {
        text: "Delete Player",
        style: "destructive",
        onPress: () => {
          deletePlayer(player.id);
          router.back();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <SafeAreaView style={styles.main} edges={["bottom"]}>
      <ScreenHeader
        nav="back"
        title="Player"
        menu={{
          label: "Player options",
          items: [
            {
              label: "Edit",
              sfSymbol: "pencil",
              onPress: () => router.push({ pathname: "/create-player", params: { id: player.id } }),
            },
            player.isMvp
              ? { label: "Current League MVP", sfSymbol: "star.fill", onPress: () => {}, disabled: true }
              : { label: "Set as League MVP", sfSymbol: "star", onPress: () => setMvp(player.id) },
            { label: "Delete Player", sfSymbol: "trash", destructive: true, onPress: confirmDelete },
          ],
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <PlayerAvatar name={player.name} photo={player.photo} size={104} />
          <Text style={styles.name} numberOfLines={2}>
            {player.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {player.position} · {FOOT_LABEL[player.foot]}
            </Text>
            <RatingBadge value={player.ovr} />
          </View>
          {player.isMvp ? (
            <View style={styles.mvp}>
              <Ionicons name="star" size={12} color="#000" />
              <Text style={styles.mvpTxt}>League MVP</Text>
            </View>
          ) : null}
        </View>

        <Section>
          <View style={styles.stats}>
            <Stat value={String(stats.played)} label="Games" />
            <View style={styles.statDivider} />
            <Stat value={String(stats.wins)} label="Wins" />
            <View style={styles.statDivider} />
            <Stat value={stats.played ? `${stats.winRate}%` : "–"} label="Win rate" />
            <View style={styles.statDivider} />
            <Stat value={String(player.mvps)} label="MVPs" />
          </View>
          {stats.played === 0 ? (
            <Text style={styles.statsNote}>Stats appear after their first finished game.</Text>
          ) : null}
        </Section>

        {form.length > 0 ? (
          <Section padded>
            <View style={styles.formRow}>
              <Text style={TYPE.sectionTitle}>Form</Text>
              <View style={styles.formChips} accessible accessibilityLabel={`Last results: ${form.join(", ")}`}>
                {form.map((r, i) => (
                  <ResultChip key={i} result={r} />
                ))}
              </View>
            </View>
          </Section>
        ) : null}

        <Section title="Attributes" padded>
          <View style={styles.radar}>
            <AttributeRadar axes={AXES.map(([key, label]) => ({ label, value: player[key] }))} size={radarSize} />
          </View>
        </Section>

        {recent.length > 0 ? (
          <Section title="Recent games">
            {recent.map(({ game: g, result, wasMvp }, i) => {
              const home = (g.homePlayers ?? []).some((p) => p.id === player.id);
              return (
                <Pressable
                  key={g.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/game/[id]", params: { id: g.id } })}
                  style={({ pressed }) => [styles.gameRow, pressed ? styles.pressed : null]}
                >
                  <Text style={styles.gameDate}>{shortDate(g.date)}</Text>
                  <Text style={styles.gameLine} numberOfLines={1}>
                    <Text style={home ? styles.ourTeam : null}>{g.homeTeam}</Text>
                    <Text style={styles.score}>
                      {"  "}
                      {g.homeScore}–{g.awayScore}
                      {"  "}
                    </Text>
                    <Text style={home ? null : styles.ourTeam}>{g.awayTeam}</Text>
                  </Text>
                  {wasMvp ? <Ionicons name="star" size={14} color={T.yellow} accessibilityLabel="MVP" /> : null}
                  <ResultChip result={result} />
                  {i < recent.length - 1 ? <View style={styles.rowDivider} /> : null}
                </Pressable>
              );
            })}
          </Section>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  pressed: { opacity: 0.6 },

  hero: { alignItems: "center", gap: SPACE.sm, paddingTop: SPACE.sm, paddingBottom: SPACE.xs },
  name: { fontSize: 24, fontWeight: "700", color: T.text, textAlign: "center", marginTop: SPACE.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  meta: { fontSize: 15, fontWeight: "400", color: T.textDim },
  mvp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: T.yellow,
  },
  mvpTxt: { fontSize: 12, fontWeight: "700", color: "#000" },

  stats: { flexDirection: "row", alignItems: "center", paddingVertical: SPACE.lg },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: T.divider },
  statsNote: {
    ...TYPE.caption,
    textAlign: "center",
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.lg,
    marginTop: -SPACE.xs,
  },

  formRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formChips: { flexDirection: "row", gap: 6 },
  radar: { alignItems: "center" },

  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    height: 56,
    paddingHorizontal: SPACE.lg,
  },
  gameDate: { width: 48, fontSize: 13, fontWeight: "500", color: T.textFaint, fontVariant: ["tabular-nums"] },
  gameLine: { flex: 1, fontSize: 15, fontWeight: "400", color: T.textDim },
  ourTeam: { color: T.text, fontWeight: "600" },
  score: { color: T.text, fontWeight: "700", fontVariant: ["tabular-nums"] },
  rowDivider: {
    position: "absolute",
    left: SPACE.lg,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.divider,
  },
});
