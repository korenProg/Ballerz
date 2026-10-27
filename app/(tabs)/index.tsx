import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Text } from "../../components/ui/Text";
import { Redirect, useRouter } from "expo-router";
import { useStore } from "../../store";
import { useLastGame, useNextGame, useRivalry } from "../../store/selectors";
import GameScoreboard from "../../components/GameScoreboard";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import Section from "../../components/ui/Section";
import ListRow from "../../components/ui/ListRow";
import Tabs from "../../components/ui/Tabs";
import RatingBadge from "../../components/ui/RatingBadge";
import StatCompare from "../../components/ui/StatCompare";
import Button from "../../components/ui/Button";
import { T, SPACE } from "../../constants/theme";
import { formatDate, parseGameDate } from "../../utils/game";
import type { Game } from "../../types/games";
import type { Player } from "../../types/players";

const DAY_LETTERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEADER_TABS = [
  { key: "mvps", label: "MVPs" },
  { key: "rating", label: "Rating" },
  { key: "streak", label: "Streak" },
] as const;
type LeaderKey = (typeof LEADER_TABS)[number]["key"];

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

function DayStrip({ gameDates }: { gameDates: Set<string> }) {
  const today = new Date();
  const todayStr = formatDate(today);
  return (
    <View style={styles.days}>
      {Array.from({ length: 7 }, (_, i) => {
        const day = new Date(today);
        day.setDate(today.getDate() + i - 1);
        const key = formatDate(day);
        const isToday = key === todayStr;
        return (
          <View key={key} style={[styles.day, isToday ? styles.dayToday : null]}>
            <Text style={[styles.dayLetter, isToday ? styles.dayTextToday : null]}>
              {DAY_LETTERS[day.getDay()]}
            </Text>
            <Text style={[styles.dayNum, isToday ? styles.dayTextToday : null]}>{day.getDate()}</Text>
            <View style={[styles.dot, gameDates.has(key) ? styles.dotOn : null]} />
          </View>
        );
      })}
    </View>
  );
}

function MatchSection({ title, game }: { title: string; game: Game }) {
  const router = useRouter();
  return (
    <Section title={title} divider>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
        style={({ pressed }) => [styles.match, pressed ? styles.pressed : null]}
      >
        <GameScoreboard game={game} />
      </Pressable>
    </Section>
  );
}

function HeadToHead() {
  const rivalry = useRivalry();
  if (!rivalry) return null;
  const { teamA, teamB, winsA, winsB, draws, count, lastGame } = rivalry;
  const look = (team: string) =>
    lastGame.homeTeam.toLowerCase().trim() === team.toLowerCase().trim()
      ? { color: lastGame.homeColor, logo: lastGame.homeLogo }
      : { color: lastGame.awayColor, logo: lastGame.awayLogo };
  const a = look(teamA);
  const b = look(teamB);
  return (
    <Section title="Head to head" padded divider>
      <View style={styles.h2hTeams}>
        <View style={styles.h2hTeam}>
          <Crest name={teamA} color={a.color} logo={a.logo} size={28} />
          <Text style={styles.h2hName} numberOfLines={1}>
            {teamA}
          </Text>
        </View>
        <Text style={styles.h2hMeta}>{count} games</Text>
        <View style={[styles.h2hTeam, styles.h2hTeamRight]}>
          <Text style={styles.h2hName} numberOfLines={1}>
            {teamB}
          </Text>
          <Crest name={teamB} color={b.color} logo={b.logo} size={28} />
        </View>
      </View>
      <StatCompare label="Wins" home={winsA} away={winsB} homeColor={a.color} awayColor={b.color} />
      <Text style={styles.h2hDraws}>
        {draws} {draws === 1 ? "draw" : "draws"}
      </Text>
    </Section>
  );
}

function Leaders({ players, games }: { players: Player[]; games: Game[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<LeaderKey>(() =>
    players.some((p) => p.mvps > 0) ? "mvps" : "rating"
  );
  const finished = games
    .filter((g) => g.status === "FT")
    .sort((a, b) => parseGameDate(b.date) - parseGameDate(a.date));
  const statOf = (p: Player) =>
    mode === "mvps" ? p.mvps : mode === "rating" ? p.ovr : winStreak(p.id, finished);
  const top = [...players].sort((a, b) => statOf(b) - statOf(a) || b.ovr - a.ovr).slice(0, 5);

  return (
    <Section title="Leaders" footer="All players" onFooterPress={() => router.push("/players")} divider>
      <Tabs tabs={LEADER_TABS} value={mode} onChange={setMode} />
      {top.map((p, i) => (
        <ListRow
          key={p.id}
          onPress={() => router.push({ pathname: "/player/[id]", params: { id: p.id } })}
          leading={
            <View style={styles.rankWrap}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Crest name={p.name} logo={p.photo} size={32} variant="avatar" />
            </View>
          }
          title={p.name}
          subtitle={p.position}
          trailing={
            mode === "rating" ? (
              <RatingBadge value={p.ovr} />
            ) : i === 0 && statOf(p) > 0 ? (
              <RatingBadge value={statOf(p)} color={T.accent} />
            ) : (
              <Text style={styles.stat}>{statOf(p)}</Text>
            )
          }
          divider={i < top.length - 1}
        />
      ))}
    </Section>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const league = useStore((s) => s.league);
  const games = useStore((s) => s.games);
  const players = useStore((s) => s.players);
  const nextGame = useNextGame();
  const lastResult = useLastGame();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  const gameDates = new Set(games.map((g) => g.date).filter((d): d is string => !!d));
  const played = games.filter((g) => g.status === "FT").length;
  const hasPlayers = players.length > 0;

  return (
    <View style={styles.main}>
      <ScreenHeader
        crest={
          <Crest
            name={league.name || "League"}
            color={league.color}
            logo={league.logoUri ?? undefined}
            size={36}
          />
        }
        title={league.name || "My League"}
        subtitle={`${played} played · ${players.length} players`}
        actions={[
          { icon: "settings-outline", label: "League settings", onPress: () => router.push("/league") },
        ]}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} colors={[T.accent]} />
        }
      >
        <DayStrip gameDates={gameDates} />

        {nextGame ? (
          <MatchSection title={nextGame.status === "Live" ? "Live now" : "Next match"} game={nextGame} />
        ) : null}
        {lastResult ? <MatchSection title="Last result" game={lastResult} /> : null}

        {!nextGame && !lastResult ? (
          <Section title="No games yet" padded divider>
            <View style={styles.prompt}>
              <Text style={styles.body}>
                {hasPlayers
                  ? "Set up your first match to get the season going."
                  : "Add your players first, then set up a match."}
              </Text>
              <Button
                label={hasPlayers ? "Create game" : "Add player"}
                onPress={() => router.push(hasPlayers ? "/create-game" : "/create-player")}
              />
            </View>
          </Section>
        ) : null}

        <HeadToHead />
        {hasPlayers ? <Leaders players={players} games={games} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  days: { flexDirection: "row", gap: SPACE.xs },
  day: { alignItems: "center", flex: 1, paddingVertical: SPACE.sm, borderRadius: 12, gap: 2 },
  dayToday: { backgroundColor: T.surface },
  dayLetter: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  dayNum: { fontSize: 15, fontWeight: "600", color: T.textDim, fontVariant: ["tabular-nums"] },
  dayTextToday: { color: T.text },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  dotOn: { backgroundColor: T.accent },
  match: { paddingHorizontal: SPACE.lg },
  pressed: { backgroundColor: T.surfaceAlt },
  prompt: { gap: SPACE.md },
  body: { fontSize: 14, fontWeight: "400", color: T.textDim, lineHeight: 20 },
  h2hTeams: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.sm },
  h2hTeam: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  h2hTeamRight: { justifyContent: "flex-end" },
  h2hName: { fontSize: 15, fontWeight: "600", color: T.text, flexShrink: 1 },
  h2hMeta: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  h2hDraws: { fontSize: 12, fontWeight: "500", color: T.textFaint, textAlign: "center" },
  rankWrap: { flexDirection: "row", alignItems: "center", gap: SPACE.md },
  rank: {
    width: 14,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: T.textFaint,
    fontVariant: ["tabular-nums"],
  },
  stat: {
    minWidth: 36,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
});
