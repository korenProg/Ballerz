import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Redirect, router, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../../store";
import { useAppStats } from "../../store/selectors";
import { T } from "../../constants/theme";
import type { Game } from "../../types/games";
import { Leaderboard } from "@/components/Leaderboard";

function HeroContent({
  leagueName,
  logoUri,
  color,
  adminName,
  gamesCount,
  playersCount,
}: {
  leagueName: string;
  logoUri: string | null;
  color: string;
  adminName: string;
  gamesCount: number;
  playersCount: number;
}) {
  return (
    <View style={s.heroInner}>
      <TouchableOpacity style={s.logoWrap} activeOpacity={0.8}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={s.heroLogo} />
        ) : (
          <View style={s.heroLogoFallback}>
            <Ionicons name="trophy" size={44} color={color} />
          </View>
        )}
      </TouchableOpacity>

      <Text style={s.heroName} numberOfLines={1}>
        {leagueName || "My League"}
      </Text>
      {adminName ? <Text style={s.heroAdmin}>{adminName}</Text> : null}

      <View style={s.heroStats}>
        <View style={s.heroStatItem}>
          <Text style={s.heroStatVal}>{playersCount}</Text>
          <Text style={s.heroStatLbl}>PLAYERS</Text>
        </View>
        <View style={s.heroStatDivider} />
        <View style={s.heroStatItem}>
          <Text style={s.heroStatVal}>{gamesCount}</Text>
          <Text style={s.heroStatLbl}>GAMES</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/league")}
        style={s.heroCtaWrap}
      >
        <View style={s.heroCta}>
          <Text style={s.heroCtaTxt}>Manage League</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}


function GameCard({ g }: { g: Game }) {
  return (
    <View style={s.gameCard}>
      <View style={s.gameCardTop}>
        <View style={s.ftPill}>
          <Text style={s.ftTxt}>FT</Text>
        </View>
        {g.date ? <Text style={s.gameDate}>{g.date}</Text> : null}
      </View>
      <View style={s.gameTeams}>
        <View style={s.gameTeamSide}>
          <View style={[s.teamDot, { backgroundColor: g.homeColor }]} />
          <Text style={s.gameTeamName} numberOfLines={1}>
            {g.homeTeam}
          </Text>
        </View>
        <Text style={s.gameScore}>
          {g.homeScore}
          <Text style={s.gameScoreSep}> – </Text>
          {g.awayScore}
        </Text>
        <View style={[s.gameTeamSide, { alignItems: "flex-end" }]}>
          <View style={[s.teamDot, { backgroundColor: g.awayColor }]} />
          <Text
            style={[s.gameTeamName, { textAlign: "right" }]}
            numberOfLines={1}
          >
            {g.awayTeam}
          </Text>
        </View>
      </View>
      {g.location ? (
        <View style={s.gameLocation}>
          <Ionicons name="location-outline" size={9} color={T.textMuted} />
          <Text style={s.gameLocationTxt}>{g.location}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const { gamesCount, playersCount } = useAppStats();
  const games = useStore((s) => s.games);
  const players = useStore((s) => s.players);
  const league = useStore((s) => s.league);

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  const recentGames = [...games]
    .filter((g) => g.status === "FT")
    .sort(
      (a, b) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
    )
    .slice(0, 4);

  return (
    <View style={s.root}>
      {/* Blurred logo watermark with built-in bottom fade */}
      {league.logoUri ? (
        <View style={s.bgIconWrap} pointerEvents="none">
          <Image source={{ uri: league.logoUri }} style={s.bgLogoImg} blurRadius={2} />
          <LinearGradient
            colors={["transparent", T.bg]}
            locations={[0.3, 1]}
            style={s.bgInnerFade}
          />
        </View>
      ) : (
        <View style={s.bgIconWrap} pointerEvents="none">
          <Ionicons name="trophy" size={210} color="rgba(255,255,255,0.25)" />
          <LinearGradient
            colors={["transparent", T.bg]}
            locations={[0.3, 1]}
            style={s.bgInnerFade}
          />
        </View>
      )}

      {/* Top color gradient */}
      <LinearGradient
        colors={[
          league.color + "ff",
          league.color + "ee",
          league.color + "cc",
          league.color + "99",
          league.color + "55",
          league.color + "22",
          T.bg + "00",
        ]}
        locations={[0, 0.1, 0.25, 0.42, 0.62, 0.82, 1]}
        style={s.gradientBg}
        pointerEvents="none"
      />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <HeroContent
          leagueName={league.name}
          logoUri={league.logoUri}
          color={league.color}
          adminName={league.adminName}
          gamesCount={gamesCount}
          playersCount={playersCount}
        />

        <View style={s.sheet}>
          {players.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>TOP PLAYERS</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/players")}>
                  <Text style={s.sectionLink}>See all</Text>
                </TouchableOpacity>
              </View>
              <View style={s.cardWrap}>
                <Leaderboard limit={3} />
              </View>
            </>
          )}

          {recentGames.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>RECENT GAMES</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/games")}>
                  <Text style={s.sectionLink}>See all</Text>
                </TouchableOpacity>
              </View>

              <View style={s.gamesGrid}>
                {recentGames.map((g) => (
                  <GameCard key={g.id} g={g} />
                ))}
              </View>
            </>
          )}

          {gamesCount === 0 && players.length === 0 && (
            <View style={s.startSection}>
              <Text style={s.sectionTitle}>GET STARTED</Text>
              <View style={s.startCards}>
                <TouchableOpacity
                  style={s.startCard}
                  activeOpacity={0.75}
                  onPress={() => router.push("/(tabs)/players")}
                >
                  <View style={[s.startIconWrap, s.startIconBlue]}>
                    <Ionicons name="people" size={22} color="#60a5fa" />
                  </View>
                  <Text style={s.startCardTitle}>Add Players</Text>
                  <Text style={s.startCardDesc}>Build your squad first</Text>
                  <View style={s.startCardBtn}>
                    <Text style={s.startCardBtnTxt}>Add Players</Text>
                  </View>
                </TouchableOpacity>

                <View style={[s.startCard, { opacity: 0.6 }]}>
                  <View style={[s.startIconWrap, s.startIconMuted]}>
                    <Ionicons name="football" size={22} color={T.textMuted} />
                  </View>
                  <Text style={[s.startCardTitle, { color: T.textMuted }]}>Create Game</Text>
                  <Text style={s.startCardDesc}>Add players first</Text>
                  <View style={[s.startCardBtn, s.startCardBtnMuted]}>
                    <Text style={[s.startCardBtnTxt, { color: T.textMuted }]}>Create Game</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 0 },

  sheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: T.border,
    marginTop: -20,
    paddingTop: 20,
    minHeight: 200,
  },

  headerGradient: { marginBottom: 8 },
  gradientBg: { position: "absolute", top: 0, left: 0, right: 0, height: 480 },
  bgIconWrap: { position: "absolute", top: 0, left: 0, right: 0, height: 480, alignItems: "center", justifyContent: "center", opacity: 0.42 },
  bgLogoImg: { width: 480, height: 480, borderRadius: 0},
  bgFadeBottom: { position: "absolute", top: 80, left: 0, right: 0, height: 320 },
  bgInnerFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: "70%" },
  heroInner: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  logoWrap: { marginBottom: 12 },
  heroLogo: {
    width: 120,
    height: 120,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgb(22, 22, 22)",
  },
  heroLogoFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroName: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  heroAdmin: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
    marginBottom: 14,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 0,
    marginTop: 12,
    marginBottom: 16,
    width: "100%",
  },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  heroStatVal: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroStatLbl: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },
  heroCtaWrap: {
    width: "100%",
    borderRadius: T.radius.pill,
    overflow: "hidden",
  },
  heroCta: {
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: T.accent,
  },
  heroCtaTxt: { color: "#000", fontSize: 14, fontWeight: "800" },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
    
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: T.textMuted,
  },
  sectionLink: { fontSize: 11, fontWeight: "700", color: "#f59e0b" },

  cardWrap: { marginHorizontal: 16, marginBottom: 20 },

  // Card wrapper
  card: {
    marginHorizontal: 16,
    backgroundColor: T.surface,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    marginBottom: 20,
  },

  // Table header
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  tableHeaderTxt: {
    fontSize: 8,
    fontWeight: "800",
    color: T.textMuted,
    letterSpacing: 1,
  },

  // Player row
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: T.border + "66",
  },
  rankNum: { width: 24, fontSize: 13, fontWeight: "800", color: T.textMuted },
  initials: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  initialsTxt: { fontSize: 10, fontWeight: "800", color: T.textSecondary },
  playerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: T.textPrimary,
  },
  playerStats: { flexDirection: "row", alignItems: "center", gap: 4 },
  playerStatCol: { width: 30, alignItems: "center" },
  playerStatVal: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  playerStatLbl: { fontSize: 8, color: T.textMuted, fontWeight: "600" },
  ovrBadge: {
    width: 40,
    alignItems: "center",
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  ovrTxt: { fontSize: 12, fontWeight: "900" },

  // Games grid
  gamesGrid: {
    marginHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  gameCard: {
    width: "47.5%",
    backgroundColor: T.surface,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
  },
  gameCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ftPill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ftTxt: {
    color: T.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  gameDate: { color: T.textMuted, fontSize: 9 },
  gameTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  gameTeamSide: { flex: 1, gap: 4 },
  teamDot: { width: 7, height: 7, borderRadius: 3.5 },
  gameTeamName: { color: T.textSecondary, fontSize: 11, fontWeight: "700" },
  gameScore: {
    fontSize: 16,
    fontWeight: "900",
    color: T.textPrimary,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  gameScoreSep: { color: T.textMuted, fontWeight: "300" },
  gameLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  gameLocationTxt: { color: T.textMuted, fontSize: 9 },

  // Empty state — get started
  startSection: { marginHorizontal: 16, marginBottom: 20 },
  startCards: { flexDirection: "row", gap: 10, marginTop: 10 },
  startCard: {
    flex: 1,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    padding: 16,
  },
  startIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  startIconBlue:  { backgroundColor: "rgba(96,165,250,0.12)" },
  startIconMuted: { backgroundColor: "rgba(255,255,255,0.06)" },
  startCardTitle: { color: T.textPrimary, fontSize: 13, fontWeight: "800", marginBottom: 4 },
  startCardDesc:  { color: T.textMuted, fontSize: 11, marginBottom: 10 },
  startCardBtn: {
    backgroundColor: T.accent,
    borderRadius: T.radius.pill,
    paddingVertical: 9,
    alignItems: "center",
  },
  startCardBtnMuted: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: T.border,
  },
  startCardBtnTxt: { color: "#000", fontSize: 11, fontWeight: "800" },
});
