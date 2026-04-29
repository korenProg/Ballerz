import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useStore } from "../store";
import { T } from "../constants/theme";

export default function RecordResultScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const { games, players, updateGame, setMvp } = useStore();
  const game = games.find((g) => g.id === gameId);

  const [homeScore, setHomeScore] = useState(
    game?.status === "FT" ? String(game.homeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    game?.status === "FT" ? String(game.awayScore) : ""
  );
  const [mvpId, setMvpId] = useState<string | null>(null);

  if (!game) return null;

  const allPlayerIds = [
    ...(game.homePlayers ?? []).map((p) => p.id),
    ...(game.awayPlayers ?? []).map((p) => p.id),
  ];
  const gamePlayers = allPlayerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as typeof players;

  const handleSave = () => {
    const hs = parseInt(homeScore, 10);
    const as_ = parseInt(awayScore, 10);
    if (isNaN(hs) || isNaN(as_)) return;

    const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
    updateGame(game.id, {
      status: "FT",
      homeScore: hs,
      awayScore: as_,
      mvp: { name: mvpPlayer?.name ?? "—", stat: "" },
    });
    if (mvpId) setMvp(mvpId);
    router.back();
  };

  const canSave = homeScore !== "" && awayScore !== "" &&
    !isNaN(parseInt(homeScore, 10)) && !isNaN(parseInt(awayScore, 10));

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
            <Ionicons name="chevron-down" size={22} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={s.title}>Record Result</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.scoreRow}>
            <View style={s.teamSide}>
              <View style={[s.teamDot, { backgroundColor: game.homeColor }]} />
              <Text style={s.teamName} numberOfLines={2}>{game.homeTeam}</Text>
              <TextInput
                style={s.scoreInput}
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={T.textMuted}
                selectionColor={T.accent}
              />
            </View>

            <Text style={s.vs}>–</Text>

            <View style={[s.teamSide, { alignItems: "flex-end" }]}>
              <View style={[s.teamDot, { backgroundColor: game.awayColor }]} />
              <Text style={[s.teamName, { textAlign: "right" }]} numberOfLines={2}>
                {game.awayTeam}
              </Text>
              <TextInput
                style={[s.scoreInput, { textAlign: "right" }]}
                value={awayScore}
                onChangeText={setAwayScore}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={T.textMuted}
                selectionColor={T.accent}
              />
            </View>
          </View>

          <Text style={s.sectionLabel}>MVP</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.mvpScroll}>
            {gamePlayers.map((p) => {
              const selected = mvpId === p.id;
              const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setMvpId(selected ? null : p.id)}
                  style={[s.mvpChip, selected && s.mvpChipSelected]}
                  activeOpacity={0.7}
                >
                  <View style={[s.mvpAvatar, selected && { borderColor: T.accent }]}>
                    <Text style={[s.mvpInitials, selected && { color: T.accent }]}>{initials}</Text>
                  </View>
                  <Text style={[s.mvpName, selected && { color: T.accent }]} numberOfLines={1}>
                    {p.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={20} color="#000" />
            <Text style={s.saveBtnText}>Save Result</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: T.bg },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  closeBtn:{ width: 38, height: 38, borderRadius: 12, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  title:   { color: T.textPrimary, fontSize: 17, fontWeight: "800" },

  content: { paddingHorizontal: 16, paddingBottom: 20 },

  scoreRow:  { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 32 },
  teamSide:  { flex: 1, alignItems: "flex-start" },
  teamDot:   { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  teamName:  { color: T.textSecondary, fontSize: 13, fontWeight: "700", marginBottom: 16, minHeight: 36 },
  scoreInput:{
    color: T.textPrimary, fontSize: 56, fontWeight: "900", letterSpacing: -2,
    borderBottomWidth: 1.5, borderBottomColor: T.border, minWidth: 60, paddingBottom: 4,
  },
  vs: { color: T.textMuted, fontSize: 32, fontWeight: "300", paddingHorizontal: 16, paddingTop: 40 },

  sectionLabel: { color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  mvpScroll:    { gap: 10, paddingRight: 16 },
  mvpChip:      { alignItems: "center", gap: 6, width: 60 },
  mvpChipSelected: {},
  mvpAvatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border, alignItems: "center", justifyContent: "center" },
  mvpInitials:  { color: T.textSecondary, fontSize: 14, fontWeight: "800" },
  mvpName:      { color: T.textMuted, fontSize: 11, fontWeight: "600", textAlign: "center" },

  footer:       { paddingHorizontal: 16, paddingBottom: 8 },
  saveBtn:      { backgroundColor: T.accent, borderRadius: T.radius.pill, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText:  { color: "#000", fontSize: 16, fontWeight: "800" },
});
