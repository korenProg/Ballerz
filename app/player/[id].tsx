import { View, Text, ScrollView, StyleSheet, Alert, type DimensionValue } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Section from "../../components/ui/Section";
import RatingBadge from "../../components/ui/RatingBadge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { T, SPACE } from "../../constants/theme";
import { ratingColor } from "../../utils/rating";
import type { Player } from "../../types/players";

const ATTR_ROWS = [
  ["pac", "Pace"],
  ["sho", "Shooting"],
  ["pas", "Passing"],
  ["dri", "Dribbling"],
  ["def", "Defending"],
  ["phy", "Physical"],
] as const;

const STATS = [
  ["goals", "Goals"],
  ["assists", "Assists"],
  ["mvps", "MVPs"],
] as const;

const FORM_LABEL: Record<Player["form"], string> = {
  hot: "In form",
  cold: "Off form",
  neutral: "Steady form",
};

const FOOT_LABEL: Record<Player["foot"], string> = { L: "Left foot", R: "Right foot" };

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = useStore((s) => s.players.find((p) => p.id === id) ?? null);
  const setMvp = useStore((s) => s.setMvp);
  const deletePlayer = useStore((s) => s.deletePlayer);

  const back = <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />;

  if (!player) {
    return (
      <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
        <ScreenHeader safeTop={false} leading={back} />
        <EmptyState icon="help-circle-outline" title="Player not found" sub="They may have been deleted." />
      </SafeAreaView>
    );
  }

  const confirmDelete = () =>
    Alert.alert("Delete player?", player.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deletePlayer(player.id);
          router.back();
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <ScreenHeader
        safeTop={false}
        leading={back}
        action={
          <IconButton
            icon="create-outline"
            label="Edit player"
            onPress={() => router.push({ pathname: "/create-player", params: { id: player.id } })}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <Crest name={player.name} logo={player.photo} size={72} variant="avatar" />
          <View style={styles.identityMain}>
            <Text style={styles.name} numberOfLines={2}>
              {player.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {player.position} · {FOOT_LABEL[player.foot]} · {FORM_LABEL[player.form] ?? FORM_LABEL.neutral}
            </Text>
            {player.isMvp ? (
              <View style={styles.mvp}>
                <Ionicons name="star" size={12} color="#000" />
                <Text style={styles.mvpTxt}>League MVP</Text>
              </View>
            ) : null}
          </View>
          <RatingBadge value={player.ovr} size="lg" />
        </View>

        <Section title="Season" padded>
          <View style={styles.stats}>
            {STATS.map(([key, label]) => (
              <View key={key} style={styles.stat}>
                <Text style={styles.statValue}>{player[key]}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Attributes" padded>
          <View style={styles.attrs}>
            {ATTR_ROWS.map(([key, label]) => {
              const value = player[key];
              const width = `${value}%` as DimensionValue;
              return (
                <View key={key} style={styles.attr}>
                  <Text style={styles.attrLabel}>{label}</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width, backgroundColor: ratingColor(value) }]} />
                  </View>
                  <Text style={styles.attrValue}>{value}</Text>
                </View>
              );
            })}
          </View>
        </Section>

        <View style={styles.actions}>
          <Button
            variant="secondary"
            icon="trophy-outline"
            label={player.isMvp ? "Current league MVP" : "Set as league MVP"}
            disabled={!!player.isMvp}
            onPress={() => setMvp(player.id)}
          />
          <Button variant="destructive" icon="trash-outline" label="Delete player" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  identity: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: SPACE.sm },
  identityMain: { flex: 1, gap: 6 },
  name: { fontSize: 22, fontWeight: "700", color: T.text },
  meta: { fontSize: 13, fontWeight: "400", color: T.textDim },
  mvp: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: T.yellow,
  },
  mvpTxt: { fontSize: 11, fontWeight: "700", color: "#000" },
  stats: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  attrs: { gap: 12 },
  attr: { flexDirection: "row", alignItems: "center", gap: 10 },
  attrLabel: { width: 82, fontSize: 13, fontWeight: "500", color: T.textDim },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: T.surfaceAlt, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  attrValue: {
    width: 26,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "600",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
  actions: { gap: SPACE.sm },
});
