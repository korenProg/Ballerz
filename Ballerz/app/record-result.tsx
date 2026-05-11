import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../store";
import { T } from "../constants/theme";

export default function RecordResultScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { games, players, updateGame, setMvp } = useStore();
  const game = games.find((g) => g.id === gameId);

  const [homeScore, setHomeScore] = useState(
    game?.status === "FT" ? String(game.homeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    game?.status === "FT" ? String(game.awayScore) : ""
  );
  const [mvpId, setMvpId] = useState<string | null>(
    game?.status === "FT" && game.mvp.name !== "—"
      ? players.find((p) => p.name === game.mvp.name)?.id ?? null
      : null
  );

  if (!game) return null;

  const homePlayers = (game.homePlayers ?? [])
    .map((p) => players.find((pl) => pl.id === p.id))
    .filter(Boolean) as typeof players;
  const awayPlayers = (game.awayPlayers ?? [])
    .map((p) => players.find((pl) => pl.id === p.id))
    .filter(Boolean) as typeof players;
  const allPlayers = [...homePlayers, ...awayPlayers];

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

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const isHome = (id: string) => homePlayers.some((p) => p.id === id);

  return (
    <View style={s.root}>
      {/* Ambient gradient from both team colors */}
      <LinearGradient
        colors={[game.homeColor + "33", "transparent"]}
        style={s.ambientLeft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[game.awayColor + "33", "transparent"]}
        style={s.ambientRight}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-down" size={20} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {game.status === "FT" ? "Edit Result" : "Record Result"}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Score card — broadcast style */}
          <View style={s.scoreCard}>
            {/* Home row */}
            <View style={s.teamRow}>
              <View style={s.teamRowLeft}>
                <View style={[s.teamBadge, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
                  <Ionicons name="shield" size={16} color={game.homeColor} />
                </View>
                <Text style={s.teamRowName} numberOfLines={1}>{game.homeTeam}</Text>
              </View>
              <View style={[s.scoreBox, { borderColor: game.homeColor + "55" }]}>
                <TextInput
                  style={[s.scoreBoxInput, { color: game.homeColor }]}
                  value={homeScore}
                  onChangeText={setHomeScore}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={game.homeColor + "33"}
                  selectionColor={game.homeColor}
                />
              </View>
            </View>

            <View style={s.rowDivider} />

            {/* Away row */}
            <View style={s.teamRow}>
              <View style={s.teamRowLeft}>
                <View style={[s.teamBadge, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
                  <Ionicons name="shield" size={16} color={game.awayColor} />
                </View>
                <Text style={s.teamRowName} numberOfLines={1}>{game.awayTeam}</Text>
              </View>
              <View style={[s.scoreBox, { borderColor: game.awayColor + "55" }]}>
                <TextInput
                  style={[s.scoreBoxInput, { color: game.awayColor }]}
                  value={awayScore}
                  onChangeText={setAwayScore}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={game.awayColor + "33"}
                  selectionColor={game.awayColor}
                />
              </View>
            </View>
          </View>

          {/* MVP section */}
          {allPlayers.length > 0 && (
            <View style={s.mvpSection}>
              <View style={s.mvpHeader}>
                <Ionicons name="star" size={11} color={T.accent} />
                <Text style={s.mvpHeaderTxt}>MVP</Text>
                {mvpId && (
                  <TouchableOpacity onPress={() => setMvpId(null)}>
                    <Text style={s.mvpClearTxt}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.mvpGrid}>
                {allPlayers.map((p) => {
                  const selected = mvpId === p.id;
                  const teamColor = isHome(p.id) ? game.homeColor : game.awayColor;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setMvpId(selected ? null : p.id)}
                      activeOpacity={0.7}
                      style={[
                        s.mvpCard,
                        selected && { borderColor: teamColor, backgroundColor: teamColor + "14" },
                      ]}
                    >
                      <View style={[
                        s.mvpAvatar,
                        { borderColor: selected ? teamColor : T.border },
                        selected && { backgroundColor: teamColor + "20" },
                      ]}>
                        <Text style={[s.mvpInitials, { color: selected ? teamColor : T.textMuted }]}>
                          {initials(p.name)}
                        </Text>
                      </View>
                      <Text
                        style={[s.mvpName, selected && { color: teamColor, fontWeight: "800" }]}
                        numberOfLines={1}
                      >
                        {p.name.split(" ")[0]}
                      </Text>
                      <View style={[s.mvpTeamDot, { backgroundColor: teamColor }]} />
                      {selected && (
                        <View style={[s.mvpCheckBadge, { backgroundColor: teamColor }]}>
                          <Ionicons name="star" size={8} color="#000" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#000" />
            <Text style={s.saveBtnTxt}>Confirm Result</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  ambientLeft: {
    position: "absolute", top: 0, left: 0,
    width: "60%", height: 300,
  },
  ambientRight: {
    position: "absolute", top: 0, right: 0,
    width: "60%", height: 300,
  },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: T.textPrimary, fontSize: 16, fontWeight: "800" },

  content: { paddingHorizontal: 20, paddingBottom: 32 },

  // Score card
  scoreCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: "#0d0e1a",
    marginBottom: 16,
    overflow: "hidden",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  teamRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  teamBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  teamRowName: {
    color: T.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: T.border,
    marginHorizontal: 16,
  },
  scoreBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "#07080f",
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBoxInput: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    padding: 0,
    minWidth: 40,
    textAlign: "center",
  },

  // MVP
  mvpSection: {
    backgroundColor: "#0d0e1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
  },
  mvpHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 14,
  },
  mvpHeaderTxt: {
    color: T.textMuted, fontSize: 9, fontWeight: "800",
    letterSpacing: 2, flex: 1,
  },
  mvpClearTxt: { color: T.accent, fontSize: 12, fontWeight: "700" },

  mvpGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  mvpCard: {
    width: "22%", alignItems: "center", gap: 6,
    borderRadius: 14, borderWidth: 1.5, borderColor: "transparent",
    paddingVertical: 10, paddingHorizontal: 4,
    position: "relative",
  },
  mvpAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  mvpInitials: { fontSize: 13, fontWeight: "800" },
  mvpName: {
    color: T.textMuted, fontSize: 10, fontWeight: "600",
    textAlign: "center",
  },
  mvpTeamDot: {
    width: 5, height: 5, borderRadius: 2.5,
  },
  mvpCheckBadge: {
    position: "absolute", top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },

  // Footer
  footer: {
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  saveBtn: {
    backgroundColor: T.accent, borderRadius: T.radius.pill,
    paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  saveBtnDisabled: { opacity: 0.3 },
  saveBtnTxt: { color: "#000", fontSize: 16, fontWeight: "800" },
});
