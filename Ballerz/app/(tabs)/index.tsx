import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

// ─── Static Data ──────────────────────────────────────────────────────────────

const SEASON = "2025–26";

const appStats = [
  { label: "Games",   value: "16", accent: "#4a9eff" },
  { label: "Players", value: "21", accent: "#a78bfa" },
  { label: "Goals",   value: "84", accent: "#f5c518" },
];

const lastGame = {
  league:    "Ballerz League",
  status:    "FT" as GameStatus,
  homeTeam:  "Barcelona FC",
  awayTeam:  "Real Madrid",
  homeScore: 3,
  awayScore: 2,
  homeColor: "#cc0000",
  awayColor: "#0055cc",
  date:      "Tue, Apr 8 · 21:00",
  location:  "Camp Nou",
  mvp:       { name: "Neymar Jr", stat: "2 goals · 1 ast" },
};

const upcomingGame = {
  homeTeam:  "PSG",
  awayTeam:  "Bayern",
  homeColor: "#0055cc",
  awayColor: "#cc0000",
  date:      "Thu, Apr 17",
  time:      "21:00",
  location:  "Parc des Princes",
};

const lastMVP = {
  name:     "Neymar Jr",
  position: "FW",
  stat:     "2 goals · 1 ast",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type GameStatus = "FT" | "Live" | "Pending";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<GameStatus, { label: string; bg: string; color: string; live: boolean }> = {
  FT:      { label: "FT",       bg: "#1c1c1c", color: "#666",    live: false },
  Live:    { label: "LIVE",     bg: "#0a2010", color: "#00e676", live: true  },
  Pending: { label: "UPCOMING", bg: "#1a1400", color: "#f5c518", live: false },
};

function StatusPill({ status }: { status: GameStatus }) {
  const cfg = STATUS_MAP[status];
  return (
    <View style={[pill.wrap, { backgroundColor: cfg.bg }]}>
      {cfg.live && <View style={pill.dot} />}
      <Text style={[pill.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, gap: 5 },
  dot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00e676" },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
});

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard() {
  const g = lastGame;
  return (
    <View style={s.matchCard}>
      {/* Card header */}
      <View style={s.cardRow}>
        <View style={s.leagueRow}>
          <Ionicons name="football-outline" size={12} color="#555" />
          <Text style={s.leagueText}>{g.league}</Text>
        </View>
        <StatusPill status={g.status} />
      </View>

      <View style={s.hairline} />

      {/* Score */}
      <View style={s.scoreRow}>
        <View style={s.teamCol}>
          <View style={[s.teamBadge, { borderColor: g.homeColor, backgroundColor: g.homeColor + "1a" }]}>
            <Ionicons name="shield" size={20} color={g.homeColor} />
          </View>
          <Text style={s.teamName} numberOfLines={2}>{g.homeTeam}</Text>
        </View>

        <View style={s.scoreCenter}>
          <Text style={s.scoreNum}>{g.homeScore}</Text>
          <Text style={s.scoreSep}>–</Text>
          <Text style={s.scoreNum}>{g.awayScore}</Text>
        </View>

        <View style={s.teamCol}>
          <View style={[s.teamBadge, { borderColor: g.awayColor, backgroundColor: g.awayColor + "1a" }]}>
            <Ionicons name="shield" size={20} color={g.awayColor} />
          </View>
          <Text style={s.teamName} numberOfLines={2}>{g.awayTeam}</Text>
        </View>
      </View>

      <View style={s.hairline} />

      {/* Meta row */}
      <View style={s.matchMeta}>
        <View style={s.metaItem}>
          <Ionicons name="location-outline" size={11} color="#3d3d3d" />
          <Text style={s.metaText}>{g.location}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={11} color="#3d3d3d" />
          <Text style={s.metaText}>{g.date}</Text>
        </View>
      </View>

      {/* MVP row */}
      <View style={s.cardMvpRow}>
        <Ionicons name="star" size={12} color="#f5c518" />
        <Text style={s.cardMvpLabel}>MVP</Text>
        <Text style={s.cardMvpName}>{g.mvp.name}</Text>
        <Text style={s.cardMvpStat}>{g.mvp.stat}</Text>
      </View>
    </View>
  );
}

// ─── MVP Hero Card ────────────────────────────────────────────────────────────

function MVPHeroCard() {
  return (
    <View style={s.mvpCard}>
      {/* Glow layers */}
      <View style={[s.mvpGlow, { width: 280, height: 280, borderRadius: 140, opacity: 0.04, top: -40 }]} />
      <View style={[s.mvpGlow, { width: 190, height: 190, borderRadius: 95,  opacity: 0.07, top: 0   }]} />
      <View style={[s.mvpGlow, { width: 110, height: 110, borderRadius: 55,  opacity: 0.12, top: 45  }]} />

      <Image
        source={require("@/assets/images/playerDefaultPic.png")}
        style={s.mvpImage}
        resizeMode="contain"
      />

      <LinearGradient colors={["rgba(0,0,0,0.85)", "transparent"]} style={s.mvpFadeTop} />
      <LinearGradient colors={["transparent", "#0a0a0a"]}          style={s.mvpFadeBottom} />

      {/* Top labels */}
      <View style={s.mvpTopLabels}>
        <Text style={s.mvpSub}>Last Match</Text>
        <Text style={s.mvpTitle}>MVP</Text>
      </View>

      {/* Bottom info */}
      <View style={s.mvpBottom}>
        <Text style={s.mvpName}>{lastMVP.name}</Text>
        <View style={s.mvpMetaRow}>
          <View style={s.mvpPosBadge}>
            <Text style={s.mvpPosText}>{lastMVP.position}</Text>
          </View>
          <Text style={s.mvpStatText}>{lastMVP.stat}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Upcoming Card ────────────────────────────────────────────────────────────

function UpcomingCard() {
  const g = upcomingGame;
  return (
    <View style={s.upcomingCard}>
      <View style={s.upcomingHeader}>
        <Text style={s.upcomingLabel}>NEXT MATCH</Text>
        <View style={s.upcomingDateBadge}>
          <Ionicons name="calendar-outline" size={11} color="#f5c518" />
          <Text style={s.upcomingDateText}>{g.date} · {g.time}</Text>
        </View>
      </View>

      <View style={s.upcomingTeams}>
        <View style={s.teamCol}>
          <View style={[s.teamBadge, { borderColor: g.homeColor, backgroundColor: g.homeColor + "1a" }]}>
            <Ionicons name="shield" size={20} color={g.homeColor} />
          </View>
          <Text style={s.teamName} numberOfLines={1}>{g.homeTeam}</Text>
        </View>

        <Text style={s.vsText}>VS</Text>

        <View style={s.teamCol}>
          <View style={[s.teamBadge, { borderColor: g.awayColor, backgroundColor: g.awayColor + "1a" }]}>
            <Ionicons name="shield" size={20} color={g.awayColor} />
          </View>
          <Text style={s.teamName} numberOfLines={1}>{g.awayTeam}</Text>
        </View>
      </View>

      <View style={s.upcomingFooter}>
        <Ionicons name="location-outline" size={11} color="#3d3d3d" />
        <Text style={s.metaText}>{g.location}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Image
            source={require("@/assets/images/ballerzWideLogo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <View style={s.seasonBadge}>
            <Text style={s.seasonText}>{SEASON}</Text>
          </View>
        </View>

        {/* ── Stats Strip ─────────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          {appStats.map((stat, i) => (
            <View key={i} style={s.statChip}>
              <Text style={[s.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Last Match ──────────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>LAST MATCH</Text>
          <TouchableOpacity>
            <Text style={s.sectionLink}>All games</Text>
          </TouchableOpacity>
        </View>
        <MatchCard />

        {/* ── MVP ─────────────────────────────────────────────────────────── */}
        <Text style={[s.sectionTitle, s.mvpSectionTitle]}>LAST MVP</Text>
        <MVPHeroCard />

        {/* ── Upcoming ────────────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>UPCOMING</Text>
        </View>
        <UpcomingCard />

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={() => {}}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={s.ctaText}>Create Game</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: "#0a0a0a" },
  scroll:  { flex: 1 },
  content: { paddingBottom: 16 },

  // ── Header
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  logo:        { width: 130, height: 42 },
  seasonBadge: { backgroundColor: "#161616", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#242424" },
  seasonText:  { color: "#4a4a4a", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  // ── Stats
  statsRow:  { flexDirection: "row", marginHorizontal: 16, marginTop: 16, gap: 10 },
  statChip:  { flex: 1, backgroundColor: "#111", borderRadius: 14, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: "#1a1a1a" },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "#4a4a4a", fontWeight: "600", marginTop: 3, letterSpacing: 0.5, textTransform: "uppercase" },

  // ── Section headers
  sectionHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginTop: 24, marginBottom: 10 },
  sectionTitle:     { fontSize: 10, fontWeight: "700", color: "#4a4a4a", letterSpacing: 1.8, textTransform: "uppercase" },
  sectionLink:      { fontSize: 12, color: "#4a9eff", fontWeight: "600" },
  mvpSectionTitle:  { marginHorizontal: 16, marginTop: 24, marginBottom: 10 },

  // ── Match card
  matchCard: { marginHorizontal: 16, backgroundColor: "#111", borderRadius: 18, borderWidth: 1, borderColor: "#1a1a1a", overflow: "hidden" },
  cardRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  leagueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  leagueText:{ color: "#444", fontSize: 12, fontWeight: "600" },
  hairline:  { height: 1, backgroundColor: "#181818" },

  scoreRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 20 },
  teamCol:    { flex: 1, alignItems: "center", gap: 9 },
  teamBadge:  { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  teamName:   { color: "#aaa", fontSize: 12, fontWeight: "600", textAlign: "center" },
  scoreCenter:{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 },
  scoreNum:   { color: "#fff", fontSize: 34, fontWeight: "900" },
  scoreSep:   { color: "#2a2a2a", fontSize: 26, fontWeight: "300" },

  matchMeta: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 9, paddingBottom: 4 },
  metaItem:  { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText:  { color: "#3d3d3d", fontSize: 11 },

  cardMvpRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 7, borderTopWidth: 1, borderTopColor: "#181818", marginTop: 4 },
  cardMvpLabel:{ color: "#444", fontSize: 11, fontWeight: "600" },
  cardMvpName: { color: "#fff", fontSize: 12, fontWeight: "700", flex: 1 },
  cardMvpStat: { color: "#444", fontSize: 11 },

  // ── MVP hero card
  mvpCard:       { marginHorizontal: 16, borderRadius: 20, overflow: "hidden", height: 215, backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#1a1a1a" },
  mvpGlow:       { position: "absolute", backgroundColor: "#f5c518", alignSelf: "center" },
  mvpImage:      { position: "absolute", width: "55%", height: "100%", left: "22.5%" },
  mvpFadeTop:    { position: "absolute", top: 0,    left: 0, right: 0, height: 80  },
  mvpFadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 140 },
  mvpTopLabels:  { position: "absolute", top: 14, left: 0, right: 0, alignItems: "center" },
  mvpSub:        { color: "#555", fontSize: 11, fontWeight: "600", letterSpacing: 1.2 },
  mvpTitle:      { color: "#f5c518", fontSize: 16, fontWeight: "900", letterSpacing: 3.5, marginTop: 2 },
  mvpBottom:     { position: "absolute", bottom: 14, left: 0, right: 0, alignItems: "center", gap: 7 },
  mvpName:       { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: 0.3 },
  mvpMetaRow:    { flexDirection: "row", alignItems: "center", gap: 9 },
  mvpPosBadge:   { backgroundColor: "#1e1e1e", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  mvpPosText:    { color: "#555", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  mvpStatText:   { color: "#444", fontSize: 12 },

  // ── Upcoming card
  upcomingCard:    { marginHorizontal: 16, backgroundColor: "#111", borderRadius: 18, borderWidth: 1, borderColor: "#1a1a1a", padding: 16 },
  upcomingHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  upcomingLabel:   { color: "#4a4a4a", fontSize: 10, fontWeight: "700", letterSpacing: 1.8 },
  upcomingDateBadge:{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#1a1400", borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  upcomingDateText:{ color: "#f5c518", fontSize: 11, fontWeight: "600" },
  upcomingTeams:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
  vsText:          { color: "#2a2a2a", fontSize: 14, fontWeight: "800", letterSpacing: 1.5 },
  upcomingFooter:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 14 },

  // ── CTA
  cta:     { marginHorizontal: 16, marginTop: 24, backgroundColor: "#0039a3", borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
