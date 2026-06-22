import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { formatDate, parseDMY } from "../utils/game";
import { T } from "../constants/theme";
import TeamStep from "../components/wizard/TeamStep";
import DetailsStep from "../components/wizard/DetailsStep";

const TEAM_COLORS = ["#0039a3", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0d9488", "#ca8a04", "#e11d48"];

export default function CreateGameScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const league = useStore((s) => s.league);
  const addGame = useStore((s) => s.addGame);
  const updateGame = useStore((s) => s.updateGame);
  const players = useStore((s) => s.players);
  const setMvp = useStore((s) => s.setMvp);
  const updatePlayer = useStore((s) => s.updatePlayer);
  const editing = useStore((s) => (id ? s.games.find((g) => g.id === id) ?? null : null));

  const [step, setStep] = useState(0);
  const [showDate, setShowDate] = useState(false);
  const [homeTeam, setHomeTeam] = useState(editing?.homeTeam ?? "");
  const [awayTeam, setAwayTeam] = useState(editing?.awayTeam ?? "");
  const [homeColor, setHomeColor] = useState(editing?.homeColor ?? league.color);
  const [awayColor, setAwayColor] = useState(editing?.awayColor ?? TEAM_COLORS[1]);
  const [date, setDate] = useState(editing?.date ?? formatDate(new Date()));
  const [location, setLocation] = useState(editing?.location ?? league.defaultLocation ?? "");
  const [homeLogo, setHomeLogo] = useState<string | null>(editing?.homeLogo ?? null);
  const [awayLogo, setAwayLogo] = useState<string | null>(editing?.awayLogo ?? null);
  const [homePlayerIds, setHomePlayerIds] = useState<string[]>(editing?.homePlayers?.map((p) => p.id) ?? []);
  const [awayPlayerIds, setAwayPlayerIds] = useState<string[]>(editing?.awayPlayers?.map((p) => p.id) ?? []);
  const [mode, setMode] = useState<"upcoming" | "result">(editing?.status === "FT" ? "result" : "upcoming");
  const [homeScore, setHomeScore] = useState(editing?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(editing?.awayScore ?? 0);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [mvpStat, setMvpStat] = useState(editing?.mvp?.stat ?? "");

  const toggle = (side: "home" | "away", pid: string) => {
    if (side === "home") {
      setAwayPlayerIds((a) => a.filter((x) => x !== pid));
      setHomePlayerIds((h) => (h.includes(pid) ? h.filter((x) => x !== pid) : [...h, pid]));
    } else {
      setHomePlayerIds((h) => h.filter((x) => x !== pid));
      setAwayPlayerIds((a) => (a.includes(pid) ? a.filter((x) => x !== pid) : [...a, pid]));
    }
  };

  const snapshot = (ids: string[]) =>
    ids
      .map((pid) => players.find((p) => p.id === pid))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ id: p.id, name: p.name, position: p.position }));

  const lineup = [...homePlayerIds, ...awayPlayerIds]
    .map((pid) => players.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ id: p.id, name: p.name }));

  async function pickLogo(set: (uri: string) => void) {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) set(res.assets[0].uri);
  }

  function save() {
    const base = {
      league: league.name,
      homeTeam: homeTeam.trim(), awayTeam: awayTeam.trim(),
      homeColor, awayColor, date, location: location.trim(),
      homeLogo: homeLogo ?? undefined,
      awayLogo: awayLogo ?? undefined,
      homePlayers: snapshot(homePlayerIds), awayPlayers: snapshot(awayPlayerIds),
    };
    if (editing) {
      if (mode === "result") {
        const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
        updateGame(editing.id, { ...base, status: "FT", homeScore, awayScore, mvp: { name: mvpPlayer?.name ?? editing.mvp.name, stat: mvpPlayer ? mvpStat.trim() : editing.mvp.stat } });
      } else {
        updateGame(editing.id, { ...base, status: "Pending", homeScore: 0, awayScore: 0, mvp: { name: "", stat: "" } });
      }
      router.back();
      return;
    }
    if (mode === "result") {
      const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
      addGame({ ...base, status: "FT", homeScore, awayScore, mvp: { name: mvpPlayer?.name ?? "", stat: mvpPlayer ? mvpStat.trim() : "" } });
      if (mvpPlayer) {
        setMvp(mvpPlayer.id);
        updatePlayer(mvpPlayer.id, { mvps: mvpPlayer.mvps + 1 });
      }
    } else {
      addGame({ ...base, status: "Pending", homeScore: 0, awayScore: 0, mvp: { name: "", stat: "" } });
    }
    router.back();
  }

  const canContinue =
    step === 0 ? homeTeam.trim().length > 0 : step === 1 ? awayTeam.trim().length > 0 : true;
  const dateLabel = parseDMY(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  function next() {
    if (step < 2) { setStep(step + 1); return; }
    if (canContinue) save();
  }

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={T.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editing ? "Edit Game" : "New Game"}</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.progressSeg, i <= step && styles.progressSegActive]}
              disabled={i >= step}
              hitSlop={8}
              onPress={() => setStep(i)}
            />
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <TeamStep
              stepNum={1} sideLabel="Home" colors={TEAM_COLORS}
              name={homeTeam} onName={setHomeTeam} color={homeColor} onColor={setHomeColor}
              logo={homeLogo} onPickLogo={() => pickLogo(setHomeLogo)} onClearLogo={() => setHomeLogo(null)}
              players={players} selectedIds={homePlayerIds} onToggle={(pid) => toggle("home", pid)}
              defaultTeamSize={league.defaultTeamSize} onAddPlayers={() => router.push("/create-player")}
            />
          )}
          {step === 1 && (
            <TeamStep
              stepNum={2} sideLabel="Away" colors={TEAM_COLORS}
              name={awayTeam} onName={setAwayTeam} color={awayColor} onColor={setAwayColor}
              logo={awayLogo} onPickLogo={() => pickLogo(setAwayLogo)} onClearLogo={() => setAwayLogo(null)}
              players={players} selectedIds={awayPlayerIds} onToggle={(pid) => toggle("away", pid)}
              defaultTeamSize={league.defaultTeamSize} onAddPlayers={() => router.push("/create-player")}
            />
          )}
          {step === 2 && (
            <DetailsStep
              homeTeam={homeTeam} awayTeam={awayTeam} homeColor={homeColor} awayColor={awayColor}
              homeLogo={homeLogo} awayLogo={awayLogo}
              mode={mode} onMode={setMode}
              dateLabel={dateLabel} onOpenDate={() => setShowDate(true)}
              location={location} onLocation={setLocation}
              homeScore={homeScore} onHomeScore={setHomeScore} awayScore={awayScore} onAwayScore={setAwayScore}
              lineup={lineup} mvpId={mvpId} onMvp={setMvpId} mvpStat={mvpStat} onMvpStat={setMvpStat}
            />
          )}
        </ScrollView>

        {showDate && (
          <DateTimePicker
            value={parseDMY(date)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selected) => {
              setShowDate(false);
              if (event.type === "set" && selected) setDate(formatDate(selected));
            }}
          />
        )}

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => setStep(step - 1)}>
              <Text style={styles.backTxt}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.nextBtn, !canContinue && styles.nextDisabled]} activeOpacity={0.8} disabled={!canContinue} onPress={next}>
            <Text style={styles.nextTxt}>
              {step < 2 ? "Continue" : mode === "result" ? "Save Result" : "Create Game"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: T.textPrimary },
  progressRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 4 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: T.surface },
  progressSegActive: { backgroundColor: T.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  backBtn: { paddingVertical: 15, paddingHorizontal: 22, borderRadius: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center" },
  backTxt: { fontSize: 14, fontWeight: "800", color: T.textPrimary },
  nextBtn: { flex: 1, backgroundColor: T.textPrimary, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  nextDisabled: { opacity: 0.4 },
  nextTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
});
