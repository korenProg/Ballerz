import { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../../store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T } from "../../constants/theme";
import type { Game } from "../../types/games";
import type { Player } from "../../types/players";

const DAY_LETTERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

const LEADERBOARD_MODES = [
  { key: "mvps", label: "MVPs", icon: "trophy", title: "Top MVPs" },
  { key: "rating", label: "Rating", icon: "star", title: "Top Rated" },
  { key: "streak", label: "Streak", icon: "flame", title: "Win Streaks" },
] as const;

type LeaderboardMode = (typeof LEADERBOARD_MODES)[number]["key"];

function formatDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function parseGameDate(date?: string) {
  if (!date) return 0;
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function winStreak(playerId: string, finishedGames: Game[]) {
  let streak = 0;
  for (const g of finishedGames) {
    const inHome = (g.homePlayers ?? []).some((p) => p.id === playerId);
    const inAway = (g.awayPlayers ?? []).some((p) => p.id === playerId);
    if (!inHome && !inAway) continue;
    const won = inHome ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
    if (!won) break;
    streak++;
  }
  return streak;
}

function WeekStrip({ gameDates, leagueColor }: { gameDates: Set<string>; leagueColor: string }) {
  const today = new Date();
  const todayStr = formatDate(today);

  return (
    <View style={styles.weekRow}>
      {Array.from({ length: 6 }, (_, i) => {
        const day = new Date(today);
        day.setDate(today.getDate() + (i - 1));
        const dateStr = formatDate(day);
        const hasGame = gameDates.has(dateStr);
        const isToday = dateStr === todayStr;

        return (
          <View
            key={i}
            style={[
              styles.dayCard,
              isToday && !hasGame && styles.dayCardToday,
              hasGame && { backgroundColor: leagueColor, borderColor: leagueColor },
            ]}
          >
            <Text style={[styles.dayNum, (hasGame || isToday) && styles.dayNumActive]}>{day.getDate()}</Text>
            <Text style={[styles.dayLabel, (hasGame || isToday) && styles.dayLabelActive]}>{DAY_LETTERS[day.getDay()]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function teamInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function LeagueStatsCard({
  leagueName,
  logoUri,
  gamesPlayed,
  playersCount,
}: {
  leagueName: string;
  logoUri: string | null;
  gamesPlayed: number;
  playersCount: number;
}) {
  const router = useRouter();

  return (
    <View style={styles.leagueCard}>
      {logoUri && (
        <>
          <Image source={{ uri: logoUri }} style={styles.leagueBgImage} resizeMode="cover" blurRadius={8} />
          <LinearGradient
            colors={["rgba(17,21,37,0)", "rgba(17,21,37,0.7)", T.surface]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.leagueBgFade}
            pointerEvents="none"
          />
        </>
      )}

      <View style={styles.leagueHeader}>
        <Text style={styles.leagueEyebrow}>YOUR LEAGUE</Text>
        <Text style={styles.leagueName} numberOfLines={1}>{leagueName || "My League"}</Text>
      </View>

      <View style={styles.leagueStatsRow}>
        <View style={styles.leagueStat}>
          <Text style={styles.leagueStatValue}>{gamesPlayed}</Text>
          <Text style={styles.leagueStatLabel}>Games</Text>
        </View>

        <View style={styles.leagueStat}>
          <Text style={styles.leagueStatValue}>{playersCount}</Text>
          <Text style={styles.leagueStatLabel}>Players</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.manageLeagueBtn} activeOpacity={0.8} onPress={() => router.push("/league")}>
        <Text style={styles.manageLeagueTxt}>Manage League</Text>
      </TouchableOpacity>
    </View>
  );
}

function CreateGameCard() {
  const router = useRouter();
  return (
    <View style={styles.gameCard}>
      <Ionicons
        name="football"
        size={220}
        color={T.textSecondary + "22"}
        style={styles.cardWatermark}
      />

      <View style={styles.emptyState}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="football" size={24} color={T.textSecondary} />
        </View>
        <Text style={styles.emptyStateTitle}>No games yet</Text>
        <Text style={styles.emptyStateSub}>Create your first game to get the season going</Text>
        <TouchableOpacity
          style={styles.emptyStateBtn}
          activeOpacity={0.8}
          onPress={() => router.push("/create-game")}
        >
          <Text style={styles.emptyStateBtnTxt}>Create Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LastGameCard({ game }: { game: Game }) {
  return (
    <View style={styles.gameCard}>
      <Ionicons
        name="football"
        size={220}
        color={T.textSecondary + "22"}
        style={styles.cardWatermark}
      />

      <View style={styles.gameCardHeader}>
        <Text style={styles.gameCardLocation}>{game.location || "Match"}</Text>
        {game.date ? <Text style={styles.gameCardSub}>{game.date}</Text> : null}
      </View>

      <View style={styles.gameCardMiddle}>
        <View style={styles.teamCol}>
          <View style={[styles.teamBadge, { backgroundColor: game.homeColor }]}>
            <Text style={styles.teamBadgeTxt}>{teamInitials(game.homeTeam)}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>{game.homeTeam}</Text>
        </View>

        <View style={styles.centerCol}>
          <Text style={styles.gameScore}>
            {game.homeScore} : {game.awayScore}
          </Text>

          <View style={styles.statusPill}>
            {game.status === "Live" ? (
              <>
                <View style={styles.liveDot} />
                <Text style={styles.statusTxt}>LIVE</Text>
              </>
            ) : (
              <Text style={styles.statusTxt}>{game.status === "FT" ? "FT" : "SOON"}</Text>
            )}
          </View>
        </View>

        <View style={styles.teamCol}>
          <View style={[styles.teamBadge, { backgroundColor: game.awayColor }]}>
            <Text style={styles.teamBadgeTxt}>{teamInitials(game.awayTeam)}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>{game.awayTeam}</Text>
        </View>
      </View>
    </View>
  );
}

function MvpLeaderboardCard({ players, games }: { players: Player[]; games: Game[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<LeaderboardMode>(() =>
    players.some((p) => p.mvps > 0) ? "mvps" : "rating"
  );

  const activeMode = LEADERBOARD_MODES.find((m) => m.key === mode) ?? LEADERBOARD_MODES[0];

  const finishedGames = [...games]
    .filter((g) => g.status === "FT")
    .sort((a, b) => parseGameDate(b.date) - parseGameDate(a.date));

  const statOf = (p: Player) =>
    mode === "mvps" ? p.mvps : mode === "rating" ? p.ovr : winStreak(p.id, finishedGames);

  const top = [...players]
    .sort((a, b) => statOf(b) - statOf(a) || b.ovr - a.ovr)
    .slice(0, 3);

  return (
    <View style={styles.leaderboardCard}>
      <Ionicons
        name={activeMode.icon}
        size={220}
        color={T.textSecondary + "22"}
        style={styles.cardWatermark}
      />

      {top.length ? (
        <>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardEyebrow}>LEADERBOARD</Text>
            <Text style={styles.leaderboardTitle}>{activeMode.title}</Text>
          </View>

          <View style={styles.leaderboardModes}>
            {LEADERBOARD_MODES.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.leaderboardModeChip, mode === m.key && styles.leaderboardModeChipActive]}
                activeOpacity={0.8}
                onPress={() => setMode(m.key)}
              >
                <Ionicons name={m.icon} size={12} color={mode === m.key ? T.textPrimary : T.textSecondary} />
                <Text style={[styles.leaderboardModeTxt, mode === m.key && styles.leaderboardModeTxtActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {top.map((player, i) => (
            <View key={player.id} style={[styles.leaderboardRow, i === 0 && styles.leaderboardRowFirst]}>
              <View style={styles.leaderboardAvatarWrap}>
                {player.photo ? (
                  <Image source={{ uri: player.photo }} style={[styles.leaderboardPhoto, { borderColor: RANK_COLORS[i] }]} />
                ) : (
                  <View style={[styles.leaderboardPhotoFallback, { borderColor: RANK_COLORS[i] }]}>
                    <Text style={styles.leaderboardInitial}>{player.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.leaderboardRankBadge, { backgroundColor: RANK_COLORS[i] }]}>
                  <Text style={styles.leaderboardRankTxt}>{i + 1}</Text>
                </View>
              </View>

              <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardName} numberOfLines={1}>{player.name}</Text>
                <Text style={styles.leaderboardPosition}>{player.position}</Text>
              </View>

              <View style={styles.leaderboardMvpPill}>
                <Ionicons name={activeMode.icon} size={12} color={RANK_COLORS[i]} />
                <Text style={styles.leaderboardMvpValue}>{statOf(player)}</Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="people" size={24} color={T.textSecondary} />
          </View>
          <Text style={styles.emptyStateTitle}>No players yet</Text>
          <Text style={styles.emptyStateSub}>Add your first players to kick off the leaderboard</Text>
          <TouchableOpacity
            style={styles.emptyStateBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/create-player")}
          >
            <Text style={styles.emptyStateBtnTxt}>Add Player</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const adminName = useStore((s) => s.league.adminName);
  const logoUri = useStore((s) => s.league.logoUri);
  const leagueColor = useStore((s) => s.league.color);
  const leagueName = useStore((s) => s.league.name);
  const games = useStore((s) => s.games);
  const players = useStore((s) => s.players);
  const resetAll = useStore((s) => s.resetAll);
  const insets = useSafeAreaInsets();
  // Measured so the under-bar fade gradient sits exactly below the fixed header.
  const [headerH, setHeaderH] = useState(0);
  // Pull-to-refresh loading animation at the top.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  const gameDates = new Set(games.map((g) => g.date).filter((d): d is string => !!d));
  const lastGame = games.length
    ? [...games].sort((a, b) => parseGameDate(b.date) - parseGameDate(a.date))[0]
    : null;
  const gamesPlayed = games.filter((g) => g.status === "FT").length;

  return (
    <View style={styles.main}>
      {/* Background glow near the top that fades into the app bg (behind content). */}
      <LinearGradient
        colors={["rgba(17,21,37,0.9)", "rgba(17,21,37,0.35)", "transparent"]}
        locations={[0, 0.55, 1]}
        style={[styles.headerFade, { top: headerH }]}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerH }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={leagueColor}
            colors={[leagueColor]}
          />
        }
      >
        <WeekStrip gameDates={gameDates} leagueColor={leagueColor} />

        <LeagueStatsCard
          leagueName={leagueName}
          logoUri={logoUri}
          gamesPlayed={gamesPlayed}
          playersCount={players.length}
        />

        {lastGame ? <LastGameCard game={lastGame} /> : players.length > 0 ? <CreateGameCard /> : null}

        <MvpLeaderboardCard players={players} games={games} />
      </ScrollView>

      {/* Bottom divider for the bar: glows in the center, fades at the edges. */}
      <LinearGradient
        colors={["transparent", T.border, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerBorder, { top: headerH }]}
        pointerEvents="none"
      />

      {/* Fixed, solid top bar. */}
      <View
        style={[styles.headerBar, { paddingTop: insets.top + 8 }]}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{timegreet()}</Text>
          <Text style={styles.name}>{adminName}</Text>
        </View>

        <View style={styles.headerActions}>
          {/* TEMP: dev-only reset button — remove before release */}
          <TouchableOpacity onPress={resetAll} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={T.textMuted} />
          </TouchableOpacity>

          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="trophy" size={20} color={T.textSecondary} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const timegreet = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const styles = StyleSheet.create({
  main: { flexDirection: "column", flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingBottom: 24 },
  headerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 140,
  },
  headerBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1.5,
    zIndex: 2,
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    backgroundColor: T.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  greetingContainer: { alignItems: "flex-start" },
  greeting: { fontSize: 14, color: T.textSecondary, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: "bold", color: T.textPrimary },
  logo: { width: 44, height: 44, borderRadius: 22 },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  dayCard: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: 14,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dayCardToday: {
    backgroundColor: T.border,
    borderColor: T.border,
  },
  dayLabel: { fontSize: 11, fontWeight: "700", color: T.textMuted },
  dayLabelActive: { color: "rgba(255,255,255,0.8)" },
  dayNum: { fontSize: 20, fontWeight: "800", color: T.textPrimary },
  dayNumActive: { color: "#fff" },

  leagueCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 24,
    paddingVertical: 28,
    backgroundColor: T.surface,
    gap: 24,
    overflow: "hidden",
  },
  leagueBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  leagueBgFade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  leagueHeader: { gap: 6 },
  leagueEyebrow: { fontSize: 12, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  leagueName: { fontSize: 28, fontWeight: "900", color: T.textPrimary },
  leagueStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  leagueStat: { alignItems: "center", gap: 4 },
  leagueStatValue: { fontSize: 22, fontWeight: "900", color: T.textPrimary },
  leagueStatLabel: { fontSize: 11, color: T.textMuted, fontWeight: "700" },
  manageLeagueBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: T.textPrimary,
    alignItems: "center",
  },
  manageLeagueTxt: { fontSize: 13, fontWeight: "800", color: T.bg },

  gameCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    padding: 18,
    backgroundColor: T.surface,
    overflow: "hidden",
  },
  gameCardHeader: { alignItems: "center", marginBottom: 18 },
  gameCardLocation: { fontSize: 15, fontWeight: "800", color: T.textPrimary },
  gameCardSub: { fontSize: 11, color: T.textMuted, marginTop: 2 },
  gameCardMiddle: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  teamCol: { alignItems: "center", gap: 8, maxWidth: 90 },
  centerCol: { alignItems: "center", gap: 8 },
  teamBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: T.border,
  },
  teamBadgeTxt: { fontSize: 16, fontWeight: "900", color: "#fff" },
  gameScore: { fontSize: 32, fontWeight: "900", color: T.textPrimary },
  teamName: { fontSize: 13, fontWeight: "700", color: T.textPrimary },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
  statusTxt: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 1 },

  leaderboardCard: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 18,
    backgroundColor: T.surface,
    gap: 14,
    overflow: "hidden",
  },
  cardWatermark: {
    position: "absolute",
    top: -60,
    right: -60,
    transform: [{ rotate: "-15deg" }],
  },
  leaderboardModes: { flexDirection: "row", gap: 8 },
  leaderboardModeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  leaderboardModeChipActive: { backgroundColor: T.border },
  leaderboardModeTxt: { fontSize: 12, fontWeight: "700", color: T.textSecondary },
  leaderboardModeTxtActive: { color: T.textPrimary, fontWeight: "800" },
  leaderboardHeader: { gap: 4, marginBottom: 2 },
  leaderboardEyebrow: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  leaderboardTitle: { fontSize: 20, fontWeight: "900", color: T.textPrimary },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 12,
  },
  leaderboardRowFirst: {
    backgroundColor: "rgba(255,215,0,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  leaderboardAvatarWrap: { position: "relative" },
  leaderboardPhoto: { width: 48, height: 48, borderRadius: 24, borderWidth: 2 },
  leaderboardPhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  leaderboardInitial: { fontSize: 18, fontWeight: "800", color: T.textPrimary },
  leaderboardRankBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: T.surface,
  },
  leaderboardRankTxt: { fontSize: 10, fontWeight: "900", color: T.bg },
  leaderboardInfo: { flex: 1, gap: 2 },
  leaderboardName: { fontSize: 15, fontWeight: "800", color: T.textPrimary },
  leaderboardPosition: { fontSize: 11, color: T.textMuted, fontWeight: "700" },
  leaderboardMvpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  leaderboardMvpValue: { fontSize: 15, fontWeight: "900", color: T.textPrimary },
  emptyState: { alignItems: "center", gap: 6, paddingVertical: 12 },
  emptyStateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: "900", color: T.textPrimary },
  emptyStateSub: { fontSize: 12, color: T.textSecondary, textAlign: "center" },
  emptyStateBtn: {
    marginTop: 12,
    backgroundColor: T.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyStateBtnTxt: { fontSize: 13, fontWeight: "800", color: T.bg },
});
