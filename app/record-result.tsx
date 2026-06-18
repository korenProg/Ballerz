import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { T } from "../constants/theme";

export default function RecordResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useStore((s) => s.games.find((g) => g.id === id) ?? null);
  const players = useStore((s) => s.players);
  const finishGame = useStore((s) => s.finishGame);
  const setMvp = useStore((s) => s.setMvp);
  const updatePlayer = useStore((s) => s.updatePlayer);

  const [homeScore, setHomeScore] = useState(game?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(game?.awayScore ?? 0);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [mvpStat, setMvpStat] = useState("");

  if (!game) {
    return (
      <SafeAreaView style={styles.main}>
        <View style={styles.center}><Text style={styles.notFound}>Game not found</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}><Text style={styles.cancelTxt}>Close</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const lineup = [...(game.homePlayers ?? []), ...(game.awayPlayers ?? [])];

  function confirm() {
    if (!game) return;
    const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
    finishGame(game.id, homeScore, awayScore, mvpPlayer?.name ?? "", mvpPlayer ? mvpStat.trim() : "");
    if (mvpPlayer) {
      setMvp(mvpPlayer.id);
      updatePlayer(mvpPlayer.id, { mvps: mvpPlayer.mvps + 1 });
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Result</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}><Ionicons name="close" size={26} color={T.textPrimary} /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.matchup}>{game.homeTeam} vs {game.awayTeam}</Text>

        <Text style={styles.label}>Final score</Text>
        <View style={styles.scoreRow}>
          <Stepper value={homeScore} onChange={setHomeScore} />
          <Text style={styles.colon}>:</Text>
          <Stepper value={awayScore} onChange={setAwayScore} />
        </View>

        <Text style={styles.label}>MVP (optional)</Text>
        {lineup.length === 0 ? (
          <Text style={styles.hint}>No lineup recorded for this game</Text>
        ) : (
          <View style={styles.chipWrap}>
            {lineup.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.chip, mvpId === p.id && styles.chipOn]} activeOpacity={0.8} onPress={() => setMvpId(mvpId === p.id ? null : p.id)}>
                <Text style={[styles.chipTxt, mvpId === p.id && styles.chipTxtOn]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {mvpId ? (
          <TextInput style={styles.input} value={mvpStat} onChangeText={setMvpStat} placeholder="MVP stat, e.g. 2 goals" placeholderTextColor={T.textMuted} />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85} onPress={confirm}>
          <Text style={styles.confirmTxt}>Confirm Result</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(0, value - 1))}><Ionicons name="remove" size={18} color={T.textPrimary} /></TouchableOpacity>
      <Text style={styles.stepVal}>{value}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(value + 1)}><Ionicons name="add" size={18} color={T.textPrimary} /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: "900", color: T.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  matchup: { fontSize: 14, fontWeight: "700", color: T.textSecondary, textAlign: "center", marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 18, marginBottom: 8 },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  colon: { fontSize: 24, fontWeight: "900", color: T.textPrimary },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.border, alignItems: "center", justifyContent: "center" },
  stepVal: { fontSize: 20, fontWeight: "900", color: T.textPrimary, minWidth: 24, textAlign: "center" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  chipOn: { backgroundColor: "#ca8a04", borderColor: "#ca8a04" },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  chipTxtOn: { color: "#fff" },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.textPrimary, marginTop: 10 },
  hint: { fontSize: 13, color: T.textSecondary },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  confirmBtn: { backgroundColor: T.textPrimary, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  confirmTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFound: { fontSize: 16, fontWeight: "700", color: T.textSecondary },
  cancelBtn: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  cancelTxt: { color: T.textPrimary, fontWeight: "700" },
});
