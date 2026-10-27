import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Text } from "../../components/ui/Text";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../../store";
import { useLastGame, useNextGame, usePlayerRivalries, useTeamOfLeague } from "../../store/selectors";
import GameScoreboard from "../../components/GameScoreboard";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import Section from "../../components/ui/Section";
import ListRow from "../../components/ui/ListRow";
import Tabs from "../../components/ui/Tabs";
import RatingBadge from "../../components/ui/RatingBadge";
import ResultChip from "../../components/ui/ResultChip";
import RivalryVersus from "../../components/RivalryVersus";
import Button from "../../components/ui/Button";
import { T, TYPE, SPACE, RADIUS } from "../../constants/theme";
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

// Hex team colour → a translucent wash for the card's glow; other colour
// formats simply get no glow.
const wash = (color?: string) => (color && /^#[0-9a-f]{6}$/i.test(color) ? `${color}59` : null);

function TeamOfTheLeague() {
  const team = useTeamOfLeague();
  if (!team) return null;
  const glow = wash(team.color);
  return (
    <View style={styles.totl}>
      {glow ? (
        <LinearGradient
          colors={[glow, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View style={styles.totlHead}>
        <Ionicons name="trophy" size={16} color={T.yellow} />
        <Text style={styles.totlTitle}>Team of the league</Text>
      </View>
      <View style={styles.totlDivider} />
      <View style={styles.totlBody}>
        <View style={styles.totlTeam}>
          <Crest name={team.name} color={team.color ?? T.surfaceAlt} logo={team.logo} size={64} />
          <View style={styles.totlText}>
            <Text style={styles.totlName} numberOfLines={1}>
              {team.name}
            </Text>
            <Text style={styles.totlSub}>
              {team.wins} wins · {team.winRate}% win rate
            </Text>
            <View style={styles.totlForm} accessible accessibilityLabel={`Form: ${team.form.join(", ")}`}>
              {team.form.map((r, i) => (
                <ResultChip key={i} result={r} />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.totlStats}>
          {(
            [
              ["Played", team.played],
              ["Won", team.wins],
              ["Drawn", team.draws],
              ["Lost", team.losses],
            ] as const
          ).map(([label, value]) => (
            <View key={label} style={styles.totlStat}>
              <Text style={styles.totlStatNum}>{value}</Text>
              <Text style={styles.totlStatLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// The two players who have met most often on opposite sides (3+ games).
function HeadToHead({ players }: { players: Player[] }) {
  const router = useRouter();
  const rivalry = usePlayerRivalries()[0];
  if (!rivalry) return null;
  return (
    <Section title="Head to head" padded divider>
      <RivalryVersus
        rivalry={rivalry}
        roster={players}
        onOpen={(id) => router.push({ pathname: "/player/[id]", params: { id } })}
      />
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

        <TeamOfTheLeague />
        <HeadToHead players={players} />
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
  totl: { backgroundColor: T.surface, borderRadius: RADIUS.card, overflow: "hidden" },
  totlHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.md,
  },
  totlTitle: TYPE.sectionTitle,
  totlDivider: { height: StyleSheet.hairlineWidth, backgroundColor: T.divider },
  totlBody: { padding: SPACE.lg, gap: SPACE.lg },
  totlTeam: { flexDirection: "row", alignItems: "center", gap: SPACE.lg },
  totlText: { flex: 1, gap: 4 },
  totlName: { fontSize: 22, fontWeight: "700", color: T.text },
  totlSub: { fontSize: 13, fontWeight: "500", color: T.textDim, fontVariant: ["tabular-nums"] },
  totlForm: { flexDirection: "row", gap: 6, marginTop: SPACE.xs },
  totlStats: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: RADIUS.control,
    paddingVertical: SPACE.md,
  },
  totlStat: { flex: 1, alignItems: "center", gap: 2 },
  totlStatNum: { fontSize: 20, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  totlStatLabel: { fontSize: 12, fontWeight: "500", color: T.textFaint },
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
