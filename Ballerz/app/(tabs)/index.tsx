import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Redirect, useRouter } from "expo-router";
import { useStore } from "../../store";
import { useLastGame, useAppStats } from "../../store/selectors";
import { T } from "../../constants/theme";
import type { Game } from "../../types/games";

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={s.statPill}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

function LastMatchCard({ g }: { g: Game }) {
  const isCompleted = g.status === "FT";
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.leagueRow}>
          <Ionicons name="football-outline" size={11} color={T.textMuted} />
          <Text style={s.leagueTxt}>{g.league}</Text>
        </View>
        <View style={s.ftPill}>
          <Text style={s.ftTxt}>FT</Text>
        </View>
      </View>

      <View style={s.scoreRow}>
        <View style={s.teamSide}>
          <View style={[s.teamDot, { backgroundColor: g.homeColor }]} />
          <Text style={s.teamName}>{g.homeTeam}</Text>
        </View>
        <Text style={s.scoreText}>
          {isCompleted ? `${g.homeScore}` : "–"}
          <Text style={s.scoreSep}> – </Text>
          {isCompleted ? `${g.awayScore}` : "–"}
        </Text>
        <View style={[s.teamSide, { alignItems: "flex-end" }]}>
          <View style={[s.teamDot, { backgroundColor: g.awayColor }]} />
          <Text style={[s.teamName, { textAlign: "right" }]}>{g.awayTeam}</Text>
        </View>
      </View>

      {g.mvp.name !== "—" && (
        <View style={s.cardFooter}>
          <View style={s.mvpRow}>
            <View style={s.mvpBadge}>
              <Text style={s.mvpBadgeTxt}>MVP</Text>
            </View>
            <Text style={s.mvpNameTxt}>{g.mvp.name}</Text>
          </View>
          {g.location ? (
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={10} color={T.textMuted} />
              <Text style={s.locationTxt}>{g.location}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function UpcomingCard({ g }: { g: Game }) {
  return (
    <View style={[s.card, s.upcomingCard]}>
      <View style={s.cardTop}>
        <Text style={s.sectionEyebrow}>UPCOMING</Text>
        {g.date ? (
          <View style={s.dateBadge}>
            <Text style={s.dateBadgeTxt}>{g.date}</Text>
          </View>
        ) : null}
      </View>
      <View style={s.upcomingTeams}>
        <Text style={s.upcomingTeamName}>{g.homeTeam}</Text>
        <Text style={s.upcomingVs}>vs</Text>
        <Text style={[s.upcomingTeamName, { textAlign: "right" }]}>{g.awayTeam}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const lastGame = useLastGame();
  const { gamesCount, playersCount, totalGoals } = useAppStats();
  const games = useStore((s) => s.games);
  const nextGame = games.find((g) => g.status === "Pending") ?? null;

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.logo}>BALLER<Text style={s.logoAccent}>Z</Text></Text>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push("/create-game")}>
            <Ionicons name="add" size={20} color={T.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          <StatPill value={String(gamesCount)}   label="GAMES"   color="#60a5fa" />
          <StatPill value={String(playersCount)}  label="PLAYERS" color="#a78bfa" />
          <StatPill value={String(totalGoals)}    label="GOALS"   color={T.accent} />
        </View>

        {lastGame && (
          <>
            <Text style={[s.sectionEyebrow, { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }]}>
              LAST RESULT
            </Text>
            <LastMatchCard g={lastGame} />
          </>
        )}

        {nextGame && (
          <>
            <Text style={[s.sectionEyebrow, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }]}>
              UPCOMING
            </Text>
            <UpcomingCard g={nextGame} />
          </>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/create-game")} style={s.ctaWrap}>
          <LinearGradient colors={["#f59e0b", "#d97706"]} style={s.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={s.ctaTxt}>Create Game</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  content:{ paddingBottom: 16 },

  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  logo:      { color: T.textPrimary, fontSize: 22, fontWeight: "900", letterSpacing: -1 },
  logoAccent:{ color: T.accent },
  headerBtn: { width: 36, height: 36, borderRadius: T.radius.badge, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center" },

  statsRow:  { flexDirection: "row", marginHorizontal: 16, gap: 8 },
  statPill:  { flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: T.radius.pill, paddingVertical: 14, alignItems: "center" },
  statVal:   { fontSize: 22, fontWeight: "800" },
  statLbl:   { fontSize: 8, color: T.textMuted, fontWeight: "700", letterSpacing: 1, marginTop: 2 },

  sectionEyebrow: { fontSize: 9, fontWeight: "800", letterSpacing: 2, color: T.textMuted, textTransform: "uppercase" },

  card:       { marginHorizontal: 16, backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 14 },
  upcomingCard:{ marginTop: 0 },
  cardTop:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  leagueRow:  { flexDirection: "row", alignItems: "center", gap: 5 },
  leagueTxt:  { color: T.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  ftPill:     { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ftTxt:      { color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  scoreRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  teamSide:   { flex: 1 },
  teamDot:    { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  teamName:   { color: T.textSecondary, fontSize: 13, fontWeight: "700" },
  scoreText:  { color: T.textPrimary, fontSize: T.scoreSize, fontWeight: "900", letterSpacing: -1 },
  scoreSep:   { color: T.textMuted, fontWeight: "300" },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border },
  mvpRow:     { flexDirection: "row", alignItems: "center", gap: 8 },
  mvpBadge:   { backgroundColor: T.accentMuted, borderWidth: 1, borderColor: T.accentBorder, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  mvpBadgeTxt:{ color: T.accent, fontSize: 9, fontWeight: "800" },
  mvpNameTxt: { color: T.textSecondary, fontSize: 12, fontWeight: "700" },
  locationRow:{ flexDirection: "row", alignItems: "center", gap: 4 },
  locationTxt:{ color: T.textMuted, fontSize: 10 },

  dateBadge:       { backgroundColor: T.accentMuted, borderWidth: 1, borderColor: T.accentBorder, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dateBadgeTxt:    { color: T.accent, fontSize: 9, fontWeight: "800" },
  upcomingTeams:   { flexDirection: "row", alignItems: "center" },
  upcomingTeamName:{ flex: 1, color: T.textPrimary, fontSize: 15, fontWeight: "800" },
  upcomingVs:      { color: T.textMuted, fontSize: 11, fontWeight: "700", paddingHorizontal: 12 },

  ctaWrap: { marginHorizontal: 16, marginTop: 20, borderRadius: T.radius.pill, overflow: "hidden" },
  cta:     { paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaTxt:  { color: "#000", fontSize: 15, fontWeight: "800" },
});
