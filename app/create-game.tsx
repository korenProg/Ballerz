import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { formatDate } from "../utils/game";
import { T } from "../constants/theme";

const TEAM_COLORS = ["#0039a3", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0d9488", "#ca8a04", "#e11d48"];

export default function CreateGameScreen() {
  const router = useRouter();
  const league = useStore((s) => s.league);
  const addGame = useStore((s) => s.addGame);
  const players = useStore((s) => s.players);
  const setMvp = useStore((s) => s.setMvp);
  const updatePlayer = useStore((s) => s.updatePlayer);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeColor, setHomeColor] = useState(league.color);
  const [awayColor, setAwayColor] = useState(TEAM_COLORS[1]);
  const [date, setDate] = useState(formatDate(new Date()));
  const [location, setLocation] = useState(league.defaultLocation ?? "");
  const [homeLogo, setHomeLogo] = useState<string | null>(null);
  const [awayLogo, setAwayLogo] = useState<string | null>(null);
  const [homePlayerIds, setHomePlayerIds] = useState<string[]>([]);
  const [awayPlayerIds, setAwayPlayerIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"upcoming" | "result">("upcoming");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [mvpStat, setMvpStat] = useState("");

  const toggle = (side: "home" | "away", id: string) => {
    if (side === "home") {
      setAwayPlayerIds((a) => a.filter((x) => x !== id));
      setHomePlayerIds((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
    } else {
      setHomePlayerIds((h) => h.filter((x) => x !== id));
      setAwayPlayerIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
    }
  };

  const snapshot = (ids: string[]) =>
    ids
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ id: p.id, name: p.name, position: p.position }));

  const lineup = [...homePlayerIds, ...awayPlayerIds]
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  async function pickLogo(set: (uri: string) => void) {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) set(res.assets[0].uri);
  }

  const canSave = homeTeam.trim().length > 0 && awayTeam.trim().length > 0;

  function save() {
    if (!canSave) return;
    const base = {
      league: league.name,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      homeColor, awayColor, date,
      location: location.trim(),
      homeLogo: homeLogo ?? undefined,
      awayLogo: awayLogo ?? undefined,
      homePlayers: snapshot(homePlayerIds),
      awayPlayers: snapshot(awayPlayerIds),
    };
    if (mode === "result") {
      const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
      addGame({
        ...base,
        status: "FT",
        homeScore, awayScore,
        mvp: { name: mvpPlayer?.name ?? "", stat: mvpPlayer ? mvpStat.trim() : "" },
      });
      if (mvpPlayer) {
        setMvp(mvpPlayer.id);
        updatePlayer(mvpPlayer.id, { mvps: mvpPlayer.mvps + 1 });
      }
    } else {
      addGame({ ...base, status: "Pending", homeScore: 0, awayScore: 0, mvp: { name: "", stat: "" } });
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={T.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Game</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.segment}>
            {(["upcoming", "result"] as const).map((m) => (
              <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segBtnActive]} activeOpacity={0.8} onPress={() => setMode(m)}>
                <Text style={[styles.segTxt, mode === m && styles.segTxtActive]}>{m === "upcoming" ? "Upcoming" : "Log result"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Home team</Text>
          <TextInput style={styles.input} value={homeTeam} onChangeText={setHomeTeam} placeholder="e.g. Reds" placeholderTextColor={T.textMuted} />
          <ColorRow value={homeColor} onChange={setHomeColor} />
          <TouchableOpacity style={styles.logoSlot} activeOpacity={0.8} onPress={() => pickLogo(setHomeLogo)}>
            {homeLogo ? (
              <Image source={{ uri: homeLogo }} style={styles.logoSlotImg} resizeMode="contain" />
            ) : (
              <Ionicons name="image-outline" size={20} color={T.textSecondary} />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Away team</Text>
          <TextInput style={styles.input} value={awayTeam} onChangeText={setAwayTeam} placeholder="e.g. Blues" placeholderTextColor={T.textMuted} />
          <ColorRow value={awayColor} onChange={setAwayColor} />
          <TouchableOpacity style={styles.logoSlot} activeOpacity={0.8} onPress={() => pickLogo(setAwayLogo)}>
            {awayLogo ? (
              <Image source={{ uri: awayLogo }} style={styles.logoSlotImg} resizeMode="contain" />
            ) : (
              <Ionicons name="image-outline" size={20} color={T.textSecondary} />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Date</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" placeholderTextColor={T.textMuted} />

          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. City Park (optional)" placeholderTextColor={T.textMuted} />

          <Text style={styles.label}>Lineups (optional · {league.defaultTeamSize}v{league.defaultTeamSize})</Text>
          {players.length === 0 ? (
            <TouchableOpacity onPress={() => router.push("/create-player")}>
              <Text style={styles.hintLink}>No players yet — add players first</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.lineupSide}>Home squad</Text>
              <View style={styles.chipWrap}>
                {players.map((p) => {
                  const on = homePlayerIds.includes(p.id);
                  return (
                    <TouchableOpacity key={p.id} style={[styles.chip, on && { backgroundColor: homeColor, borderColor: homeColor }]} activeOpacity={0.8} onPress={() => toggle("home", p.id)}>
                      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{p.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.lineupSide}>Away squad</Text>
              <View style={styles.chipWrap}>
                {players.map((p) => {
                  const on = awayPlayerIds.includes(p.id);
                  return (
                    <TouchableOpacity key={p.id} style={[styles.chip, on && { backgroundColor: awayColor, borderColor: awayColor }]} activeOpacity={0.8} onPress={() => toggle("away", p.id)}>
                      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{p.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {mode === "result" && (
            <>
              <Text style={styles.label}>Final score</Text>
              <View style={styles.scoreRow}>
                <Stepper value={homeScore} onChange={setHomeScore} />
                <Text style={styles.scoreColon}>:</Text>
                <Stepper value={awayScore} onChange={setAwayScore} />
              </View>
              <Text style={styles.label}>MVP (optional)</Text>
              {lineup.length === 0 ? (
                <Text style={styles.hintLink}>Add players to a lineup to pick an MVP</Text>
              ) : (
                <View style={styles.chipWrap}>
                  {lineup.map((p) => (
                    <TouchableOpacity key={p.id} style={[styles.chip, mvpId === p.id && styles.chipMvpOn]} activeOpacity={0.8} onPress={() => setMvpId(mvpId === p.id ? null : p.id)}>
                      <Text style={[styles.chipTxt, mvpId === p.id && styles.chipTxtOn]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {mvpId ? (
                <TextInput style={[styles.input, { marginTop: 10 }]} value={mvpStat} onChangeText={setMvpStat} placeholder="MVP stat, e.g. 2 goals" placeholderTextColor={T.textMuted} />
              ) : null}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} activeOpacity={0.8} disabled={!canSave} onPress={save}>
            <Text style={styles.saveBtnTxt}>{mode === "result" ? "Save Result" : "Create Game"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

function ColorRow({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <View style={styles.swatchRow}>
      {TEAM_COLORS.map((c) => (
        <TouchableOpacity key={c} style={[styles.swatch, { backgroundColor: c }, value === c && styles.swatchActive]} activeOpacity={0.8} onPress={() => onChange(c)}>
          {value === c ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: T.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  label: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.textPrimary },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  swatchActive: { borderWidth: 2, borderColor: T.textPrimary },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  saveBtn: { backgroundColor: T.textPrimary, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
  logoSlot: { width: 56, height: 56, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 8 },
  logoSlotImg: { width: "100%", height: "100%" },
  hintLink: { fontSize: 13, color: T.textSecondary, textDecorationLine: "underline", marginTop: 8 },
  lineupSide: { fontSize: 12, fontWeight: "700", color: T.textSecondary, marginTop: 12, marginBottom: 6 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  chipTxtOn: { color: "#fff" },
  segment: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 12, padding: 4, marginTop: 8 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  segBtnActive: { backgroundColor: T.border },
  segTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  segTxtActive: { color: T.textPrimary },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 6 },
  scoreColon: { fontSize: 24, fontWeight: "900", color: T.textPrimary },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.border, alignItems: "center", justifyContent: "center" },
  stepVal: { fontSize: 20, fontWeight: "900", color: T.textPrimary, minWidth: 24, textAlign: "center" },
  chipMvpOn: { backgroundColor: "#ca8a04", borderColor: "#ca8a04" },
});
