import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import type { GamePlayer } from "../types/games";

const PRESET_COLORS = ["#f5c518", "#0039a3", "#cc0000", "#1a7a1a", "#7b2fbe", "#e0e0e0", "#ff6b00", "#00bcd4"];

function today(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function CreateGame() {
  const router = useRouter();
  const { players, league, addGame } = useStore();

  const [step, setStep] = useState(1);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeColor, setHomeColor] = useState(league.color);
  const [awayColor, setAwayColor] = useState("#cc0000");
  const [date, setDate] = useState(today());
  const [location, setLocation] = useState(league.defaultLocation);

  const [homePlayers, setHomePlayers] = useState<GamePlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<GamePlayer[]>([]);
  const limit = league.defaultTeamSize;

  function togglePlayer(side: "home" | "away", player: { id: string; name: string; position: string }) {
    const gamePlayer: GamePlayer = { id: player.id, name: player.name, position: player.position };
    if (side === "home") {
      const exists = homePlayers.some((p) => p.id === player.id);
      if (exists) {
        setHomePlayers((prev) => prev.filter((p) => p.id !== player.id));
      } else if (homePlayers.length < limit) {
        setHomePlayers((prev) => [...prev, gamePlayer]);
      }
    } else {
      const exists = awayPlayers.some((p) => p.id === player.id);
      if (exists) {
        setAwayPlayers((prev) => prev.filter((p) => p.id !== player.id));
      } else if (awayPlayers.length < limit) {
        setAwayPlayers((prev) => [...prev, gamePlayer]);
      }
    }
  }

  function create() {
    addGame({
      league: league.name || "League",
      homeTeam: homeTeam.trim() || "Home",
      awayTeam: awayTeam.trim() || "Away",
      homeColor,
      awayColor,
      date,
      location: location.trim() || undefined,
      status: "Pending",
      homeScore: 0,
      awayScore: 0,
      mvp: { name: "", stat: "" },
      homePlayers,
      awayPlayers,
      goalEvents: [],
    });
    router.replace("/(tabs)/games");
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color="#aaa" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Game</Text>
        <Text style={s.stepLabel}>Step {step}/3</Text>
      </View>

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${(step / 3) * 100}%` as any }]} />
      </View>

      {step === 1 && (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.sectionTitle}>Match Setup</Text>

          <Text style={s.label}>Home team name</Text>
          <TextInput style={s.input} value={homeTeam} onChangeText={setHomeTeam} placeholder="Home team" placeholderTextColor="#555" />

          <Text style={s.label}>Home color</Text>
          <View style={s.swatches}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={"home-" + c}
                style={[s.swatch, { backgroundColor: c }, homeColor === c && s.swatchSelected]}
                onPress={() => setHomeColor(c)}
              />
            ))}
          </View>

          <Text style={s.label}>Away team name</Text>
          <TextInput style={s.input} value={awayTeam} onChangeText={setAwayTeam} placeholder="Away team" placeholderTextColor="#555" />

          <Text style={s.label}>Away color</Text>
          <View style={s.swatches}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={"away-" + c}
                style={[s.swatch, { backgroundColor: c }, awayColor === c && s.swatchSelected]}
                onPress={() => setAwayColor(c)}
              />
            ))}
          </View>

          <Text style={s.label}>Date</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" placeholderTextColor="#555" />

          <Text style={s.label}>Location</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="e.g. The Cage" placeholderTextColor="#555" />

          <TouchableOpacity style={s.btn} onPress={() => setStep(2)}>
            <Text style={s.btnText}>Next: Lineup</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 2 && (
        <View style={s.lineupContainer}>
          <Text style={[s.sectionTitle, { paddingHorizontal: 16, paddingTop: 12 }]}>Pick Lineup</Text>
          <View style={s.lineupHeader}>
            <Text style={[s.teamHeaderText, { color: homeColor }]}>
              {homeTeam || "Home"} ({homePlayers.length}/{limit})
            </Text>
            <Text style={[s.teamHeaderText, { color: awayColor }]}>
              {awayTeam || "Away"} ({awayPlayers.length}/{limit})
            </Text>
          </View>
          <FlatList
            data={players}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <Text style={{ color: "#555", fontSize: 14 }}>No players yet — add some first</Text>
              </View>
            }
            renderItem={({ item }) => {
              const onHome = homePlayers.some((p) => p.id === item.id);
              const onAway = awayPlayers.some((p) => p.id === item.id);
              return (
                <View style={s.playerRow}>
                  <Text style={s.playerName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.playerPos}>{item.position}</Text>
                  <View style={s.sideButtons}>
                    <TouchableOpacity
                      style={[s.sideBtn, { borderColor: homeColor }, onHome && { backgroundColor: homeColor }]}
                      onPress={() => togglePlayer("home", item)}
                      disabled={onAway || (!onHome && homePlayers.length >= limit)}
                    >
                      <Text style={[s.sideBtnText, onHome && { color: "#000" }]}>H</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.sideBtn, { borderColor: awayColor }, onAway && { backgroundColor: awayColor }]}
                      onPress={() => togglePlayer("away", item)}
                      disabled={onHome || (!onAway && awayPlayers.length >= limit)}
                    >
                      <Text style={[s.sideBtnText, onAway && { color: "#000" }]}>A</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
          <TouchableOpacity style={[s.btn, { margin: 12 }]} onPress={() => setStep(3)}>
            <Text style={s.btnText}>Next: Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.sectionTitle}>Confirm Match</Text>

          <View style={s.confirmCard}>
            <View style={s.confirmTeams}>
              <View style={s.confirmTeam}>
                <View style={[s.colorDot, { backgroundColor: homeColor }]} />
                <Text style={s.confirmTeamName}>{homeTeam || "Home"}</Text>
                <Text style={s.confirmCount}>{homePlayers.length} players</Text>
              </View>
              <Text style={s.vsText}>vs</Text>
              <View style={s.confirmTeam}>
                <View style={[s.colorDot, { backgroundColor: awayColor }]} />
                <Text style={s.confirmTeamName}>{awayTeam || "Away"}</Text>
                <Text style={s.confirmCount}>{awayPlayers.length} players</Text>
              </View>
            </View>
            <View style={s.confirmDetails}>
              {location ? <Text style={s.confirmDetail}>📍 {location}</Text> : null}
              <Text style={s.confirmDetail}>📅 {date}</Text>
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={create}>
            <Text style={s.btnText}>Create Game</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  stepLabel: { fontSize: 13, color: "#888" },
  progressTrack: { height: 3, backgroundColor: "#1a1a1a" },
  progressFill: { height: 3, backgroundColor: "#f5c518" },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 },
  label: { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  swatches: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  swatch: { width: 34, height: 34, borderRadius: 17 },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
  btn: {
    backgroundColor: "#f5c518",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#000", fontWeight: "700", fontSize: 16 },
  lineupContainer: { flex: 1 },
  lineupHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  teamHeaderText: { fontWeight: "700", fontSize: 14 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  playerName: { flex: 1, color: "#fff", fontWeight: "600", fontSize: 14 },
  playerPos: { color: "#888", fontSize: 12, width: 28 },
  sideButtons: { flexDirection: "row", gap: 8 },
  sideBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnText: { color: "#aaa", fontWeight: "700", fontSize: 13 },
  confirmCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  confirmTeams: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  confirmTeam: { alignItems: "center", gap: 4, flex: 1 },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  confirmTeamName: { color: "#fff", fontWeight: "700", fontSize: 15, textAlign: "center" },
  confirmCount: { color: "#888", fontSize: 12 },
  vsText: { color: "#555", fontWeight: "700", fontSize: 18 },
  confirmDetails: { gap: 6 },
  confirmDetail: { color: "#aaa", fontSize: 14 },
});
