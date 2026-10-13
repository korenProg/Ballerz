import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  type DimensionValue,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import Crest from "../../components/Crest";
import { T } from "../../constants/theme";

const ATTR_ROWS = [
  ["pac", "PACE"],
  ["sho", "SHOOTING"],
  ["pas", "PASSING"],
  ["dri", "DRIBBLING"],
  ["def", "DEFENDING"],
  ["phy", "PHYSICAL"],
] as const;

const STATS = [
  ["goals", "Goals"],
  ["assists", "Assists"],
  ["mvps", "MVPs"],
] as const;

const FORM_LABEL = {
  hot: { label: "In form", icon: "flame", color: "#ea580c" },
  cold: { label: "Off form", icon: "snow", color: "#38bdf8" },
  neutral: { label: "Steady", icon: "remove", color: T.textMuted },
} as const;

// Green through red, so a bar reads as good or bad at a glance.
function attrColor(v: number): string {
  if (v >= 80) return "#059669";
  if (v >= 65) return "#84cc16";
  if (v >= 50) return "#ca8a04";
  if (v >= 35) return "#ea580c";
  return "#dc2626";
}

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = useStore((s) => s.players.find((p) => p.id === id) ?? null);
  const leagueColor = useStore((s) => s.league.color);
  const setMvp = useStore((s) => s.setMvp);
  const deletePlayer = useStore((s) => s.deletePlayer);

  if (!player) {
    return (
      <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={T.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Player</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.missingWrap}>
          <Ionicons name="help-circle-outline" size={34} color={T.textMuted} />
          <Text style={styles.missingTitle}>Player not found</Text>
          <Text style={styles.missingSub}>They may have been deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const form = FORM_LABEL[player.form] ?? FORM_LABEL.neutral;

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
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={T.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Player</Text>
        <Pressable
          hitSlop={8}
          onPress={() =>
            router.push({ pathname: "/create-player", params: { id: player.id } })
          }
        >
          <Ionicons name="create-outline" size={22} color={T.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.identity}>
          <Crest
            name={player.name}
            color={leagueColor}
            logo={player.photo}
            size={84}
          />
          <View style={styles.identityMain}>
            <Text style={styles.name} numberOfLines={2}>
              {player.name}
            </Text>
            <View style={styles.identityMeta}>
              <View style={styles.pill}>
                <Text style={styles.pillTxt}>{player.position}</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillTxt}>{player.foot} foot</Text>
              </View>
              {player.isMvp ? (
                <View style={[styles.pill, styles.pillMvp]}>
                  <Text style={[styles.pillTxt, styles.pillTxtMvp]}>MVP</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.formLine}>
              <Ionicons name={form.icon} size={14} color={form.color} />
              <Text style={styles.formTxt}>{form.label}</Text>
            </View>
          </View>
          <View style={styles.ovrBox}>
            <Text style={styles.ovrValue}>{player.ovr}</Text>
            <Text style={styles.ovrLabel}>OVR</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Attributes</Text>
        <View style={styles.card}>
          {ATTR_ROWS.map(([key, label]) => {
            const value = player[key];
            const width = `${value}%` as DimensionValue;
            return (
              <View key={key} style={styles.attrRow}>
                <Text style={styles.attrLabel}>{label}</Text>
                <View style={styles.attrTrack}>
                  <View
                    style={[
                      styles.attrFill,
                      { width, backgroundColor: attrColor(value) },
                    ]}
                  />
                </View>
                <Text style={styles.attrValue}>{value}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Season</Text>
        <View style={styles.statsRow}>
          {STATS.map(([key, label]) => (
            <View key={key} style={styles.statBox}>
              <Text style={styles.statValue}>{player[key]}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.action,
            player.isMvp ? styles.actionDisabled : null,
            pressed ? styles.actionPressed : null,
          ]}
          disabled={player.isMvp}
          onPress={() => setMvp(player.id)}
        >
          <Ionicons name="trophy-outline" size={18} color={T.textPrimary} />
          <Text style={styles.actionTxt}>
            {player.isMvp ? "Current league MVP" : "Set as league MVP"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.action,
            styles.actionDanger,
            pressed ? styles.actionPressed : null,
          ]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
          <Text style={[styles.actionTxt, styles.actionTxtDanger]}>
            Delete player
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: T.textPrimary },
  headerSpacer: { width: 22 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  identity: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18 },
  identityMain: { flex: 1, gap: 7 },
  name: { fontSize: 22, fontWeight: "900", color: T.textPrimary },
  identityMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  pillMvp: { backgroundColor: "#ca8a04", borderColor: "#ca8a04" },
  pillTxt: { fontSize: 11, fontWeight: "800", color: T.textSecondary },
  pillTxtMvp: { color: "#fff" },
  formLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  formTxt: { fontSize: 12, fontWeight: "700", color: T.textSecondary },
  ovrBox: { alignItems: "center", minWidth: 42 },
  ovrValue: { fontSize: 30, fontWeight: "900", color: T.textPrimary },
  ovrLabel: { fontSize: 9, fontWeight: "800", color: T.textMuted, letterSpacing: 0.8 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: T.textMuted,
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 11,
  },
  attrRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  attrLabel: {
    width: 78,
    fontSize: 10,
    fontWeight: "800",
    color: T.textSecondary,
    letterSpacing: 0.4,
  },
  attrTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.bg,
    overflow: "hidden",
  },
  attrFill: { height: 6, borderRadius: 3 },
  attrValue: {
    width: 24,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "900",
    color: T.textPrimary,
  },

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  statValue: { fontSize: 22, fontWeight: "900", color: T.textPrimary },
  statLabel: { fontSize: 11, fontWeight: "700", color: T.textSecondary, marginTop: 2 },

  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  actionPressed: { opacity: 0.6 },
  actionDisabled: { opacity: 0.45 },
  actionDanger: { borderColor: "#dc2626" },
  actionTxt: { fontSize: 14, fontWeight: "800", color: T.textPrimary },
  actionTxtDanger: { color: "#dc2626" },

  missingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  missingTitle: { fontSize: 16, fontWeight: "800", color: T.textPrimary, marginTop: 6 },
  missingSub: { fontSize: 13, fontWeight: "600", color: T.textSecondary },
});
