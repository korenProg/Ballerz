import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Game, Player } from "../../types";

// ─── Static data (mirrors players.tsx + games.tsx) ────────────────────────────

const PLAYERS: Player[] = [
  { id: "1", name: "Neymar Jr",   ovr: 92, position: "FW", goals: 18, assists: 11, mvps: 7, isMvp: true, foot: "R", form: "hot",     pac: 91, sho: 87, pas: 84, dri: 95, def: 37, phy: 68 },
  { id: "2", name: "Mbappe",      ovr: 88, position: "FW", goals: 22, assists: 6,  mvps: 5,              foot: "R", form: "hot",     pac: 96, sho: 90, pas: 78, dri: 92, def: 36, phy: 76 },
  { id: "3", name: "Saka",        ovr: 84, position: "MF", goals: 10, assists: 14, mvps: 3,              foot: "L", form: "hot",     pac: 82, sho: 78, pas: 82, dri: 86, def: 61, phy: 66 },
  { id: "4", name: "Pedri",       ovr: 87, position: "MF", goals: 7,  assists: 13, mvps: 4,              foot: "R", form: "neutral", pac: 77, sho: 75, pas: 88, dri: 90, def: 65, phy: 64 },
  { id: "5", name: "Rüdiger",     ovr: 75, position: "DF", goals: 3,  assists: 2,  mvps: 1,              foot: "R", form: "cold",    pac: 78, sho: 42, pas: 60, dri: 58, def: 86, phy: 87 },
  { id: "6", name: "Alisson",     ovr: 63, position: "GK", goals: 0,  assists: 1,  mvps: 2,              foot: "R", form: "neutral", pac: 50, sho: 20, pas: 65, dri: 42, def: 88, phy: 78 },
  { id: "7", name: "Vinicius Jr", ovr: 90, position: "FW", goals: 20, assists: 9,  mvps: 6,              foot: "L", form: "hot",     pac: 93, sho: 84, pas: 77, dri: 94, def: 30, phy: 68 },
  { id: "8", name: "Rodri",       ovr: 82, position: "MF", goals: 5,  assists: 8,  mvps: 2,              foot: "R", form: "neutral", pac: 72, sho: 65, pas: 85, dri: 80, def: 82, phy: 85 },
];

const GAMES: Game[] = [
  {
    id: "g1",
    league: "Ballerz League",
    status: "FT",
    homeTeam: "Barcelona FC",
    awayTeam: "Real Madrid",
    homeScore: 3,
    awayScore: 2,
    mvp: { name: "Neymar Jr", stat: "2 goals · 1 ast" },
    homeColor: "#cc0000",
    awayColor: "#0055cc",
    location: "Camp Nou",
    date: "Tue, Apr 8 · 21:00",
    homeCaptain: "Neymar Jr",
    awayCaptain: "Vinicius Jr",
    homePlayers: [
      { id: "h1b", name: "Neymar Jr",    position: "FW" },
      { id: "h2b", name: "Lewandowski",  position: "FW" },
      { id: "h3b", name: "Pedri",        position: "MF" },
      { id: "h4b", name: "Kounde",       position: "DF" },
      { id: "h5b", name: "Ter Stegen",   position: "GK" },
    ],
    awayPlayers: [
      { id: "a1b", name: "Vinicius Jr",  position: "FW" },
      { id: "a2b", name: "Bellingham",   position: "MF" },
      { id: "a3b", name: "Valverde",     position: "MF" },
      { id: "a4b", name: "Militao",      position: "DF" },
      { id: "a5b", name: "Alisson",      position: "GK" },
    ],
    goalEvents: [
      { id: "e1", playerId: "h1b", playerName: "Neymar Jr",   team: "home", minute: 12, type: "goal" },
      { id: "e2", playerId: "h3b", playerName: "Pedri",       team: "home", minute: 12, type: "assist" },
      { id: "e3", playerId: "a1b", playerName: "Vinicius Jr", team: "away", minute: 29, type: "goal" },
      { id: "e4", playerId: "h1b", playerName: "Neymar Jr",   team: "home", minute: 55, type: "goal" },
      { id: "e5", playerId: "a2b", playerName: "Bellingham",  team: "away", minute: 63, type: "goal" },
      { id: "e6", playerId: "h2b", playerName: "Lewandowski", team: "home", minute: 78, type: "goal" },
    ],
  },
  {
    id: "g2",
    league: "Ballerz League",
    status: "FT",
    homeTeam: "PSG",
    awayTeam: "Bayern",
    homeScore: 2,
    awayScore: 2,
    mvp: { name: "Mbappe", stat: "2 goals" },
    homeColor: "#0055cc",
    awayColor: "#cc0000",
    location: "Parc des Princes",
    date: "Wed, Apr 9 · 21:00",
    homeCaptain: "Mbappe",
    awayCaptain: "Kane",
    homePlayers: [
      { id: "hp1", name: "Mbappe",      position: "FW" },
      { id: "hp2", name: "Asensio",     position: "MF" },
      { id: "hp3", name: "Vitinha",     position: "MF" },
      { id: "hp4", name: "Marquinhos", position: "DF" },
      { id: "hp5", name: "Donnarumma", position: "GK" },
    ],
    awayPlayers: [
      { id: "ap1", name: "Kane",        position: "FW" },
      { id: "ap2", name: "Muller",      position: "MF" },
      { id: "ap3", name: "Kimmich",     position: "MF" },
      { id: "ap4", name: "Upamecano",  position: "DF" },
      { id: "ap5", name: "Neuer",       position: "GK" },
    ],
    goalEvents: [
      { id: "f1", playerId: "hp1", playerName: "Mbappe", team: "home", minute: 18, type: "goal" },
      { id: "f2", playerId: "ap1", playerName: "Kane",   team: "away", minute: 34, type: "goal" },
      { id: "f3", playerId: "ap2", playerName: "Muller", team: "away", minute: 34, type: "assist" },
      { id: "f4", playerId: "hp1", playerName: "Mbappe", team: "home", minute: 71, type: "goal" },
      { id: "f5", playerId: "ap1", playerName: "Kane",   team: "away", minute: 88, type: "goal" },
    ],
  },
  {
    id: "g3",
    league: "Ballerz League",
    status: "FT",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona FC",
    homeScore: 3,
    awayScore: 1,
    mvp: { name: "Vinicius Jr", stat: "2 goals · 1 ast" },
    homeColor: "#0055cc",
    awayColor: "#cc0000",
    location: "Santiago Bernabéu",
    date: "Sat, Mar 29 · 21:00",
    homeCaptain: "Vinicius Jr",
    awayCaptain: "Neymar Jr",
    homePlayers: [
      { id: "r1", name: "Vinicius Jr", position: "FW" },
      { id: "r2", name: "Bellingham",  position: "MF" },
      { id: "r3", name: "Valverde",    position: "MF" },
      { id: "r4", name: "Militao",     position: "DF" },
      { id: "r5", name: "Courtois",    position: "GK" },
    ],
    awayPlayers: [
      { id: "b1", name: "Neymar Jr",   position: "FW" },
      { id: "b2", name: "Lewandowski", position: "FW" },
      { id: "b3", name: "Pedri",       position: "MF" },
      { id: "b4", name: "Kounde",      position: "DF" },
      { id: "b5", name: "Ter Stegen",  position: "GK" },
    ],
    goalEvents: [
      { id: "g1", playerId: "r1", playerName: "Vinicius Jr", team: "home", minute: 10, type: "goal" },
      { id: "g2", playerId: "r2", playerName: "Bellingham",  team: "home", minute: 10, type: "assist" },
      { id: "g3", playerId: "b1", playerName: "Neymar Jr",   team: "away", minute: 33, type: "goal" },
      { id: "g4", playerId: "r1", playerName: "Vinicius Jr", team: "home", minute: 67, type: "goal" },
      { id: "g5", playerId: "r2", playerName: "Bellingham",  team: "home", minute: 84, type: "goal" },
    ],
  },
  {
    id: "g4",
    league: "Ballerz League",
    status: "FT",
    homeTeam: "PSG",
    awayTeam: "Real Madrid",
    homeScore: 1,
    awayScore: 2,
    mvp: { name: "Bellingham", stat: "1 goal · 1 ast" },
    homeColor: "#0055cc",
    awayColor: "#cccccc",
    location: "Parc des Princes",
    date: "Tue, Apr 1 · 21:00",
    homeCaptain: "Mbappe",
    awayCaptain: "Bellingham",
    homePlayers: [
      { id: "pp1", name: "Mbappe",      position: "FW" },
      { id: "pp2", name: "Asensio",     position: "MF" },
      { id: "pp3", name: "Vitinha",     position: "MF" },
      { id: "pp4", name: "Marquinhos", position: "DF" },
      { id: "pp5", name: "Donnarumma", position: "GK" },
    ],
    awayPlayers: [
      { id: "rr1", name: "Vinicius Jr", position: "FW" },
      { id: "rr2", name: "Bellingham",  position: "MF" },
      { id: "rr3", name: "Rodri",       position: "MF" },
      { id: "rr4", name: "Militao",     position: "DF" },
      { id: "rr5", name: "Courtois",    position: "GK" },
    ],
    goalEvents: [
      { id: "h1", playerId: "rr2", playerName: "Bellingham",  team: "away", minute: 22, type: "goal" },
      { id: "h2", playerId: "rr1", playerName: "Vinicius Jr", team: "away", minute: 22, type: "assist" },
      { id: "h3", playerId: "pp1", playerName: "Mbappe",      team: "home", minute: 45, type: "goal" },
      { id: "h4", playerId: "rr2", playerName: "Bellingham",  team: "away", minute: 78, type: "goal" },
    ],
  },
];

// ─── Computed helpers ─────────────────────────────────────────────────────────

type LeaderboardKey = "Goals" | "Assists" | "MVPs";

interface WinRateEntry {
  name: string;
  wins: number;
  played: number;
  pct: number;
}

interface RivalryRecord {
  key: string;
  team1: string;
  team2: string;
  count: number;
  t1Wins: number;
  draws: number;
  t2Wins: number;
}

interface PotmEntry {
  name: string;
  goals: number;
  assists: number;
  total: number;
}

function computeWinRates(games: Game[]): WinRateEntry[] {
  const map: Record<string, { wins: number; played: number }> = {};
  for (const g of games) {
    if (g.status !== "FT") continue;
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;
    const process = (players: typeof g.homePlayers, won: boolean) => {
      if (!players) return;
      for (const p of players) {
        if (!map[p.name]) map[p.name] = { wins: 0, played: 0 };
        map[p.name].played++;
        if (won) map[p.name].wins++;
      }
    };
    process(g.homePlayers, homeWon);
    process(g.awayPlayers, awayWon);
  }
  return Object.entries(map)
    .map(([name, s]) => ({ name, ...s, pct: s.played > 0 ? s.wins / s.played : 0 }))
    .sort((a, b) => b.pct - a.pct || b.played - a.played);
}

function computePOTM(games: Game[]): PotmEntry | null {
  const tally: Record<string, { goals: number; assists: number }> = {};
  for (const g of games) {
    if (g.status !== "FT" || !g.goalEvents) continue;
    for (const ev of g.goalEvents) {
      if (!tally[ev.playerName]) tally[ev.playerName] = { goals: 0, assists: 0 };
      if (ev.type === "goal") tally[ev.playerName].goals++;
      else tally[ev.playerName].assists++;
    }
  }
  const entries = Object.entries(tally).map(([name, s]) => ({ name, ...s, total: s.goals + s.assists }));
  if (!entries.length) return null;
  entries.sort((a, b) => b.total - a.total || b.goals - a.goals);
  return entries[0];
}

function computeRivalries(games: Game[]): RivalryRecord[] {
  const map: Record<string, { team1: string; team2: string; t1Wins: number; draws: number; t2Wins: number; count: number }> = {};
  for (const g of games) {
    if (g.status !== "FT") continue;
    const sorted = [g.homeTeam, g.awayTeam].sort();
    const [t1, t2] = sorted;
    const key = `${t1}||${t2}`;
    if (!map[key]) map[key] = { team1: t1, team2: t2, t1Wins: 0, draws: 0, t2Wins: 0, count: 0 };
    map[key].count++;
    if (g.homeScore === g.awayScore) {
      map[key].draws++;
    } else {
      const winner = g.homeScore > g.awayScore ? g.homeTeam : g.awayTeam;
      if (winner === t1) map[key].t1Wins++; else map[key].t2Wins++;
    }
  }
  return Object.entries(map).map(([key, r]) => ({ key, ...r })).sort((a, b) => b.count - a.count);
}

interface DreamTeam {
  gks: Player[];
  dfs: Player[];
  mfs: Player[];
  fws: Player[];
}

function computeDreamTeam(players: Player[]): DreamTeam {
  const sorted = [...players].sort((a, b) => b.ovr - a.ovr);
  const pick = (pos: string, n: number) => sorted.filter((p) => p.position === pos).slice(0, n);
  return { gks: pick("GK", 1), dfs: pick("DF", 2), mfs: pick("MF", 3), fws: pick("FW", 3) };
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function ovrColor(ovr: number): string {
  if (ovr >= 90) return "#f5c518";
  if (ovr >= 80) return "#c9a84c";
  if (ovr >= 70) return "#b0b0b0";
  return "#cd7f32";
}

function winPctColor(pct: number): string {
  if (pct >= 0.7) return "#4cde80";
  if (pct >= 0.4) return "#f5c518";
  return "#e05555";
}

// ─── Stats Screen ─────────────────────────────────────────────────────────────

const LB_TABS: LeaderboardKey[] = ["Goals", "Assists", "MVPs"];
const RANK_COLORS = ["#f5c518", "#b0b0b0", "#cd7f32"];
const RANK_ICONS: ("trophy" | "medal" | "ribbon")[] = ["trophy", "medal", "ribbon"];

export default function StatsScreen() {
  const [lbTab, setLbTab] = useState<LeaderboardKey>("Goals");

  const leaderboard = useMemo(() => {
    const sorted = [...PLAYERS].sort((a, b) => {
      const val = (p: Player) => lbTab === "Goals" ? p.goals : lbTab === "Assists" ? p.assists : p.mvps;
      return val(b) - val(a);
    });
    return sorted.slice(0, 5).map((p) => ({
      ...p,
      value: lbTab === "Goals" ? p.goals : lbTab === "Assists" ? p.assists : p.mvps,
    }));
  }, [lbTab]);

  const maxValue = leaderboard[0]?.value ?? 1;

  const winRates = useMemo(() => computeWinRates(GAMES), []);
  const potm      = useMemo(() => computePOTM(GAMES), []);
  const rivalries = useMemo(() => computeRivalries(GAMES), []);
  const dreamTeam = useMemo(() => computeDreamTeam(PLAYERS), []);

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Stats</Text>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeTxt}>2025–26</Text>
          </View>
        </View>

        {/* ── Leaderboard ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Leaderboard</Text>
          <View style={s.tabRow}>
            {LB_TABS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setLbTab(t)}
                style={[s.tab, lbTab === t && s.tabActive]}
                activeOpacity={0.75}
              >
                <Text style={[s.tabTxt, lbTab === t && s.tabTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {leaderboard.map((p, i) => (
            <View key={p.id} style={s.lbRow}>
              <View style={s.lbRankBox}>
                {i < 3 ? (
                  <Ionicons name={RANK_ICONS[i]} size={16} color={RANK_COLORS[i]} />
                ) : (
                  <Text style={s.lbRankNum}>{i + 1}</Text>
                )}
              </View>
              <View style={s.lbInfo}>
                <Text style={s.lbName}>{p.name}</Text>
                <Text style={s.lbPos}>{p.position}</Text>
              </View>
              <View style={s.lbBarWrap}>
                <View
                  style={[
                    s.lbBar,
                    { width: `${(p.value / maxValue) * 100}%` as `${number}%`, backgroundColor: ovrColor(p.ovr) },
                  ]}
                />
              </View>
              <Text style={[s.lbValue, { color: ovrColor(p.ovr) }]}>{p.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Win Rate ────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Win Rate</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.winRateRow}
          >
            {winRates.slice(0, 10).map((wr) => {
              const pct = Math.round(wr.pct * 100);
              const col = winPctColor(wr.pct);
              return (
                <View key={wr.name} style={s.winCard}>
                  <Text style={[s.winPct, { color: col }]}>{pct}%</Text>
                  <Text style={s.winName} numberOfLines={1}>
                    {wr.name.split(" ")[0]}
                  </Text>
                  <Text style={s.winGames}>
                    {wr.wins}W / {wr.played}G
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Player of the Month ─────────────────────────────────────────── */}
        {potm && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Player of the Month</Text>
            <LinearGradient
              colors={["#2a1f00", "#1a1200", "#0d0d0d"]}
              style={s.potmCard}
            >
              <View style={s.potmLeft}>
                <Text style={s.potmBadge}>APRIL 2026</Text>
                <Text style={s.potmName}>{potm.name}</Text>
                <View style={s.potmStats}>
                  <View style={s.potmStat}>
                    <Ionicons name="football" size={13} color="#f5c518" />
                    <Text style={s.potmStatTxt}>{potm.goals} goals</Text>
                  </View>
                  <View style={s.potmStat}>
                    <Ionicons name="footsteps-outline" size={13} color="#888" />
                    <Text style={s.potmStatTxt}>{potm.assists} ast</Text>
                  </View>
                </View>
              </View>
              <View style={s.potmRight}>
                <View style={s.potmTotalBadge}>
                  <Text style={s.potmTotalNum}>{potm.total}</Text>
                  <Text style={s.potmTotalLbl}>G+A</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Top Rivalries ───────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top Rivalries</Text>
          {rivalries.slice(0, 4).map((r) => (
            <View key={r.key} style={s.rivalCard}>
              <View style={s.rivalTeams}>
                <Text style={s.rivalTeam} numberOfLines={1}>
                  {r.team1}
                </Text>
                <View style={s.rivalVsChip}>
                  <Text style={s.rivalVs}>vs</Text>
                </View>
                <Text style={[s.rivalTeam, s.rivalTeamRight]} numberOfLines={1}>
                  {r.team2}
                </Text>
              </View>
              <View style={s.rivalFooter}>
                <Text style={s.rivalH2H}>
                  {r.t1Wins}W &middot; {r.draws}D &middot; {r.t2Wins}W
                </Text>
                <View style={s.rivalCountBadge}>
                  <Ionicons name="football-outline" size={10} color="#555" />
                  <Text style={s.rivalCount}>
                    {r.count} {r.count === 1 ? "match" : "matches"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Best XI ─────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Best XI</Text>
          <LinearGradient colors={["#0a2a18", "#061510", "#040c09"]} style={s.pitch}>
            {(
              [dreamTeam.fws, dreamTeam.mfs, dreamTeam.dfs, dreamTeam.gks] as Player[][]
            ).map((row, ri) =>
              row.length > 0 ? (
                <View key={ri} style={s.pitchRow}>
                  {row.map((p) => (
                    <View key={p.id} style={s.pitchPlayer}>
                      <View style={[s.pitchOvr, { borderColor: ovrColor(p.ovr) }]}>
                        <Text style={[s.pitchOvrTxt, { color: ovrColor(p.ovr) }]}>
                          {p.ovr}
                        </Text>
                      </View>
                      <Text style={s.pitchName} numberOfLines={1}>
                        {p.name.split(" ")[0]}
                      </Text>
                      <Text style={s.pitchPos}>{p.position}</Text>
                    </View>
                  ))}
                </View>
              ) : null
            )}
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: "#0a0a0a" },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // Header
  header:         { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0a0a0a" },
  headerTitle:    { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  headerBadge:    { backgroundColor: "#1e1e1e", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#333" },
  headerBadgeTxt: { color: "#888", fontSize: 12, fontWeight: "600" },

  // Sections
  section:      { marginHorizontal: 16, marginTop: 22 },
  sectionTitle: { color: "#666", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 },

  // Leaderboard tabs
  tabRow:      { flexDirection: "row", gap: 8, marginBottom: 14 },
  tab:         { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: "#161616", borderWidth: 1, borderColor: "#2a2a2a" },
  tabActive:   { backgroundColor: "#f5c518", borderColor: "#f5c518" },
  tabTxt:      { color: "#666", fontSize: 13, fontWeight: "600" },
  tabTxtActive:{ color: "#000" },

  // Leaderboard rows
  lbRow:      { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#141414" },
  lbRankBox:  { width: 30, alignItems: "center" },
  lbRankNum:  { color: "#444", fontSize: 13, fontWeight: "700" },
  lbInfo:     { flex: 1, marginLeft: 8 },
  lbName:     { color: "#fff", fontSize: 14, fontWeight: "600" },
  lbPos:      { color: "#444", fontSize: 11, marginTop: 1 },
  lbBarWrap:  { width: 100, height: 4, backgroundColor: "#1e1e1e", borderRadius: 2, overflow: "hidden", marginRight: 10 },
  lbBar:      { height: 4, borderRadius: 2 },
  lbValue:    { width: 28, fontSize: 16, fontWeight: "800", textAlign: "right" },

  // Win Rate
  winRateRow: { gap: 10, paddingVertical: 4 },
  winCard:    { backgroundColor: "#111", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, alignItems: "center", minWidth: 76, borderWidth: 1, borderColor: "#1e1e1e" },
  winPct:     { fontSize: 20, fontWeight: "800" },
  winName:    { color: "#bbb", fontSize: 11, fontWeight: "600", marginTop: 4, maxWidth: 68, textAlign: "center" },
  winGames:   { color: "#444", fontSize: 10, marginTop: 3 },

  // Player of the Month
  potmCard:       { borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#3a2e00" },
  potmLeft:       { flex: 1 },
  potmBadge:      { color: "#f5c518", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  potmName:       { color: "#fff", fontSize: 22, fontWeight: "800" },
  potmStats:      { flexDirection: "row", gap: 16, marginTop: 10 },
  potmStat:       { flexDirection: "row", alignItems: "center", gap: 5 },
  potmStatTxt:    { color: "#999", fontSize: 13 },
  potmRight:      { marginLeft: 20 },
  potmTotalBadge: { backgroundColor: "rgba(245,197,24,0.10)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#3a2e00" },
  potmTotalNum:   { color: "#f5c518", fontSize: 30, fontWeight: "800" },
  potmTotalLbl:   { color: "#f5c518", fontSize: 10, fontWeight: "700", letterSpacing: 1, opacity: 0.7, marginTop: 2 },

  // Rivalries
  rivalCard:       { backgroundColor: "#111", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#1e1e1e" },
  rivalTeams:      { flexDirection: "row", alignItems: "center" },
  rivalTeam:       { flex: 1, color: "#fff", fontSize: 14, fontWeight: "700" },
  rivalTeamRight:  { textAlign: "right" },
  rivalVsChip:     { backgroundColor: "#1e1e1e", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginHorizontal: 8 },
  rivalVs:         { color: "#555", fontSize: 11, fontWeight: "600" },
  rivalFooter:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  rivalH2H:        { color: "#aaa", fontSize: 13, fontWeight: "600" },
  rivalCountBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1a1a1a", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  rivalCount:      { color: "#555", fontSize: 11 },

  // Dream Team pitch
  pitch:       { borderRadius: 16, padding: 18, gap: 16, borderWidth: 1, borderColor: "#1a3322" },
  pitchRow:    { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  pitchPlayer: { alignItems: "center", gap: 5, minWidth: 68 },
  pitchOvr:    { width: 46, height: 46, borderRadius: 23, borderWidth: 2, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  pitchOvrTxt: { fontSize: 15, fontWeight: "800" },
  pitchName:   { color: "#ccc", fontSize: 11, fontWeight: "600", maxWidth: 68, textAlign: "center" },
  pitchPos:    { color: "#3a6644", fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
});
